import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';

const getBackendUrl = () => {
  return (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
};

const formatDuration = (seconds = 0) => {
  const sec = Math.max(0, Math.round(Number(seconds) || 0));
  if (sec === 0) return '0s';
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (mins < 60) {
    return remSec > 0 ? `${mins}m ${remSec}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
};

// Formats date to dd-mm-yyyy hh:mm aa
const formatDateTimeDMY = (dateVal) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');

    return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
  } catch {
    return '—';
  }
};

const formatShortDate = (dateVal) => {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  } catch {
    return '—';
  }
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return 'Just now';
  try {
    const now = new Date();
    const past = new Date(dateStr);
    const diffSec = Math.floor((now - past) / 1000);

    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    const days = Math.floor(diffSec / 86400);
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days}d ago`;
    return formatShortDate(past);
  } catch {
    return 'Recently';
  }
};

const getCountryFlag = (code = '') => {
  if (!code || code === 'UN' || code === 'LOCAL') return '🌐';
  try {
    const codePoints = code
      .toUpperCase()
      .slice(0, 2)
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
};

const Analytics = () => {
  // Current user email
  const userEmail = useMemo(() => {
    try {
      const stored = localStorage.getItem('user') || localStorage.getItem('user_profile');
      if (stored) {
        const parsed = JSON.parse(stored);
        return (parsed.emailId || parsed.email || (typeof stored === 'string' && !stored.startsWith('{') ? stored : '') || '').toLowerCase();
      }
    } catch {
      // Fallback
    }
    return '';
  }, []);

  const [flipbooks, setFlipbooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null); // null represents overall, or specific v_id
  const [selectedDays, setSelectedDays] = useState(30); // 7, 30, 90, 365
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'sessions' | 'daily' | 'books'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Advanced Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [browserFilter, setBrowserFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState(null);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [hoveredDayIdx, setHoveredDayIdx] = useState(null);

  // Fetch creator's flipbooks
  useEffect(() => {
    if (!userEmail) return;
    const fetchBooks = async () => {
      try {
        const backendUrl = getBackendUrl();
        const res = await axios.get(`${backendUrl}/api/flipbook/list`, {
          params: { emailId: userEmail }
        });
        if (res.data && Array.isArray(res.data.flipbooks)) {
          setFlipbooks(res.data.flipbooks.filter(b => !b.trash));
        }
      } catch (err) {
        console.warn('Could not load flipbooks list:', err);
      }
    };
    fetchBooks();
  }, [userEmail]);

  // Fetch analytics for user overall or specific flipbook
  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const backendUrl = getBackendUrl();
      if (!selectedBookId) {
        const res = await axios.get(`${backendUrl}/api/analytics/user/${encodeURIComponent(userEmail)}`, {
          params: { days: selectedDays }
        });
        setAnalyticsData({
          mode: 'OVERALL',
          ...res.data
        });
      } else {
        const res = await axios.get(`${backendUrl}/api/analytics/book/${selectedBookId}`, {
          params: { days: selectedDays }
        });
        setAnalyticsData({
          mode: 'SINGLE',
          ...res.data
        });
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userEmail, selectedBookId, selectedDays]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Reset pagination on filter or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, deviceFilter, countryFilter, browserFilter, activeTab, selectedBookId]);

  // Selected Flipbook Details
  const selectedFlipbookObj = useMemo(() => {
    if (!selectedBookId) return null;
    return flipbooks.find(b => b.v_id === selectedBookId) || null;
  }, [selectedBookId, flipbooks]);

  // Primary Metrics
  const summary = useMemo(() => {
    if (!analyticsData) {
      return { totalViews: 0, uniqueVisitors: 0, avgDuration: 0, totalDuration: 0, avgPagesRead: 1 };
    }
    if (analyticsData.mode === 'SINGLE') {
      return {
        totalViews: analyticsData.summary?.totalViews || 0,
        uniqueVisitors: analyticsData.summary?.uniqueViewers || 0,
        avgDuration: analyticsData.summary?.avgDurationSeconds || 0,
        totalDuration: analyticsData.summary?.totalDurationSeconds || 0,
        avgPagesRead: analyticsData.summary?.avgPagesRead || 1
      };
    }
    return {
      totalViews: analyticsData.totalViews || 0,
      uniqueVisitors: analyticsData.uniqueVisitors || 0,
      avgDuration: analyticsData.avgDurationSeconds || 0,
      totalDuration: analyticsData.totalDurationSeconds || 0,
      avgPagesRead: 1
    };
  }, [analyticsData]);

  const devices = useMemo(() => analyticsData?.devices || [], [analyticsData]);
  const countries = useMemo(() => analyticsData?.countries || analyticsData?.topCountries || [], [analyticsData]);
  const states = useMemo(() => analyticsData?.states || analyticsData?.topStates || [], [analyticsData]);
  const cities = useMemo(() => analyticsData?.cities || [], [analyticsData]);
  const dailyViews = useMemo(() => analyticsData?.dailyViews || [], [analyticsData]);
  const topBooks = useMemo(() => analyticsData?.topBooks || [], [analyticsData]);
  const recentSessions = useMemo(() => analyticsData?.recentSessions || [], [analyticsData]);

  // Distinct country and browser lists for filters
  const availableCountries = useMemo(() => {
    const set = new Set();
    recentSessions.forEach(s => {
      if (s.location?.country && s.location.country !== 'Unknown') {
        set.add(s.location.country);
      }
    });
    return Array.from(set).sort();
  }, [recentSessions]);

  const availableBrowsers = useMemo(() => {
    const set = new Set();
    recentSessions.forEach(s => {
      if (s.device?.browser && s.device.browser !== 'Unknown') {
        set.add(s.device.browser);
      }
    });
    return Array.from(set).sort();
  }, [recentSessions]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return recentSessions.filter((sess) => {
      if (deviceFilter !== 'ALL' && sess.device?.type !== deviceFilter) {
        return false;
      }
      if (countryFilter !== 'ALL' && sess.location?.country !== countryFilter) {
        return false;
      }
      if (browserFilter !== 'ALL' && sess.device?.browser !== browserFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const country = (sess.location?.country || '').toLowerCase();
      const state = (sess.location?.state || '').toLowerCase();
      const city = (sess.location?.city || '').toLowerCase();
      const bookName = (sess.flipbookName || '').toLowerCase();
      const browser = (sess.device?.browser || '').toLowerCase();
      const os = (sess.device?.os || '').toLowerCase();
      const dateFormatted = formatDateTimeDMY(sess.startedAt).toLowerCase();

      return (
        country.includes(q) ||
        state.includes(q) ||
        city.includes(q) ||
        bookName.includes(q) ||
        browser.includes(q) ||
        os.includes(q) ||
        dateFormatted.includes(q)
      );
    });
  }, [recentSessions, searchQuery, deviceFilter, countryFilter, browserFilter]);

  // Paginated Sessions
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSessions.slice(startIndex, startIndex + pageSize);
  }, [filteredSessions, currentPage, pageSize]);

  const totalPagesCount = Math.max(1, Math.ceil(filteredSessions.length / pageSize));

  // Date range label
  const dateRangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - selectedDays);
    return `${formatShortDate(start)} to ${formatShortDate(end)}`;
  }, [selectedDays]);

  // Clean, focused CSV export matching user requested schema:
  // Date & Time (dd-mm-yyyy hh:mm aa), Flipbook Name, Total Pages, Country, State, Device, Browser, View Count, Duration
  const handleExportCSV = () => {
    if (!filteredSessions || filteredSessions.length === 0) return;

    const headers = [
      "Date & Time",
      "Flipbook Name",
      "Total Pages",
      "Country",
      "State",
      "Device",
      "Browser",
      "View Count",
      "Duration"
    ];

    const rows = filteredSessions.map(s => {
      const dt = formatDateTimeDMY(s.startedAt);
      const name = (s.flipbookName || 'Untitled Flipbook').replace(/"/g, '""');
      const totPages = s.totalPages || 1;
      const c = (s.location?.country || 'Unknown').replace(/"/g, '""');
      const st = (s.location?.state && s.location.state !== 'Unknown' && s.location.state !== 'Local State' ? s.location.state : '—').replace(/"/g, '""');
      const dev = (s.device?.type || 'Desktop').replace(/"/g, '""');
      const brw = (s.device?.browser || 'Browser').replace(/"/g, '""');
      const viewCount = 1; // individual session view count
      const dur = formatDuration(s.durationSeconds);

      return `"${dt}","${name}",${totPages},"${c}","${st}","${dev}","${brw}",${viewCount},"${dur}"`;
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filenameId = selectedFlipbookObj ? (selectedFlipbookObj.flipbookName || 'flipbook').replace(/[^a-zA-Z0-9_-]/g, '_') : 'all_flipbooks';
    link.setAttribute("download", `Analytics_${filenameId}_${selectedDays}D.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col gap-[1.2vw] font-sans text-gray-800 pb-[3vw]">
      
      {/* 1. Header Toolbar with Brand Theme */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[1vw] pb-[1vw] border-b border-gray-100">
        <div>
          <div className="flex items-center gap-[0.6vw]">
            <div className="w-[2vw] h-[2vw] rounded-[0.5vw] bg-[#ea543a]/10 border border-[#ea543a]/25 flex items-center justify-center text-[#ea543a] shadow-xs">
              <Icon icon="solar:chart-2-bold" className="w-[1.2vw] h-[1.2vw]" />
            </div>
            <div>
              <h1 className="text-[1.25vw] font-bold text-gray-900 tracking-tight flex items-center gap-[0.4vw]">
                <span>Flipbook Analytics</span>
                {selectedFlipbookObj ? (
                  <span className="text-[0.72vw] font-semibold px-[0.6vw] py-[0.15vw] rounded-full bg-[#ea543a]/10 text-[#ea543a] border border-[#ea543a]/25 flex items-center gap-[0.3vw]">
                    <Icon icon="solar:book-2-bold" className="w-[0.8vw] h-[0.8vw]" />
                    <span className="max-w-[15vw] truncate">{selectedFlipbookObj.flipbookName || 'Selected Flipbook'}</span>
                  </span>
                ) : (
                  <span className="text-[0.72vw] font-semibold px-[0.6vw] py-[0.15vw] rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                    All Books Combined
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-[0.5vw] mt-[0.15vw] text-[0.72vw] text-gray-500">
                <span className="flex items-center gap-[0.25vw]">
                  <Icon icon="solar:calendar-linear" className="w-[0.85vw] h-[0.85vw] text-[#ea543a]" />
                  <span>Timeframe: <strong className="text-gray-700 font-semibold">{dateRangeLabel}</strong></span>
                </span>
                <span className="text-gray-300">•</span>
                <span>Updated {formatRelativeTime(lastUpdated)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-[0.5vw]">
          {/* Days Filter Pills */}
          <div className="flex bg-[#F4F4F5] p-[0.15vw] rounded-[0.5vw] border border-gray-200/80">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`text-[0.75vw] font-semibold px-[0.7vw] py-[0.35vw] rounded-[0.4vw] transition-all cursor-pointer ${
                  selectedDays === days
                    ? 'bg-[#ea543a] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing || loading}
            title="Refresh analytics data"
            className="flex items-center gap-[0.3vw] px-[0.75vw] py-[0.42vw] bg-white border border-gray-200 hover:border-[#ea543a]/40 hover:text-[#ea543a] text-gray-700 rounded-[0.5vw] text-[0.75vw] font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Icon icon="solar:restart-linear" className={`w-[0.85vw] h-[0.85vw] ${refreshing ? 'animate-spin text-[#ea543a]' : 'text-gray-500'}`} />
            <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredSessions.length === 0}
            title="Export filtered records to CSV"
            className="flex items-center gap-[0.35vw] px-[0.85vw] py-[0.42vw] bg-[#ea543a] hover:bg-[#d9482f] text-white rounded-[0.5vw] text-[0.75vw] font-semibold transition cursor-pointer disabled:opacity-40 shadow-xs hover:shadow-orange-500/20 active:scale-98"
          >
            <Icon icon="solar:download-minimalistic-bold" className="w-[0.85vw] h-[0.85vw]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Flipbook Selector Bar */}
      <div className="bg-white rounded-[0.75vw] border border-gray-200 p-[0.7vw] shadow-2xs">
        <div className="flex items-center justify-between mb-[0.4vw] px-[0.2vw]">
          <span className="text-[0.7vw] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-[0.3vw]">
            <Icon icon="solar:folder-with-files-bold" className="w-[0.85vw] h-[0.85vw] text-[#ea543a]" />
            <span>Select Flipbook to Inspect Alone</span>
          </span>
          {selectedBookId && (
            <button
              onClick={() => setSelectedBookId(null)}
              className="text-[0.7vw] font-semibold text-[#ea543a] hover:underline flex items-center gap-[0.2vw] cursor-pointer"
            >
              <Icon icon="solar:close-circle-linear" className="w-[0.8vw] h-[0.8vw]" />
              <span>Reset to All Flipbooks</span>
            </button>
          )}
        </div>

        {/* Horizontal Scrollable Flipbook Pills */}
        <div className="flex items-center gap-[0.45vw] overflow-x-auto pb-[0.2vw] [&::-webkit-scrollbar]:h-[3px] [&::-webkit-scrollbar-thumb]:bg-gray-300">
          {/* "All Flipbooks" Pill */}
          <button
            onClick={() => setSelectedBookId(null)}
            className={`flex-shrink-0 flex items-center gap-[0.4vw] px-[0.75vw] py-[0.4vw] rounded-[0.5vw] text-[0.75vw] font-semibold transition cursor-pointer border ${
              selectedBookId === null
                ? 'bg-gradient-to-r from-orange-50 to-orange-100/70 border-[#ea543a] text-[#ea543a] shadow-xs'
                : 'bg-[#F9F9F9] border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100/70'
            }`}
          >
            <Icon icon="solar:layers-bold" className={`w-[0.85vw] h-[0.85vw] ${selectedBookId === null ? 'text-[#ea543a]' : 'text-gray-500'}`} />
            <span>All Books Overview</span>
          </button>

          {/* Individual Flipbook Pills */}
          {flipbooks.map((b) => {
            const isSelected = selectedBookId === b.v_id;
            return (
              <button
                key={b.v_id}
                onClick={() => setSelectedBookId(b.v_id)}
                className={`flex-shrink-0 flex items-center gap-[0.4vw] px-[0.75vw] py-[0.4vw] rounded-[0.5vw] text-[0.75vw] font-semibold transition cursor-pointer border max-w-[17vw] ${
                  isSelected
                    ? 'bg-gradient-to-r from-orange-50 to-orange-100/70 border-[#ea543a] text-[#ea543a] shadow-xs'
                    : 'bg-[#F9F9F9] border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-100/70'
                }`}
                title={b.flipbookName}
              >
                <Icon icon="solar:book-2-bold" className={`w-[0.85vw] h-[0.85vw] flex-shrink-0 ${isSelected ? 'text-[#ea543a]' : 'text-gray-400'}`} />
                <span className="truncate">{b.flipbookName || 'Untitled Flipbook'}</span>
                {b.pages && (
                  <span className={`text-[0.65vw] px-[0.35vw] py-[0.05vw] rounded-full ${isSelected ? 'bg-orange-200/60 text-[#ea543a]' : 'bg-gray-200/70 text-gray-600'}`}>
                    {b.pages.length}p
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-[1vw] py-[0.6vw] rounded-[0.5vw] text-[0.75vw] flex items-center justify-between">
          <span className="flex items-center gap-[0.4vw]">
            <Icon icon="solar:danger-triangle-linear" className="w-[1vw] h-[1vw]" />
            {error}
          </span>
          <button onClick={() => loadAnalytics(true)} className="underline font-semibold cursor-pointer">Retry</button>
        </div>
      )}

      {/* 3. Primary Metric Cards (Distinct brand-themed color accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[0.8vw]">
        {/* Card 1: Total Views (Warm Orange Brand) */}
        <div className="bg-white rounded-[0.75vw] p-[1vw] border border-orange-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="absolute top-0 right-0 w-[4vw] h-[4vw] bg-gradient-to-bl from-orange-100/60 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[0.72vw] font-bold text-orange-900/80 uppercase tracking-wide">Total Read Views</span>
            <div className="w-[1.9vw] h-[1.9vw] rounded-[0.45vw] bg-orange-50 border border-orange-200 text-[#ea543a] flex items-center justify-center">
              <Icon icon="solar:eye-bold" className="w-[1.05vw] h-[1.05vw]" />
            </div>
          </div>
          <div className="mt-[0.6vw] relative z-10">
            <div className="text-[1.8vw] font-extrabold text-gray-900 tracking-tight leading-none">
              {summary.totalViews.toLocaleString()}
            </div>
            <div className="text-[0.7vw] text-orange-700/80 font-medium mt-[0.35vw] flex items-center gap-[0.25vw]">
              <Icon icon="solar:graph-up-bold" className="w-[0.75vw] h-[0.75vw] text-[#ea543a]" />
              <span>Across selected {selectedDays} days</span>
            </div>
          </div>
        </div>

        {/* Card 2: Unique Visitors (Emerald / Mint) */}
        <div className="bg-white rounded-[0.75vw] p-[1vw] border border-emerald-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="absolute top-0 right-0 w-[4vw] h-[4vw] bg-gradient-to-bl from-emerald-100/60 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[0.72vw] font-bold text-emerald-900/80 uppercase tracking-wide">Unique Visitors</span>
            <div className="w-[1.9vw] h-[1.9vw] rounded-[0.45vw] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Icon icon="solar:users-group-rounded-bold" className="w-[1.05vw] h-[1.05vw]" />
            </div>
          </div>
          <div className="mt-[0.6vw] relative z-10">
            <div className="text-[1.8vw] font-extrabold text-gray-900 tracking-tight leading-none">
              {summary.uniqueVisitors.toLocaleString()}
            </div>
            <div className="text-[0.7vw] text-emerald-700/80 font-medium mt-[0.35vw] flex items-center gap-[0.25vw]">
              <Icon icon="solar:shield-check-bold" className="w-[0.75vw] h-[0.75vw] text-emerald-600" />
              <span>Unique IP readers</span>
            </div>
          </div>
        </div>

        {/* Card 3: Avg Duration (Indigo / Slate) */}
        <div className="bg-white rounded-[0.75vw] p-[1vw] border border-indigo-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="absolute top-0 right-0 w-[4vw] h-[4vw] bg-gradient-to-bl from-indigo-100/60 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[0.72vw] font-bold text-indigo-900/80 uppercase tracking-wide">Avg. Session Time</span>
            <div className="w-[1.9vw] h-[1.9vw] rounded-[0.45vw] bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Icon icon="solar:clock-circle-bold" className="w-[1.05vw] h-[1.05vw]" />
            </div>
          </div>
          <div className="mt-[0.6vw] relative z-10">
            <div className="text-[1.8vw] font-extrabold text-gray-900 tracking-tight leading-none">
              {formatDuration(summary.avgDuration)}
            </div>
            <div className="text-[0.7vw] text-indigo-700/80 font-medium mt-[0.35vw] flex items-center gap-[0.25vw]">
              <Icon icon="solar:hourglass-line-bold" className="w-[0.75vw] h-[0.75vw] text-indigo-600" />
              <span>Average reading dwell time</span>
            </div>
          </div>
        </div>

        {/* Card 4: Cumulative Read Time (Amber / Sun) */}
        <div className="bg-white rounded-[0.75vw] p-[1vw] border border-amber-200/80 shadow-2xs relative overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow">
          <div className="absolute top-0 right-0 w-[4vw] h-[4vw] bg-gradient-to-bl from-amber-100/60 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[0.72vw] font-bold text-amber-900/80 uppercase tracking-wide">Cumulative Read Time</span>
            <div className="w-[1.9vw] h-[1.9vw] rounded-[0.45vw] bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Icon icon="solar:chart-square-bold" className="w-[1.05vw] h-[1.05vw]" />
            </div>
          </div>
          <div className="mt-[0.6vw] relative z-10">
            <div className="text-[1.8vw] font-extrabold text-gray-900 tracking-tight leading-none">
              {formatDuration(summary.totalDuration)}
            </div>
            <div className="text-[0.7vw] text-amber-700/80 font-medium mt-[0.35vw] flex items-center gap-[0.25vw]">
              <Icon icon="solar:fire-bold" className="w-[0.75vw] h-[0.75vw] text-amber-600" />
              <span>Combined engagement</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 text-[0.78vw]">
        <div className="flex items-center gap-[0.2vw]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-[0.4vw] pb-[0.65vw] px-[0.75vw] font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#ea543a] text-[#ea543a]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon icon="solar:graph-up-linear" className="w-[0.9vw] h-[0.9vw]" />
            <span>Overview & Activity</span>
          </button>

          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex items-center gap-[0.4vw] pb-[0.65vw] px-[0.75vw] font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'sessions'
                ? 'border-[#ea543a] text-[#ea543a]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon icon="solar:user-check-rounded-linear" className="w-[0.9vw] h-[0.9vw]" />
            <span>Visitor Sessions</span>
            <span className="ml-[0.2vw] px-[0.45vw] py-[0.05vw] rounded-full bg-orange-100 text-[#ea543a] text-[0.65vw] font-bold">
              {recentSessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-[0.4vw] pb-[0.65vw] px-[0.75vw] font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'border-[#ea543a] text-[#ea543a]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon icon="solar:calendar-date-linear" className="w-[0.9vw] h-[0.9vw]" />
            <span>Daily Breakdown</span>
            <span className="ml-[0.2vw] px-[0.45vw] py-[0.05vw] rounded-full bg-gray-100 text-gray-700 text-[0.65vw] font-bold">
              {dailyViews.length}
            </span>
          </button>

          {!selectedBookId && (
            <button
              onClick={() => setActiveTab('books')}
              className={`flex items-center gap-[0.4vw] pb-[0.65vw] px-[0.75vw] font-semibold border-b-2 transition-all cursor-pointer ${
                activeTab === 'books'
                  ? 'border-[#ea543a] text-[#ea543a]'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon icon="solar:book-bookmark-linear" className="w-[0.9vw] h-[0.9vw]" />
              <span>Flipbooks Ranking</span>
              <span className="ml-[0.2vw] px-[0.45vw] py-[0.05vw] rounded-full bg-gray-100 text-gray-700 text-[0.65vw] font-bold">
                {topBooks.length}
              </span>
            </button>
          )}
        </div>

        {/* View Mode Switcher in Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="flex items-center bg-[#F2F2F2] p-[0.15vw] rounded-[0.45vw] mb-[0.4vw] border border-gray-200">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`flex items-center gap-[0.25vw] px-[0.6vw] py-[0.25vw] rounded-[0.35vw] text-[0.7vw] font-semibold transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon icon="solar:list-bold" className="w-[0.75vw] h-[0.75vw]" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Cards View"
              className={`flex items-center gap-[0.25vw] px-[0.6vw] py-[0.25vw] rounded-[0.35vw] text-[0.7vw] font-semibold transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon icon="solar:widget-2-linear" className="w-[0.75vw] h-[0.75vw]" />
              <span>Cards</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Tab Content Panels */}
      {loading ? (
        <div className="py-[4vw] flex flex-col items-center justify-center gap-[0.8vw] text-gray-400">
          <div className="w-[2vw] h-[2vw] border-2 border-orange-200 border-t-[#ea543a] rounded-full animate-spin"></div>
          <span className="text-[0.75vw] font-medium text-gray-500">Loading readership statistics...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW & TRENDS */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-[1vw]">
              {/* Daily Trend Chart Card with Brand Orange Bars */}
              <div className="bg-white rounded-[0.75vw] border border-gray-200 p-[1.2vw] shadow-2xs">
                <div className="flex items-center justify-between mb-[1vw]">
                  <div>
                    <h2 className="text-[0.9vw] font-bold text-gray-900 flex items-center gap-[0.3vw]">
                      <Icon icon="solar:chart-2-bold" className="w-[1vw] h-[1vw] text-[#ea543a]" />
                      <span>Daily Readership Activity Trend</span>
                    </h2>
                    <p className="text-[0.7vw] text-gray-500">
                      Day-by-day reader visits recorded over the past {selectedDays} days
                    </p>
                  </div>
                  <div className="text-[0.75vw] text-gray-700 font-semibold bg-orange-50/60 border border-orange-200/70 px-[0.65vw] py-[0.25vw] rounded-[0.4vw]">
                    Total: <span className="text-[#ea543a] font-bold">{summary.totalViews}</span> sessions
                  </div>
                </div>

                {dailyViews.length === 0 ? (
                  <div className="h-[12vw] flex flex-col items-center justify-center text-gray-400 text-[0.75vw]">
                    <Icon icon="solar:calendar-minimalistic-linear" className="w-[2vw] h-[2vw] text-gray-300 mb-[0.4vw]" />
                    <span>No viewer activity recorded in this period yet.</span>
                    <span className="text-gray-400 text-[0.7vw] mt-[0.2vw]">Share your flipbook link with readers to start recording analytics.</span>
                  </div>
                ) : (
                  <div className="space-y-[0.5vw]">
                    <div className="h-[13vw] flex items-end gap-[0.35vw] pt-[2vw] px-[0.5vw] border-b border-gray-100 relative">
                      {(() => {
                        const maxViews = Math.max(...dailyViews.map(d => d.views), 1);
                        return dailyViews.map((day, idx) => {
                          const barHeight = Math.max(8, Math.round((day.views / maxViews) * 100));
                          const isHovered = hoveredDayIdx === idx;
                          return (
                            <div
                              key={day._id}
                              className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer"
                              onMouseEnter={() => setHoveredDayIdx(idx)}
                              onMouseLeave={() => setHoveredDayIdx(null)}
                            >
                              {/* Hover Tooltip */}
                              {isHovered && (
                                <div className="absolute -top-[3.2vw] bg-gray-900 text-white text-[0.7vw] py-[0.3vw] px-[0.6vw] rounded-[0.4vw] shadow-lg whitespace-nowrap z-20 pointer-events-none">
                                  <div className="font-semibold text-orange-300">{formatShortDate(day._id)}</div>
                                  <div className="text-white">{day.views} {day.views === 1 ? 'view' : 'views'}</div>
                                  <div className="text-gray-300 text-[0.65vw]">Avg: {formatDuration(day.avgDuration)}</div>
                                </div>
                              )}
                              <div
                                className={`w-full max-w-[28px] rounded-t-[0.25vw] transition-all duration-150 ${
                                  isHovered
                                    ? 'bg-[#ea543a] shadow-xs'
                                    : 'bg-orange-200 hover:bg-[#ea543a]'
                                }`}
                                style={{ height: `${barHeight}%` }}
                              ></div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="flex justify-between text-[0.7vw] text-gray-400 px-[0.5vw]">
                      <span>{formatShortDate(dailyViews[0]?._id)}</span>
                      <span>{formatShortDate(dailyViews[dailyViews.length - 1]?._id)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Geographic & Device Telemetry Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1vw]">
                {/* Geographic Breakdown */}
                <div className="bg-white rounded-[0.75vw] border border-gray-200 p-[1.2vw] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-[0.8vw]">
                      <div className="flex items-center gap-[0.4vw]">
                        <Icon icon="solar:global-bold" className="w-[1.1vw] h-[1.1vw] text-[#ea543a]" />
                        <h2 className="text-[0.9vw] font-bold text-gray-900">Geographic Distribution</h2>
                      </div>
                      <span className="text-[0.7vw] text-gray-400">By Visitor IP</span>
                    </div>

                    {countries.length === 0 ? (
                      <div className="py-[3vw] text-center text-[0.75vw] text-gray-400">
                        No geographic visitor data recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-[0.7vw] mt-[0.5vw]">
                        {countries.slice(0, 6).map((c) => {
                          const pct = summary.totalViews > 0 ? Math.round((c.views / summary.totalViews) * 100) : 0;
                          return (
                            <div key={c.country} className="space-y-[0.2vw]">
                              <div className="flex items-center justify-between text-[0.75vw] font-medium">
                                <span className="flex items-center gap-[0.4vw] text-gray-800">
                                  <span>{getCountryFlag(c.code)}</span>
                                  <span className="font-semibold">{c.country}</span>
                                </span>
                                <span className="text-gray-600">
                                  <strong className="text-gray-900">{c.views}</strong> views <span className="text-gray-400">({pct}%)</span>
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-[0.35vw] overflow-hidden">
                                <div
                                  className="bg-[#ea543a] h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Top States & Provinces */}
                  {((states && states.length > 0) || (cities && cities.length > 0)) && (
                    <div className="pt-[1vw] mt-[1vw] border-t border-gray-100 space-y-[0.6vw]">
                      {states && states.length > 0 && (
                        <div>
                          <span className="text-[0.68vw] font-semibold text-gray-400 uppercase tracking-wider block mb-[0.3vw]">
                            Top Regions & States
                          </span>
                          <div className="flex flex-wrap gap-[0.35vw]">
                            {states.slice(0, 8).map(st => (
                              <span
                                key={st.state}
                                className="text-[0.7vw] bg-orange-50/50 border border-orange-200/60 text-gray-700 px-[0.5vw] py-[0.15vw] rounded-[0.35vw] flex items-center gap-[0.25vw]"
                              >
                                <Icon icon="solar:map-point-linear" className="w-[0.75vw] h-[0.75vw] text-[#ea543a]" />
                                {st.state} ({st.views})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Device & Platform Breakdown */}
                <div className="bg-white rounded-[0.75vw] border border-gray-200 p-[1.2vw] shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-[0.8vw]">
                      <div className="flex items-center gap-[0.4vw]">
                        <Icon icon="solar:devices-bold" className="w-[1.1vw] h-[1.1vw] text-[#ea543a]" />
                        <h2 className="text-[0.9vw] font-bold text-gray-900">Devices & Browsers</h2>
                      </div>
                      <span className="text-[0.7vw] text-gray-400">Client Telemetry</span>
                    </div>

                    {devices.length === 0 ? (
                      <div className="py-[3vw] text-center text-[0.75vw] text-gray-400">
                        No device telemetry recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-[1vw] mt-[0.5vw]">
                        <div className="grid grid-cols-3 gap-[0.6vw]">
                          {['Desktop', 'Mobile', 'Tablet'].map((devType) => {
                            const item = devices.find(d => d.type === devType);
                            const views = item ? item.views : 0;
                            const pct = summary.totalViews > 0 ? Math.round((views / summary.totalViews) * 100) : 0;
                            return (
                              <div key={devType} className="bg-[#FAF9F6] border border-gray-200/80 rounded-[0.5vw] p-[0.7vw] text-center hover:border-orange-300 transition-colors">
                                <div className="w-[1.8vw] h-[1.8vw] mx-auto mb-[0.3vw] rounded-[0.4vw] bg-white border border-gray-200 flex items-center justify-center text-gray-700 shadow-2xs">
                                  {devType === 'Desktop' && <Icon icon="solar:laptop-minimalistic-linear" className="w-[1vw] h-[1vw] text-gray-700" />}
                                  {devType === 'Mobile' && <Icon icon="solar:smartphone-linear" className="w-[1vw] h-[1vw] text-[#ea543a]" />}
                                  {devType === 'Tablet' && <Icon icon="solar:tablet-linear" className="w-[1vw] h-[1vw] text-amber-600" />}
                                </div>
                                <div className="text-[0.7vw] text-gray-500 font-medium">{devType}</div>
                                <div className="text-[1.1vw] font-bold text-gray-900 leading-tight">{pct}%</div>
                                <div className="text-[0.65vw] text-gray-400">{views} sessions</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Browser list */}
                        {analyticsData?.browsers && analyticsData.browsers.length > 0 && (
                          <div className="pt-[0.6vw] border-t border-gray-100">
                            <span className="text-[0.68vw] font-semibold text-gray-400 uppercase tracking-wider block mb-[0.4vw]">
                              Top Browsers
                            </span>
                            <div className="space-y-[0.35vw]">
                              {analyticsData.browsers.map(b => (
                                <div key={b.browser} className="flex items-center justify-between text-[0.75vw]">
                                  <span className="text-gray-700 font-medium">{b.browser}</span>
                                  <span className="text-gray-600 font-semibold">{b.views} sessions</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-[0.8vw] mt-[1vw] border-t border-gray-100">
                    <button
                      onClick={() => setActiveTab('sessions')}
                      className="w-full text-center py-[0.45vw] bg-orange-50 hover:bg-orange-100/70 text-[#ea543a] font-semibold text-[0.75vw] rounded-[0.5vw] transition border border-orange-200/80 cursor-pointer flex items-center justify-center gap-[0.3vw]"
                    >
                      <span>Explore Visitor Sessions Table</span>
                      <Icon icon="solar:arrow-right-linear" className="w-[0.8vw] h-[0.8vw]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VISITOR SESSIONS (Table & Cards with Filter Bar and Pagination) */}
          {activeTab === 'sessions' && (
            <div className="bg-white rounded-[0.75vw] border border-gray-200 shadow-2xs overflow-hidden">
              
              {/* Filter Toolbar */}
              <div className="p-[0.8vw] border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-[0.6vw] bg-[#FAFAFA]">
                <div className="flex items-center gap-[0.5vw] flex-wrap">
                  {/* Search Input */}
                  <div className="relative w-[16vw]">
                    <input
                      type="text"
                      placeholder="Search Book, City, State, Device..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-[0.45vw] pl-[2vw] pr-[1.8vw] py-[0.4vw] text-[0.75vw] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#ea543a] transition"
                    />
                    <Icon icon="solar:magnifer-linear" className="w-[0.85vw] h-[0.85vw] text-gray-400 absolute left-[0.65vw] top-1/2 -translate-y-1/2" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-gray-400 hover:text-gray-600 absolute right-[0.6vw] top-1/2 -translate-y-1/2 cursor-pointer"
                      >
                        <Icon icon="solar:close-circle-bold" className="w-[0.8vw] h-[0.8vw]" />
                      </button>
                    )}
                  </div>

                  {/* Device Filter */}
                  <div className="relative">
                    <select
                      value={deviceFilter}
                      onChange={(e) => setDeviceFilter(e.target.value)}
                      className="appearance-none bg-white border border-gray-200 text-gray-700 font-medium text-[0.72vw] rounded-[0.45vw] pl-[1.8vw] pr-[1.8vw] py-[0.4vw] hover:border-gray-300 focus:outline-none focus:border-[#ea543a] transition cursor-pointer"
                    >
                      <option value="ALL">All Devices</option>
                      <option value="Desktop">Desktop</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Tablet">Tablet</option>
                    </select>
                    <Icon icon="solar:devices-linear" className="w-[0.8vw] h-[0.8vw] text-gray-400 absolute left-[0.55vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Icon icon="solar:alt-arrow-down-linear" className="w-[0.7vw] h-[0.7vw] text-gray-400 absolute right-[0.55vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Country Filter */}
                  {availableCountries.length > 0 && (
                    <div className="relative">
                      <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 font-medium text-[0.72vw] rounded-[0.45vw] pl-[1.8vw] pr-[1.8vw] py-[0.4vw] hover:border-gray-300 focus:outline-none focus:border-[#ea543a] transition cursor-pointer"
                      >
                        <option value="ALL">All Countries</option>
                        {availableCountries.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <Icon icon="solar:global-linear" className="w-[0.8vw] h-[0.8vw] text-gray-400 absolute left-[0.55vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Icon icon="solar:alt-arrow-down-linear" className="w-[0.7vw] h-[0.7vw] text-gray-400 absolute right-[0.55vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  {/* Browser Filter */}
                  {availableBrowsers.length > 0 && (
                    <div className="relative">
                      <select
                        value={browserFilter}
                        onChange={(e) => setBrowserFilter(e.target.value)}
                        className="appearance-none bg-white border border-gray-200 text-gray-700 font-medium text-[0.72vw] rounded-[0.45vw] pl-[1.8vw] pr-[1.8vw] py-[0.4vw] hover:border-gray-300 focus:outline-none focus:border-[#ea543a] transition cursor-pointer"
                      >
                        <option value="ALL">All Browsers</option>
                        {availableBrowsers.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                      <Icon icon="solar:compass-linear" className="w-[0.8vw] h-[0.8vw] text-gray-400 absolute left-[0.55vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                      <Icon icon="solar:alt-arrow-down-linear" className="w-[0.7vw] h-[0.7vw] text-gray-400 absolute right-[0.55vw] top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  )}

                  {/* Clear Filters Button */}
                  {(searchQuery || deviceFilter !== 'ALL' || countryFilter !== 'ALL' || browserFilter !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setDeviceFilter('ALL');
                        setCountryFilter('ALL');
                        setBrowserFilter('ALL');
                      }}
                      className="text-[0.72vw] font-semibold text-[#ea543a] hover:underline cursor-pointer flex items-center gap-[0.2vw]"
                    >
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>

                <div className="text-[0.72vw] text-gray-500 font-medium">
                  Showing <strong className="text-gray-900">{filteredSessions.length}</strong> matching records
                </div>
              </div>

              {/* Sessions View (Table or Cards) */}
              {filteredSessions.length === 0 ? (
                <div className="py-[4vw] text-center text-[0.75vw] text-gray-400">
                  <Icon icon="solar:documents-minimalistic-linear" className="w-[2vw] h-[2vw] mx-auto text-gray-300 mb-[0.4vw]" />
                  <span>No sessions found matching your selected filters.</span>
                </div>
              ) : viewMode === 'table' ? (
                /* TABLE VIEW:
                   Columns: Date & Time (dd-mm-yyyy hh:mm aa), Flipbook Name, Total Pages, Country, State, Device, Browser, View Count, Duration
                */
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[0.75vw]">
                    <thead>
                      <tr className="bg-[#F8F8F8] border-b border-gray-200 text-gray-600 font-semibold text-[0.68vw] uppercase tracking-wider">
                        <th className="py-[0.6vw] px-[0.8vw]">Date & Time</th>
                        <th className="py-[0.6vw] px-[0.8vw]">Flipbook Name</th>
                        <th className="py-[0.6vw] px-[0.8vw] text-center">Total Pages</th>
                        <th className="py-[0.6vw] px-[0.8vw]">Country</th>
                        <th className="py-[0.6vw] px-[0.8vw]">State / Region</th>
                        <th className="py-[0.6vw] px-[0.8vw]">Device</th>
                        <th className="py-[0.6vw] px-[0.8vw]">Browser</th>
                        <th className="py-[0.6vw] px-[0.8vw] text-center">View Count</th>
                        <th className="py-[0.6vw] px-[0.8vw] text-center">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedSessions.map((sess) => (
                        <tr key={sess.sessionId} className="hover:bg-orange-50/25 transition-colors">
                          {/* Date & Time (dd-mm-yyyy hh:mm aa) */}
                          <td className="py-[0.6vw] px-[0.8vw]">
                            <div className="font-semibold text-gray-900">
                              {formatDateTimeDMY(sess.startedAt)}
                            </div>
                            <div className="text-[0.66vw] text-gray-400">
                              {formatRelativeTime(sess.startedAt)}
                            </div>
                          </td>

                          {/* Flipbook Name */}
                          <td className="py-[0.6vw] px-[0.8vw]">
                            <div className="font-semibold text-gray-900 flex items-center gap-[0.3vw]">
                              <Icon icon="solar:book-2-linear" className="w-[0.85vw] h-[0.85vw] text-[#ea543a] shrink-0" />
                              <span className="truncate max-w-[14vw]" title={sess.flipbookName || sess.v_id}>
                                {sess.flipbookName || 'Untitled Flipbook'}
                              </span>
                            </div>
                            <div className="text-[0.64vw] text-gray-400 font-mono">
                              ID: {sess.v_id}
                            </div>
                          </td>

                          {/* Total Pages */}
                          <td className="py-[0.6vw] px-[0.8vw] text-center">
                            <span className="inline-block px-[0.45vw] py-[0.1vw] rounded-[0.25vw] bg-gray-100 text-gray-700 font-semibold text-[0.7vw]">
                              {sess.totalPages || 1} pgs
                            </span>
                          </td>

                          {/* Country */}
                          <td className="py-[0.6vw] px-[0.8vw]">
                            <div className="flex items-center gap-[0.35vw]">
                              <span className="text-[1vw] shrink-0">{getCountryFlag(sess.location?.countryCode)}</span>
                              <span className="font-semibold text-gray-800">
                                {sess.location?.country || 'Unknown'}
                              </span>
                            </div>
                          </td>

                          {/* State */}
                          <td className="py-[0.6vw] px-[0.8vw]">
                            <div className="text-gray-700 font-medium">
                              {sess.location?.state && sess.location.state !== 'Unknown' && sess.location.state !== 'Local State'
                                ? sess.location.state
                                : sess.location?.city || '—'}
                            </div>
                          </td>

                          {/* Device */}
                          <td className="py-[0.6vw] px-[0.8vw]">
                            <div className="font-medium text-gray-800 flex items-center gap-[0.3vw]">
                              {sess.device?.type === 'Mobile' ? (
                                <Icon icon="solar:smartphone-linear" className="w-[0.85vw] h-[0.85vw] text-[#ea543a]" />
                              ) : sess.device?.type === 'Tablet' ? (
                                <Icon icon="solar:tablet-linear" className="w-[0.85vw] h-[0.85vw] text-amber-600" />
                              ) : (
                                <Icon icon="solar:laptop-minimalistic-linear" className="w-[0.85vw] h-[0.85vw] text-gray-500" />
                              )}
                              <span>{sess.device?.type || 'Desktop'}</span>
                            </div>
                            <div className="text-[0.65vw] text-gray-400">
                              {sess.device?.os || 'OS'}
                            </div>
                          </td>

                          {/* Browser */}
                          <td className="py-[0.6vw] px-[0.8vw]">
                            <span className="font-medium text-gray-700">
                              {sess.device?.browser || 'Browser'}
                            </span>
                          </td>

                          {/* View Count */}
                          <td className="py-[0.6vw] px-[0.8vw] text-center">
                            <span className="font-bold text-gray-900 bg-gray-50 border border-gray-200 px-[0.45vw] py-[0.1vw] rounded-[0.25vw]">
                              1
                            </span>
                          </td>

                          {/* Duration */}
                          <td className="py-[0.6vw] px-[0.8vw] text-center">
                            <span className="inline-block px-[0.5vw] py-[0.12vw] rounded-[0.3vw] font-bold text-[0.72vw] bg-orange-50/80 text-[#ea543a] border border-orange-200/80">
                              {formatDuration(sess.durationSeconds)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* CARD VIEW */
                <div className="p-[1vw] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[0.8vw]">
                  {paginatedSessions.map((sess) => (
                    <div 
                      key={sess.sessionId}
                      className="bg-white rounded-[0.6vw] border border-gray-200 p-[0.9vw] hover:border-[#ea543a]/50 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Header: Date Time and Device */}
                        <div className="flex items-center justify-between pb-[0.5vw] border-b border-gray-100">
                          <span className="text-[0.7vw] font-semibold text-gray-600">
                            {formatDateTimeDMY(sess.startedAt)}
                          </span>
                          <span className="text-[0.68vw] font-semibold bg-orange-50 text-[#ea543a] border border-orange-200/60 px-[0.4vw] py-[0.1vw] rounded-[0.25vw] flex items-center gap-[0.2vw]">
                            {sess.device?.type === 'Mobile' ? (
                              <Icon icon="solar:smartphone-linear" className="w-[0.75vw] h-[0.75vw]" />
                            ) : (
                              <Icon icon="solar:laptop-minimalistic-linear" className="w-[0.75vw] h-[0.75vw]" />
                            )}
                            {sess.device?.type || 'Desktop'}
                          </span>
                        </div>

                        {/* Body Details */}
                        <div className="mt-[0.6vw] space-y-[0.4vw]">
                          <div>
                            <span className="text-[0.65vw] text-gray-400 uppercase font-semibold block">Flipbook</span>
                            <div className="text-[0.8vw] font-bold text-gray-900 truncate" title={sess.flipbookName || sess.v_id}>
                              {sess.flipbookName || 'Untitled Flipbook'}
                            </div>
                            <span className="text-[0.65vw] text-gray-400">Total Pages: {sess.totalPages || 1}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-[0.4vw] pt-[0.2vw]">
                            <div>
                              <span className="text-[0.64vw] text-gray-400 uppercase font-semibold block">Location</span>
                              <div className="flex items-center gap-[0.25vw] text-[0.72vw] font-medium text-gray-800">
                                <span>{getCountryFlag(sess.location?.countryCode)}</span>
                                <span className="truncate">{sess.location?.country || 'Unknown'}</span>
                              </div>
                              <span className="text-[0.65vw] text-gray-500 truncate block">
                                {sess.location?.state && sess.location.state !== 'Unknown' && sess.location.state !== 'Local State' ? sess.location.state : sess.location?.city || ''}
                              </span>
                            </div>

                            <div>
                              <span className="text-[0.64vw] text-gray-400 uppercase font-semibold block">Browser</span>
                              <div className="text-[0.72vw] font-medium text-gray-800">
                                {sess.device?.browser || 'Browser'}
                              </div>
                              <span className="text-[0.65vw] text-gray-400">Views: 1</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Duration */}
                      <div className="mt-[0.8vw] pt-[0.6vw] border-t border-gray-100 flex items-center justify-between text-[0.72vw]">
                        <div className="flex items-center gap-[0.3vw] text-gray-600">
                          <Icon icon="solar:clock-circle-linear" className="w-[0.8vw] h-[0.8vw] text-[#ea543a]" />
                          <span className="font-bold text-gray-900">{formatDuration(sess.durationSeconds)}</span>
                        </div>
                        <div className="text-[0.7vw] font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-[0.4vw] py-[0.1vw] rounded-[0.25vw]">
                          Read P.{sess.maxPageReached || 1} of {sess.totalPages || 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {filteredSessions.length > 0 && (
                <div className="p-[0.75vw] border-t border-gray-200 bg-[#FAFAFA] flex flex-col sm:flex-row items-center justify-between gap-[0.6vw] text-[0.72vw]">
                  <div className="flex items-center gap-[0.5vw] text-gray-600">
                    <span>Rows per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-gray-200 rounded-[0.35vw] px-[0.4vw] py-[0.2vw] text-gray-800 font-semibold cursor-pointer focus:outline-none focus:border-[#ea543a]"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                    <span>
                      Showing {Math.min((currentPage - 1) * pageSize + 1, filteredSessions.length)} – {Math.min(currentPage * pageSize, filteredSessions.length)} of {filteredSessions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-[0.25vw]">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-[0.35vw] bg-white border border-gray-200 rounded-[0.35vw] text-gray-700 disabled:opacity-30 hover:bg-gray-100 transition cursor-pointer"
                      title="First Page"
                    >
                      <Icon icon="solar:double-alt-arrow-left-linear" className="w-[0.8vw] h-[0.8vw]" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-[0.5vw] py-[0.3vw] bg-white border border-gray-200 rounded-[0.35vw] text-gray-700 disabled:opacity-30 hover:bg-gray-100 transition cursor-pointer flex items-center gap-[0.15vw]"
                    >
                      <Icon icon="solar:alt-arrow-left-linear" className="w-[0.8vw] h-[0.8vw]" />
                      <span>Prev</span>
                    </button>

                    <span className="px-[0.6vw] py-[0.3vw] font-bold text-gray-900 bg-white border border-gray-200 rounded-[0.35vw]">
                      {currentPage} / {totalPagesCount}
                    </span>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPagesCount, prev + 1))}
                      disabled={currentPage === totalPagesCount}
                      className="px-[0.5vw] py-[0.3vw] bg-white border border-gray-200 rounded-[0.35vw] text-gray-700 disabled:opacity-30 hover:bg-gray-100 transition cursor-pointer flex items-center gap-[0.15vw]"
                    >
                      <span>Next</span>
                      <Icon icon="solar:alt-arrow-right-linear" className="w-[0.8vw] h-[0.8vw]" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPagesCount)}
                      disabled={currentPage === totalPagesCount}
                      className="p-[0.35vw] bg-white border border-gray-200 rounded-[0.35vw] text-gray-700 disabled:opacity-30 hover:bg-gray-100 transition cursor-pointer"
                      title="Last Page"
                    >
                      <Icon icon="solar:double-alt-arrow-right-linear" className="w-[0.8vw] h-[0.8vw]" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DAILY BREAKDOWN */}
          {activeTab === 'daily' && (
            <div className="bg-white rounded-[0.75vw] border border-gray-200 shadow-2xs overflow-hidden">
              <div className="p-[0.8vw] border-b border-gray-200 flex items-center justify-between bg-[#FAFAFA]">
                <h3 className="text-[0.78vw] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-[0.3vw]">
                  <Icon icon="solar:calendar-date-bold" className="w-[0.9vw] h-[0.9vw] text-[#ea543a]" />
                  <span>Day-by-Day Activity Log</span>
                </h3>
                <span className="text-[0.72vw] text-gray-500 font-medium">
                  {dailyViews.length} Active Days in Period
                </span>
              </div>

              {dailyViews.length === 0 ? (
                <div className="py-[4vw] text-center text-[0.75vw] text-gray-400">
                  No views recorded in this period yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[0.75vw]">
                    <thead>
                      <tr className="bg-[#F8F8F8] border-b border-gray-200 text-gray-600 font-semibold text-[0.68vw] uppercase tracking-wider">
                        <th className="py-[0.6vw] px-[1vw]">Date (DD-MM-YYYY)</th>
                        <th className="py-[0.6vw] px-[1vw] text-center">Total Sessions</th>
                        <th className="py-[0.6vw] px-[1vw] text-center">Avg. Session Time</th>
                        <th className="py-[0.6vw] px-[1vw]">Proportion of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dailyViews.map((day) => {
                        const pct = summary.totalViews > 0 ? Math.round((day.views / summary.totalViews) * 100) : 0;
                        return (
                          <tr key={day._id} className="hover:bg-orange-50/25 transition-colors">
                            <td className="py-[0.6vw] px-[1vw] font-semibold text-gray-900">
                              {formatShortDate(day._id)}
                            </td>
                            <td className="py-[0.6vw] px-[1vw] text-center font-bold text-gray-900">
                              {day.views.toLocaleString()}
                            </td>
                            <td className="py-[0.6vw] px-[1vw] text-center text-gray-700 font-medium">
                              {formatDuration(day.avgDuration)}
                            </td>
                            <td className="py-[0.6vw] px-[1vw]">
                              <div className="flex items-center gap-[0.5vw]">
                                <div className="w-[10vw] bg-gray-100 rounded-full h-[0.35vw] overflow-hidden">
                                  <div
                                    className="bg-[#ea543a] h-full rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
                                  ></div>
                                </div>
                                <span className="text-[0.7vw] text-gray-500 font-semibold">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FLIPBOOKS RANKING */}
          {activeTab === 'books' && !selectedBookId && (
            <div className="bg-white rounded-[0.75vw] border border-gray-200 shadow-2xs overflow-hidden">
              <div className="p-[0.8vw] border-b border-gray-200 flex items-center justify-between bg-[#FAFAFA]">
                <h3 className="text-[0.78vw] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-[0.3vw]">
                  <Icon icon="solar:book-bookmark-bold" className="w-[0.9vw] h-[0.9vw] text-[#ea543a]" />
                  <span>Flipbooks Performance Ranking</span>
                </h3>
                <span className="text-[0.72vw] text-gray-500 font-medium">
                  {topBooks.length} Books Analyzed
                </span>
              </div>

              {topBooks.length === 0 ? (
                <div className="py-[4vw] text-center text-[0.75vw] text-gray-400">
                  No flipbook sessions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[0.75vw]">
                    <thead>
                      <tr className="bg-[#F8F8F8] border-b border-gray-200 text-gray-600 font-semibold text-[0.68vw] uppercase tracking-wider">
                        <th className="py-[0.6vw] px-[1vw]">Flipbook Title</th>
                        <th className="py-[0.6vw] px-[1vw]">Identifier</th>
                        <th className="py-[0.6vw] px-[1vw] text-center">Total Views</th>
                        <th className="py-[0.6vw] px-[1vw] text-center">Avg. Read Time</th>
                        <th className="py-[0.6vw] px-[1vw] text-right">Inspect</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topBooks.map((b) => (
                        <tr key={b.v_id} className="hover:bg-orange-50/25 transition-colors">
                          <td className="py-[0.6vw] px-[1vw] font-semibold text-gray-900 flex items-center gap-[0.4vw]">
                            <Icon icon="solar:book-2-bold" className="w-[0.85vw] h-[0.85vw] text-[#ea543a] shrink-0" />
                            <span>{b.name || 'Untitled Flipbook'}</span>
                          </td>
                          <td className="py-[0.6vw] px-[1vw] text-gray-400 font-mono text-[0.68vw]">
                            {b.v_id}
                          </td>
                          <td className="py-[0.6vw] px-[1vw] text-center font-bold text-gray-900">
                            {b.views.toLocaleString()}
                          </td>
                          <td className="py-[0.6vw] px-[1vw] text-center text-gray-700 font-medium">
                            {formatDuration(b.avgDurationSeconds)}
                          </td>
                          <td className="py-[0.6vw] px-[1vw] text-right">
                            <button
                              onClick={() => {
                                setSelectedBookId(b.v_id);
                                setActiveTab('overview');
                              }}
                              className="inline-flex items-center gap-[0.25vw] text-[0.72vw] font-semibold text-[#ea543a] hover:bg-orange-100/60 bg-orange-50 border border-orange-200/80 px-[0.6vw] py-[0.25vw] rounded-[0.35vw] transition cursor-pointer"
                            >
                              <span>Inspect Alone</span>
                              <Icon icon="solar:arrow-right-up-linear" className="w-[0.75vw] h-[0.75vw]" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Analytics;
