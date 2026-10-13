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

  // Metric Cards Data
  const metricCards = useMemo(() => [
    {
      key: 'views',
      title: 'Total Read Views',
      value: summary.totalViews.toLocaleString(),
      icon: 'solar:eye-bold',
      badgeBg: 'bg-orange-50 border-orange-200 text-[#ea543a]',
      border: 'border-orange-200/80',
      glow: 'from-orange-100/60',
      titleColor: 'text-orange-950 font-bold',
      subIcon: 'solar:graph-up-bold',
      subIconColor: 'text-[#ea543a]',
      subText: `Across selected ${selectedDays} days`
    },
    {
      key: 'visitors',
      title: 'Unique Visitors',
      value: summary.uniqueVisitors.toLocaleString(),
      icon: 'solar:users-group-rounded-bold',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      border: 'border-emerald-200/80',
      glow: 'from-emerald-100/60',
      titleColor: 'text-emerald-950 font-bold',
      subIcon: 'solar:shield-check-bold',
      subIconColor: 'text-emerald-600',
      subText: 'Unique IP readers'
    },
    {
      key: 'duration',
      title: 'Avg. Session Time',
      value: formatDuration(summary.avgDuration),
      icon: 'solar:clock-circle-bold',
      badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
      border: 'border-indigo-200/80',
      glow: 'from-indigo-100/60',
      titleColor: 'text-indigo-950 font-bold',
      subIcon: 'solar:hourglass-line-bold',
      subIconColor: 'text-indigo-600',
      subText: 'Average dwell time'
    },
    {
      key: 'totalDuration',
      title: 'Cumulative Read Time',
      value: formatDuration(summary.totalDuration),
      icon: 'solar:chart-square-bold',
      badgeBg: 'bg-amber-50 border-amber-200 text-amber-600',
      border: 'border-amber-200/80',
      glow: 'from-amber-100/60',
      titleColor: 'text-amber-950 font-bold',
      subIcon: 'solar:fire-bold',
      subIconColor: 'text-amber-600',
      subText: 'Combined engagement'
    }
  ], [summary, selectedDays]);

  const devices = useMemo(() => analyticsData?.devices || [], [analyticsData]);
  const countries = useMemo(() => analyticsData?.countries || analyticsData?.topCountries || [], [analyticsData]);
  const states = useMemo(() => analyticsData?.states || analyticsData?.topStates || [], [analyticsData]);
  const cities = useMemo(() => analyticsData?.cities || [], [analyticsData]);
  const rawDailyViews = useMemo(() => analyticsData?.dailyViews || [], [analyticsData]);

  // Generates continuous timeline with 0s for missing dates across selectedDays
  const dailyViews = useMemo(() => {
    const map = new Map();
    rawDailyViews.forEach(d => {
      if (d._id) {
        map.set(d._id, { views: Number(d.views) || 0, avgDuration: Number(d.avgDuration) || 0 });
      }
    });

    const list = [];
    const now = new Date();
    const count = Math.max(7, selectedDays);

    for (let i = count - 1; i >= 0; i--) {
      const dayDate = new Date();
      dayDate.setDate(now.getDate() - i);
      const yyyy = dayDate.getFullYear();
      const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
      const dd = String(dayDate.getDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      const found = map.get(key);
      list.push({
        _id: key,
        views: found ? found.views : 0,
        avgDuration: found ? found.avgDuration : 0
      });
    }

    return list;
  }, [rawDailyViews, selectedDays]);

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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-[1vw] pb-[0.6vw] border-b border-gray-100">
        <div className="flex items-center gap-[0.8vw] flex-wrap">
          <div className="flex items-center gap-[0.6vw]">
            <div className="w-[2vw] h-[2vw] rounded-[0.5vw] bg-[#ea543a]/10 border border-[#ea543a]/25 flex items-center justify-center text-[#ea543a] shadow-xs">
              <Icon icon="solar:graph-up-bold" className="w-[1.2vw] h-[1.2vw]" />
            </div>
            <h1 className="text-[1.25vw] font-bold text-gray-900 tracking-tight">
              Flipbook Analytics
            </h1>
          </div>

          {selectedBookId && (
            <div className="flex items-center gap-[0.5vw] bg-orange-50/80 border border-orange-200/90 px-[0.7vw] py-[0.25vw] rounded-[0.45vw] text-[0.75vw]">
              <Icon icon="solar:book-2-bold" className="w-[0.9vw] h-[0.9vw] text-[#ea543a]" />
              <span className="text-gray-600 font-medium">Inspecting:</span>
              <strong className="text-gray-900 font-bold max-w-[15vw] truncate">
                {selectedFlipbookObj?.flipbookName || selectedBookId}
              </strong>
              <button
                onClick={() => {
                  setSelectedBookId(null);
                  setActiveTab('overview');
                }}
                className="ml-[0.3vw] flex items-center gap-[0.2vw] text-[#ea543a] hover:text-[#c43b24] font-semibold hover:underline cursor-pointer"
                title="Return to overall analytics"
              >
                <Icon icon="solar:close-circle-bold" className="w-[0.85vw] h-[0.85vw]" />
                <span>All Books</span>
              </button>
            </div>
          )}
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

      {/* 3. Primary Metric Cards (Compact) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[0.6vw] mt-[0.3vw]">
        {metricCards.map((item) => (
          <div
            key={item.key}
            className={`bg-white rounded-[0.6vw] p-[0.78vw] px-[0.8vw] min-h-[4.4vw] border ${item.border} shadow-2xs relative overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow`}
          >
            <div className={`absolute top-0 right-0 w-[2.8vw] h-[2.8vw] bg-gradient-to-bl ${item.glow} to-transparent rounded-bl-full pointer-events-none`}></div>
            <div className="flex items-center justify-between relative z-10">
              <span className={`text-[0.78vw] font-bold ${item.titleColor} uppercase tracking-wide`}>
                {item.title}
              </span>
              <div className={`w-[1.4vw] h-[1.4vw] rounded-[0.35vw] border flex items-center justify-center ${item.badgeBg}`}>
                <Icon icon={item.icon} className="w-[0.85vw] h-[0.85vw]" />
              </div>
            </div>
            <div className="mt-[0.4vw] relative z-10 flex items-baseline gap-[0.4vw]">
              <div className="text-[1.3vw] font-semibold text-gray-800 tracking-tight leading-none">
                {item.value}
              </div>
              <div className="text-[0.62vw] text-gray-500 font-normal flex items-center gap-[0.2vw]">
                <Icon icon={item.subIcon} className={`w-[0.65vw] h-[0.65vw] ${item.subIconColor}`} />
                <span>{item.subText}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Section Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 text-[0.78vw] mt-[0.4vw]">
        <div className="flex items-center gap-[0.2vw]">
          {/* 1st Tab: Overview & Activity */}
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

          {/* 2nd Tab: Flipbooks Ranking (available when looking at all books) */}
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

          {/* 3rd Tab: Daily Flipbook Counts (Date wise activity log) */}
          <button
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-[0.4vw] pb-[0.65vw] px-[0.75vw] font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'border-[#ea543a] text-[#ea543a]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon icon="solar:calendar-date-linear" className="w-[0.9vw] h-[0.9vw]" />
            <span>Daily Flipbook Counts</span>
            <span className="ml-[0.2vw] px-[0.45vw] py-[0.05vw] rounded-full bg-gray-100 text-gray-700 text-[0.65vw] font-bold">
              {dailyViews.filter(d => d.views > 0).length || dailyViews.length}
            </span>
          </button>

          {/* Visitor Sessions: visible when inspect alone is clicked for a flipbook */}
          {selectedBookId && (
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
          )}
        </div>

        {/* Action Controls & View Mode on the right */}
        <div className="flex items-center gap-[0.5vw] pb-[0.35vw]">
          {/* View Mode Switcher in Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="flex items-center bg-[#F2F2F2] p-[0.15vw] rounded-[0.45vw] border border-gray-200 mr-[0.2vw]">
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

          {/* Days Filter Pills */}
          <div className="flex bg-[#F4F4F5] p-[0.15vw] rounded-[0.5vw] border border-gray-200/80">
            {[7, 30, 90].map(days => (
              <button
                key={days}
                onClick={() => setSelectedDays(days)}
                className={`text-[0.72vw] font-semibold px-[0.65vw] py-[0.3vw] rounded-[0.4vw] transition-all cursor-pointer ${
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
            className="flex items-center gap-[0.3vw] px-[0.7vw] py-[0.35vw] bg-white border border-gray-200 hover:border-[#ea543a]/40 hover:text-[#ea543a] text-gray-700 rounded-[0.5vw] text-[0.72vw] font-semibold transition cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Icon icon="solar:restart-linear" className={`w-[0.8vw] h-[0.8vw] ${refreshing ? 'animate-spin text-[#ea543a]' : 'text-gray-500'}`} />
            <span>{refreshing ? 'Refreshing' : 'Refresh'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredSessions.length === 0}
            title="Export filtered records to CSV"
            className="flex items-center gap-[0.3vw] px-[0.8vw] py-[0.35vw] bg-[#ea543a] hover:bg-[#d9482f] text-white rounded-[0.5vw] text-[0.72vw] font-semibold transition cursor-pointer disabled:opacity-40 shadow-xs hover:shadow-orange-500/20 active:scale-98"
          >
            <Icon icon="solar:download-minimalistic-bold" className="w-[0.8vw] h-[0.8vw]" />
            <span>Export CSV</span>
          </button>
        </div>
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
              {/* Dual Overview Charts: Left (Smooth Curved Area Chart) & Right (Donut Ring Chart) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1vw]">
                {/* LEFT (8 cols): Smooth Area / Curved Line Chart for Readership Trend */}
                <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-[0.75vw] border border-orange-200/70 p-[1.1vw] shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-[0.8vw]">
                    <div>
                      <h2 className="text-[0.98vw] font-bold text-gray-900 flex items-center gap-[0.4vw]">
                        <Icon icon="solar:graph-up-bold" className="w-[1.1vw] h-[1.1vw] text-[#ea543a]" />
                        <span>Views & Readership Trend</span>
                      </h2>
                      <p className="text-[0.68vw] text-gray-700 mt-[0.1vw]">
                        Day-by-day viewer traffic recorded over past {selectedDays} days
                      </p>
                    </div>
                    <div className="text-[0.72vw] text-gray-900 font-medium bg-orange-50 border border-orange-300 px-[0.6vw] py-[0.2vw] rounded-[0.4vw]">
                      Total: <span className="text-[#ea543a] font-bold">{summary.totalViews}</span> sessions
                    </div>
                  </div>

                  {dailyViews.length === 0 ? (
                    <div className="h-[13vw] flex flex-col items-center justify-center text-gray-700 text-[0.75vw]">
                      <Icon icon="solar:calendar-minimalistic-linear" className="w-[2vw] h-[2vw] text-[#ea543a]/50 mb-[0.4vw]" />
                      <span className="font-medium text-gray-800">No viewer activity recorded in this period yet.</span>
                      <span className="text-gray-650 text-[0.68vw] mt-[0.2vw]">Share your flipbook link with readers to start recording analytics.</span>
                    </div>
                  ) : (
                    (() => {
                      const svgWidth = 700;
                      const svgHeight = 220;
                      const padTop = 24;
                      const padBottom = 32;
                      const padX = 28;
                      const chartW = svgWidth - padX * 2;
                      const chartH = svgHeight - padTop - padBottom;

                      const maxViews = Math.max(...dailyViews.map(d => Number(d.views) || 0), 1);
                      const points = dailyViews.map((d, i) => {
                        const x = dailyViews.length > 1
                          ? padX + (i / (dailyViews.length - 1)) * chartW
                          : padX + chartW / 2;
                        const y = padTop + chartH - ((Number(d.views) || 0) / maxViews) * chartH;
                        return { x, y, day: d, idx: i };
                      });

                      // Build smooth cubic bezier curve
                      let pathD = '';
                      if (points.length === 1) {
                        pathD = `M ${padX} ${points[0].y} L ${svgWidth - padX} ${points[0].y}`;
                      } else {
                        pathD = `M ${points[0].x} ${points[0].y}`;
                        for (let i = 0; i < points.length - 1; i++) {
                          const p0 = points[i];
                          const p1 = points[i + 1];
                          const cpX1 = p0.x + (p1.x - p0.x) * 0.45;
                          const cpY1 = p0.y;
                          const cpX2 = p0.x + (p1.x - p0.x) * 0.55;
                          const cpY2 = p1.y;
                          pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
                        }
                      }

                      const lastPt = points[points.length - 1];
                      const firstPt = points[0];
                      const areaD = `${pathD} L ${lastPt.x} ${svgHeight - padBottom} L ${firstPt.x} ${svgHeight - padBottom} Z`;

                      return (
                        <div className="relative w-full">
                          <svg
                            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                            className="w-full h-[13.5vw] overflow-visible"
                            preserveAspectRatio="none"
                            onMouseLeave={() => setHoveredDayIdx(null)}
                          >
                            <defs>
                              <linearGradient id="areaGradientOrange" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ea543a" stopOpacity="0.25" />
                                <stop offset="60%" stopColor="#ea543a" stopOpacity="0.05" />
                                <stop offset="100%" stopColor="#ea543a" stopOpacity="0.00" />
                              </linearGradient>
                            </defs>

                            {/* Crisp guide lines (no light grey) */}
                            {[0, 0.5, 1].map((pct, k) => {
                              const y = padTop + chartH * (1 - pct);
                              return (
                                <g key={k}>
                                  <line
                                    x1={padX}
                                    y1={y}
                                    x2={svgWidth - padX}
                                    y2={y}
                                    stroke="#fed7aa"
                                    strokeWidth="1"
                                    strokeDasharray={pct === 0 ? 'none' : '3 3'}
                                  />
                                  <text
                                    x={padX - 8}
                                    y={y + 3.5}
                                    textAnchor="end"
                                    fill="#4b5563"
                                    fontSize="10"
                                    fontWeight="600"
                                    fontFamily="sans-serif"
                                  >
                                    {Math.round(maxViews * pct)}
                                  </text>
                                </g>
                              );
                            })}

                            {/* Smooth Filled Gradient Area */}
                            <path d={areaD} fill="url(#areaGradientOrange)" />

                            {/* Clean Smooth Curve Stroke Line */}
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#ea543a"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Hover Vertical Guide Cursor Line */}
                            {hoveredDayIdx !== null && points[hoveredDayIdx] && (
                              <line
                                x1={points[hoveredDayIdx].x}
                                y1={padTop}
                                x2={points[hoveredDayIdx].x}
                                y2={svgHeight - padBottom}
                                stroke="#ea543a"
                                strokeWidth="1.4"
                                strokeDasharray="3 3"
                                opacity="0.8"
                              />
                            )}

                            {/* Peak & Hover Interactive Points Only */}
                            {points.map((pt) => {
                              const isHover = hoveredDayIdx === pt.idx;
                              const isPeak = Number(pt.day.views) === maxViews && maxViews > 0;
                              const showDot = isHover || isPeak;

                              return (
                                <g
                                  key={pt.day._id}
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredDayIdx(pt.idx)}
                                >
                                  {/* Wide transparent hover slice */}
                                  <rect
                                    x={pt.x - (chartW / (dailyViews.length * 2))}
                                    y={padTop}
                                    width={chartW / dailyViews.length}
                                    height={chartH}
                                    fill="transparent"
                                  />

                                  {/* Sleek dot shown on hover or at peak */}
                                  {showDot && (
                                    <>
                                      <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r={isHover ? '7' : '4'}
                                        fill="#ea543a"
                                        opacity={isHover ? '0.25' : '0'}
                                      />
                                      <circle
                                        cx={pt.x}
                                        cy={pt.y}
                                        r={isHover ? '4.5' : '3'}
                                        fill="#ffffff"
                                        stroke="#ea543a"
                                        strokeWidth={isHover ? '2.5' : '2'}
                                      />
                                    </>
                                  )}
                                </g>
                              );
                            })}
                          </svg>

                          {/* Clean Sleek Tooltip */}
                          {hoveredDayIdx !== null && points[hoveredDayIdx] && (
                            <div
                              className="absolute bg-gray-900 text-white text-[0.65vw] py-[0.35vw] px-[0.6vw] rounded-[0.45vw] shadow-md whitespace-nowrap pointer-events-none z-20 border border-orange-500/40"
                              style={{
                                left: `${(points[hoveredDayIdx].x / svgWidth) * 100}%`,
                                top: `${(points[hoveredDayIdx].y / svgHeight) * 100}%`,
                                transform: 'translate(-50%, -130%)'
                              }}
                            >
                              <div className="font-semibold text-orange-200">{formatShortDate(points[hoveredDayIdx].day._id)}</div>
                              <div className="text-[0.82vw] font-bold text-white mt-[0.05vw]">
                                {points[hoveredDayIdx].day.views} <span className="text-[0.62vw] font-normal text-orange-100">views</span>
                              </div>
                              {Number(points[hoveredDayIdx].day.avgDuration) > 0 && (
                                <div className="text-orange-300 text-[0.6vw] mt-[0.05vw] font-medium">
                                  Avg read: {formatDuration(points[hoveredDayIdx].day.avgDuration)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Date Range Labels below X-Axis (Clear dark text) */}
                          <div className="flex justify-between text-[0.7vw] font-semibold text-gray-700 px-[0.8vw] mt-[0.3vw]">
                            <span>{formatShortDate(dailyViews[0]?._id)}</span>
                            {dailyViews.length > 2 && (
                              <span>{formatShortDate(dailyViews[Math.floor(dailyViews.length / 2)]?._id)}</span>
                            )}
                            <span>{formatShortDate(dailyViews[dailyViews.length - 1]?._id)}</span>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* RIGHT (4-5 cols): Donut / Ring Chart for Device & Reader Breakdown */}
                <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-[0.75vw] border border-orange-200/70 p-[1.1vw] shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-[0.6vw]">
                    <div>
                      <h2 className="text-[0.98vw] font-bold text-gray-900 flex items-center gap-[0.4vw]">
                        <Icon icon="solar:pie-chart-2-bold" className="w-[1.1vw] h-[1.1vw] text-[#ea543a]" />
                        <span>Device & Reader Share</span>
                      </h2>
                      <p className="text-[0.68vw] text-gray-700 mt-[0.1vw]">
                        Reader distribution by device platform
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const palette = [
                      { type: 'Desktop', color: '#ea543a', bg: 'bg-[#ea543a]', icon: 'solar:laptop-minimalistic-linear' },
                      { type: 'Mobile', color: '#059669', bg: 'bg-[#059669]', icon: 'solar:smartphone-linear' },
                      { type: 'Tablet', color: '#d97706', bg: 'bg-[#d97706]', icon: 'solar:tablet-linear' }
                    ];

                    const totalDevViews = devices.reduce((acc, d) => acc + (Number(d.views) || 0), 0) || summary.totalViews || 0;

                    // Compute segments for donut SVG
                    const circumference = 2 * Math.PI * 40; // r = 40
                    let cumulativeAngle = 0;

                    const segments = palette.map((p) => {
                      const match = devices.find(d => d.type?.toLowerCase() === p.type.toLowerCase());
                      const views = match ? Number(match.views) || 0 : (p.type === 'Desktop' && totalDevViews === 0 ? summary.totalViews : 0);
                      const pct = totalDevViews > 0 ? (views / totalDevViews) : (p.type === 'Desktop' ? 1 : 0);
                      const dashLength = pct * circumference;
                      const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
                      const strokeDashoffset = -cumulativeAngle;
                      cumulativeAngle += dashLength;

                      return {
                        ...p,
                        views,
                        pct: Math.round(pct * 100),
                        strokeDasharray,
                        strokeDashoffset
                      };
                    });

                    const primarySegment = segments.reduce((max, s) => s.pct > max.pct ? s : max, segments[0]);

                    return (
                      <div className="flex flex-col items-center justify-between h-full pt-[0.4vw]">
                        {/* Interactive SVG Donut Ring */}
                        <div className="relative w-[8.2vw] h-[8.2vw] flex items-center justify-center my-[0.4vw]">
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            {/* Background track circle - warm neutral tint */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#ffedd5"
                              strokeWidth="11"
                            />
                            {/* Segment rings */}
                            {totalDevViews > 0 ? (
                              segments.map((seg) => (
                                <circle
                                  key={seg.type}
                                  cx="50"
                                  cy="50"
                                  r="40"
                                  fill="none"
                                  stroke={seg.color}
                                  strokeWidth="11"
                                  strokeDasharray={seg.strokeDasharray}
                                  strokeDashoffset={seg.strokeDashoffset}
                                  className="transition-all duration-500"
                                  strokeLinecap={segments.filter(s => s.views > 0).length === 1 ? 'butt' : 'round'}
                                />
                              ))
                            ) : (
                              <circle
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke="#ea543a"
                                strokeWidth="11"
                                strokeDasharray={`${circumference} 0`}
                              />
                            )}
                          </svg>

                          {/* Center Content in Donut Hole */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-[1.25vw] font-bold text-gray-900 leading-none">
                              {totalDevViews > 0 ? `${primarySegment.pct}%` : '100%'}
                            </span>
                            <span className="text-[0.65vw] text-gray-700 font-semibold uppercase tracking-wider mt-[0.2vw]">
                              {totalDevViews > 0 ? primarySegment.type : 'Desktop'}
                            </span>
                          </div>
                        </div>

                        {/* Legend Pill Breakdown with clean airy visual hierarchy */}
                        <div className="w-full grid grid-cols-3 gap-[0.5vw] pt-[0.7vw] border-t border-orange-100">
                          {segments.map((seg) => (
                            <div
                              key={seg.type}
                              className="bg-orange-50/30 border border-orange-200/70 rounded-[0.45vw] p-[0.45vw] px-[0.4vw] flex flex-col items-center justify-center text-center hover:bg-orange-50/60 transition-colors"
                            >
                              <div className="flex items-center gap-[0.3vw] text-[0.68vw] font-medium text-slate-700">
                                <span className={`w-[0.4vw] h-[0.4vw] rounded-full ${seg.bg} flex-shrink-0`}></span>
                                <span className="tracking-tight">{seg.type}</span>
                              </div>
                              <div className="text-[1vw] font-semibold text-slate-900 mt-[0.25vw] leading-none">
                                {seg.pct}%
                              </div>
                              <div className="text-[0.62vw] text-slate-500 font-normal mt-[0.25vw]">
                                {seg.views} {seg.views === 1 ? 'view' : 'views'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Geographic Distribution Full Width Card (Minimal & Understandable) */}
              <div className="bg-white rounded-[0.75vw] border border-orange-200/70 p-[1.1vw] shadow-2xs">
                {/* Header */}
                <div className="flex items-center justify-between pb-[0.6vw] mb-[0.8vw] border-b border-orange-100">
                  <div className="flex items-center gap-[0.4vw]">
                    <div className="w-[1.6vw] h-[1.6vw] rounded-[0.4vw] bg-orange-50 border border-orange-200 text-[#ea543a] flex items-center justify-center">
                      <Icon icon="solar:global-bold" className="w-[1vw] h-[1vw]" />
                    </div>
                    <div>
                      <h2 className="text-[0.98vw] font-bold text-slate-900 leading-tight">Geographic Reach</h2>
                      <p className="text-[0.65vw] text-slate-600 mt-[0.1vw]">Reader traffic by country and region</p>
                    </div>
                  </div>
                  <span className="text-[0.65vw] font-medium text-slate-700 bg-orange-50/70 px-[0.5vw] py-[0.15vw] rounded-[0.35vw] border border-orange-200/80">
                    By Visitor IP
                  </span>
                </div>

                {countries.length === 0 ? (
                  <div className="py-[3vw] text-center text-[0.75vw] text-slate-600">
                    No geographic visitor data recorded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1.6vw]">
                    {/* Left Side (7 cols): Clean Country Breakdown Table */}
                    <div className="lg:col-span-7">
                      <div className="text-[0.68vw] font-semibold text-slate-800 uppercase tracking-wider mb-[0.5vw] flex items-center justify-between px-[0.2vw]">
                        <span>Country</span>
                        <span>Share / Views</span>
                      </div>
                      
                      <div className="divide-y divide-orange-100/70">
                        {countries.map((c) => {
                          const pct = summary.totalViews > 0 ? Math.round((c.views / summary.totalViews) * 100) : 0;
                          return (
                            <div key={c.country} className="py-[0.5vw] px-[0.2vw] flex items-center justify-between gap-[1vw] hover:bg-orange-50/20 rounded-[0.3vw] transition-colors">
                              {/* Country Name & Flag */}
                              <div className="flex items-center gap-[0.45vw] min-w-[9vw]">
                                <span className="text-[0.95vw]">{getCountryFlag(c.code)}</span>
                                <span className="text-[0.75vw] font-medium text-slate-800">{c.country}</span>
                              </div>

                              {/* Minimal Slim Progress Bar */}
                              <div className="flex-1 max-w-[14vw] hidden sm:block">
                                <div className="w-full bg-orange-100/60 rounded-full h-[0.32vw] overflow-hidden">
                                  <div
                                    className="bg-[#ea543a] h-full rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, Math.max(6, pct))}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Numbers */}
                              <div className="text-right text-[0.75vw] flex items-center gap-[0.4vw] min-w-[5vw] justify-end">
                                <span className="font-semibold text-slate-900">{pct}%</span>
                                <span className="text-[0.65vw] text-slate-600">({c.views} {c.views === 1 ? 'view' : 'views'})</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Side (5 cols): Clean State / Region Badges */}
                    <div className="lg:col-span-5 lg:border-l lg:border-orange-100 lg:pl-[1.5vw] flex flex-col justify-between">
                      <div>
                        <div className="text-[0.68vw] font-semibold text-slate-800 uppercase tracking-wider mb-[0.5vw]">
                          Top Regions & Cities
                        </div>

                        {states && states.length > 0 ? (
                          <div className="flex flex-wrap gap-[0.35vw] pt-[0.1vw]">
                            {states.map(st => (
                              <div
                                key={st.state}
                                className="inline-flex items-center gap-[0.3vw] bg-orange-50/40 hover:bg-orange-50/70 border border-orange-200/70 px-[0.55vw] py-[0.22vw] rounded-[0.35vw] text-[0.72vw] text-slate-800 transition-colors"
                              >
                                <Icon icon="solar:map-point-linear" className="w-[0.75vw] h-[0.75vw] text-[#ea543a]" />
                                <span className="font-medium">{st.state}</span>
                                <span className="text-slate-600 text-[0.62vw]">({st.views})</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[0.72vw] text-slate-600 py-[1vw]">
                            No regional data recorded.
                          </div>
                        )}
                      </div>

                      {/* Clean Helper link at bottom */}
                      <div className="pt-[0.6vw] mt-[0.8vw] border-t border-orange-100 flex items-center justify-between text-[0.68vw]">
                        <span className="text-slate-600">Want per-flipbook details?</span>
                        {selectedBookId ? (
                          <button
                            onClick={() => setActiveTab('sessions')}
                            className="font-semibold text-[#ea543a] hover:underline flex items-center gap-[0.2vw] cursor-pointer"
                          >
                            <span>View Flipbook Sessions</span>
                            <Icon icon="solar:arrow-right-linear" className="w-[0.7vw] h-[0.7vw]" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveTab('books')}
                            className="font-semibold text-[#ea543a] hover:underline flex items-center gap-[0.2vw] cursor-pointer"
                          >
                            <span>View Flipbooks Ranking</span>
                            <Icon icon="solar:arrow-right-linear" className="w-[0.7vw] h-[0.7vw]" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
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

          {/* TAB 3: DAILY FLIPBOOK COUNTS (Date wise) */}
          {activeTab === 'daily' && (
            <div className="bg-white rounded-[0.75vw] border border-gray-200 shadow-2xs overflow-hidden">
              <div className="p-[0.8vw] border-b border-gray-200 flex items-center justify-between bg-[#FAFAFA]">
                <h3 className="text-[0.78vw] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-[0.3vw]">
                  <Icon icon="solar:calendar-date-bold" className="w-[0.9vw] h-[0.9vw] text-[#ea543a]" />
                  <span>Daily Flipbook Counts (Date-Wise Breakdown)</span>
                </h3>
                <span className="text-[0.72vw] text-gray-600 font-medium">
                  {dailyViews.filter(d => d.views > 0).length} Days with Views Recorded Across Past {selectedDays} Days
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
                        <th className="py-[0.6vw] px-[1vw] text-center">Flipbook Views Count</th>
                        <th className="py-[0.6vw] px-[1vw] text-center">Avg. Session Time</th>
                        <th className="py-[0.6vw] px-[1vw]">Proportion of Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...dailyViews].reverse().map((day) => {
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
                                setActiveTab('sessions');
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
