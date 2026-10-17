import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Icon } from '@iconify/react';

const getBackendUrl = () => {
  return (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');
};

const formatDateTime = (dateVal) => {
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

const LeadFormData = () => {
  const outletCtx = useOutletContext() || {};
  const user = outletCtx.user;

  const [activeTab, setActiveTab] = useState('leads'); // 'leads' | 'account_overview'
  const [leads, setLeads] = useState([]);
  const [flipbooks, setFlipbooks] = useState([]);
  const [selectedBookFilter, setSelectedBookFilter] = useState('all'); // 'all' or v_id
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all', 'today', '7days', '30days', 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);

  // Custom Dropdowns open state
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const bookDropdownRef = useRef(null);
  const dateDropdownRef = useRef(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const userEmail = useMemo(() => {
    if (user?.emailId) return user.emailId;
    if (user?.email) return user.email;
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.emailId || parsed.email || '';
      }
    } catch (e) {}
    return '';
  }, [user]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bookDropdownRef.current && !bookDropdownRef.current.contains(e.target)) {
        setIsBookDropdownOpen(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target)) {
        setIsDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Flipbooks & Leads
  const fetchData = async () => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const backendUrl = getBackendUrl();

      // 1. Fetch Flipbooks list
      const booksRes = await axios.get(`${backendUrl}/api/flipbook/list`, {
        params: { emailId: userEmail }
      });
      const rawBooks = booksRes.data?.flipbooks || booksRes.data?.books || [];
      const bookList = Array.isArray(rawBooks) ? rawBooks.filter(b => !b.trash) : [];
      setFlipbooks(bookList);

      // 2. Fetch Leads
      const leadsRes = await axios.get(`${backendUrl}/api/lead-form/get-leads`, {
        params: { emailId: userEmail }
      });
      if (leadsRes.data?.success && Array.isArray(leadsRes.data.leads)) {
        setLeads(leadsRes.data.leads);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error('Error fetching lead form data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userEmail]);

  // Build a distinct list of all flipbooks that either exist in flipbooks list or have collected leads
  const distinctFlipbooks = useMemo(() => {
    const map = new Map();

    // From flipbooks API
    flipbooks.forEach(b => {
      const id = b.v_id || b._id;
      if (id && !map.has(id)) {
        map.set(id, {
          v_id: id,
          flipbookName: b.flipbookName || b.title || b.realName || 'Untitled Flipbook',
        });
      }
    });

    // From leads directly (in case flipbook list didn't include it)
    leads.forEach(l => {
      if (l.v_id && !map.has(l.v_id)) {
        map.set(l.v_id, {
          v_id: l.v_id,
          flipbookName: l.flipbookName || 'Untitled Flipbook'
        });
      }
    });

    return Array.from(map.values());
  }, [flipbooks, leads]);

  // Reset page to 1 when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBookFilter, dateRangeFilter, customStartDate, customEndDate, searchQuery, pageSize]);

  // Filter Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(item => {
      // 1. Flipbook filter
      if (selectedBookFilter !== 'all' && item.v_id !== selectedBookFilter) {
        return false;
      }

      // 2. Date range filter
      if (dateRangeFilter !== 'all') {
        const leadDate = new Date(item.submittedAt || item.createdAt);
        const now = new Date();
        if (dateRangeFilter === 'today') {
          const isToday =
            leadDate.getDate() === now.getDate() &&
            leadDate.getMonth() === now.getMonth() &&
            leadDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (dateRangeFilter === '7days') {
          const diffDays = (now - leadDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 7) return false;
        } else if (dateRangeFilter === '30days') {
          const diffDays = (now - leadDate) / (1000 * 60 * 60 * 24);
          if (diffDays > 30) return false;
        } else if (dateRangeFilter === 'custom') {
          if (customStartDate) {
            const start = new Date(customStartDate);
            start.setHours(0, 0, 0, 0);
            if (leadDate < start) return false;
          }
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (leadDate > end) return false;
          }
        }
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const bookName = (item.flipbookName || '').toLowerCase();
        const ip = (item.viewerIp || '').toLowerCase();
        const id = (item.leadId || '').toLowerCase();

        let dataValues = '';
        if (item.leadData && typeof item.leadData === 'object') {
          dataValues = Object.entries(item.leadData)
            .map(([k, v]) => `${k} ${typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join(' ')
            .toLowerCase();
        }

        const match = bookName.includes(q) || ip.includes(q) || id.includes(q) || dataValues.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [leads, selectedBookFilter, dateRangeFilter, searchQuery]);

  // Pagination Calculations
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLeads = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return filteredLeads.slice(startIndex, startIndex + pageSize);
  }, [filteredLeads, safeCurrentPage, pageSize]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalLeads = leads.length;
    const booksWithLeads = new Set(leads.map(l => l.v_id || l.flipbookName).filter(Boolean)).size;

    const now = new Date();
    const todayLeads = leads.filter(l => {
      const d = new Date(l.submittedAt || l.createdAt);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;

    const last7Days = leads.filter(l => {
      const d = new Date(l.submittedAt || l.createdAt);
      return (now - d) / (1000 * 60 * 60 * 24) <= 7;
    }).length;

    return {
      totalLeads,
      booksWithLeads,
      todayLeads,
      last7Days
    };
  }, [leads]);

  // Group leads count by flipbook for breakdown overview
  const bookBreakdown = useMemo(() => {
    const counts = {};
    leads.forEach(l => {
      const key = l.v_id || 'unknown';
      if (!counts[key]) {
        counts[key] = {
          v_id: l.v_id,
          name: l.flipbookName || 'Untitled Flipbook',
          count: 0,
          latestDate: l.submittedAt || l.createdAt
        };
      }
      counts[key].count += 1;
      const curDate = new Date(l.submittedAt || l.createdAt);
      if (curDate > new Date(counts[key].latestDate)) {
        counts[key].latestDate = l.submittedAt || l.createdAt;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [leads]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLeads.length === 0) return;

    const dynamicKeys = new Set();
    filteredLeads.forEach(l => {
      if (l.leadData && typeof l.leadData === 'object') {
        Object.keys(l.leadData).forEach(k => dynamicKeys.add(k));
      }
    });
    const customHeaders = Array.from(dynamicKeys);

    const headers = ['S.No', 'Lead ID', 'Flipbook Name', 'Submitted Date', 'Viewer IP', ...customHeaders];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      str = str.replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredLeads.map((lead, idx) => {
      const row = [
        escapeCsv(idx + 1),
        escapeCsv(lead.leadId || ''),
        escapeCsv(lead.flipbookName || 'Untitled Flipbook'),
        escapeCsv(formatDateTime(lead.submittedAt || lead.createdAt)),
        escapeCsv(lead.viewerIp || '')
      ];

      customHeaders.forEach(k => {
        const val = lead.leadData ? lead.leadData[k] : '';
        row.push(escapeCsv(val !== undefined ? val : ''));
      });

      return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filterLabel = selectedBookFilter === 'all' ? 'All_Flipbooks' : 'Selected_Flipbook';
    link.setAttribute('download', `Flipibook_Leads_${filterLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLeadSummary = (leadData) => {
    if (!leadData || typeof leadData !== 'object') return { name: '—', email: '—', phone: '—' };
    let name = '';
    let email = '';
    let phone = '';

    for (const [key, val] of Object.entries(leadData)) {
      const lk = key.toLowerCase();
      if (!name && (lk.includes('name') || lk === 'full_name' || lk === 'fullname')) {
        name = typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
      if (!email && (lk.includes('email') || lk.includes('mail'))) {
        email = typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
      if (!phone && (lk.includes('phone') || lk.includes('mobile') || lk.includes('contact'))) {
        phone = typeof val === 'object' ? JSON.stringify(val) : String(val);
      }
    }

    return {
      name: name || '—',
      email: email || '—',
      phone: phone || '—'
    };
  };

  // Find label for active selected book filter
  const selectedBookLabel = useMemo(() => {
    if (selectedBookFilter === 'all') return `All Flipbooks (${leads.length})`;
    const found = distinctFlipbooks.find(b => b.v_id === selectedBookFilter);
    const count = leads.filter(l => l.v_id === selectedBookFilter).length;
    return `${found?.flipbookName || 'Flipbook'} (${count})`;
  }, [selectedBookFilter, distinctFlipbooks, leads]);

  const dateFilterLabels = {
    all: 'All Time',
    today: 'Today',
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days',
    custom: 'Custom Range'
  };

  const formatYMDtoDMY = (ymdStr) => {
    if (!ymdStr) return '';
    const parts = ymdStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return ymdStr;
  };

  const currentDateLabel = useMemo(() => {
    if (dateRangeFilter === 'custom') {
      const startDMY = formatYMDtoDMY(customStartDate);
      const endDMY = formatYMDtoDMY(customEndDate);

      if (startDMY && endDMY) {
        return `${startDMY} to ${endDMY}`;
      } else if (startDMY) {
        return `From ${startDMY}`;
      } else if (endDMY) {
        return `Until ${endDMY}`;
      }
      return 'Custom Range';
    }
    return dateFilterLabels[dateRangeFilter] || 'All Time';
  }, [dateRangeFilter, customStartDate, customEndDate]);

  return (
    <div className="bg-white rounded-[1vw] p-[1.4vw] shadow-2xs flex flex-col min-h-full font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[0.8vw] pb-[1vw] border-b border-gray-200">
        <div>
          <div className="flex items-center gap-[0.5vw]">
            <h1 className="text-[1.25vw] font-bold text-gray-900 tracking-tight">
              Lead Form Data
            </h1>
            <span className="text-[0.72vw] font-medium text-gray-700 bg-gray-100 border border-gray-300 px-[0.45vw] py-[0.1vw] rounded">
              {stats.totalLeads} Total
            </span>
          </div>
          <p className="text-[0.72vw] text-gray-600 mt-[0.1vw]">
            Customer inquiries and responses collected from your flipbooks.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-[0.5vw]">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-[0.75vw] py-[0.38vw] rounded-[0.45vw] border border-gray-300 bg-white text-gray-800 hover:bg-gray-100 text-[0.72vw] font-medium flex items-center gap-[0.35vw] transition-all cursor-pointer shadow-2xs"
            title="Refresh Data"
          >
            <Icon icon="solar:restart-bold" className={`w-[0.85vw] h-[0.85vw] ${loading ? 'animate-spin text-[#4c5add]' : 'text-gray-700'}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredLeads.length === 0}
            className={`px-[0.9vw] py-[0.38vw] rounded-[0.45vw] text-white text-[0.72vw] font-medium flex items-center gap-[0.4vw] transition-all shadow-2xs ${
              filteredLeads.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#4c5add] hover:bg-[#3d48c8] cursor-pointer'
            }`}
            title="Export filtered leads to CSV"
          >
            <Icon icon="lucide:download" className="w-[0.85vw] h-[0.85vw]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-[0.75vw] my-[1vw]">
        <div className="p-[0.8vw] rounded-[0.6vw] bg-gray-50 border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-[0.68vw] font-semibold text-gray-600 uppercase tracking-wide">Total Leads</p>
            <h3 className="text-[1.3vw] font-bold text-gray-900 mt-[0.1vw]">{stats.totalLeads}</h3>
          </div>
          <div className="w-[2vw] h-[2vw] rounded-full bg-indigo-50 text-[#4c5add] flex items-center justify-center">
            <Icon icon="lucide:database" className="w-[0.95vw] h-[0.95vw]" />
          </div>
        </div>

        <div className="p-[0.8vw] rounded-[0.6vw] bg-gray-50 border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-[0.68vw] font-semibold text-gray-600 uppercase tracking-wide">Active Flipbooks</p>
            <h3 className="text-[1.3vw] font-bold text-gray-900 mt-[0.1vw]">{stats.booksWithLeads}</h3>
          </div>
          <div className="w-[2vw] h-[2vw] rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Icon icon="clarity:library-line" className="w-[0.95vw] h-[0.95vw]" />
          </div>
        </div>

        <div className="p-[0.8vw] rounded-[0.6vw] bg-gray-50 border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-[0.68vw] font-semibold text-gray-600 uppercase tracking-wide">Last 7 Days</p>
            <h3 className="text-[1.3vw] font-bold text-gray-900 mt-[0.1vw]">{stats.last7Days}</h3>
          </div>
          <div className="w-[2vw] h-[2vw] rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
            <Icon icon="solar:calendar-bold-duotone" className="w-[0.95vw] h-[0.95vw]" />
          </div>
        </div>

        <div className="p-[0.8vw] rounded-[0.6vw] bg-gray-50 border border-gray-200 flex items-center justify-between">
          <div>
            <p className="text-[0.68vw] font-semibold text-gray-600 uppercase tracking-wide">Today's Inquiries</p>
            <h3 className="text-[1.3vw] font-bold text-gray-900 mt-[0.1vw]">{stats.todayLeads}</h3>
          </div>
          <div className="w-[2vw] h-[2vw] rounded-full bg-violet-50 text-violet-700 flex items-center justify-center">
            <Icon icon="solar:bell-bing-bold-duotone" className="w-[0.95vw] h-[0.95vw]" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-[1.2vw] border-b border-gray-200 mb-[0.9vw]">
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-[0.45vw] text-[0.8vw] font-medium flex items-center gap-[0.3vw] transition-all cursor-pointer relative ${
            activeTab === 'leads' ? 'text-[#4c5add] font-bold' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Icon icon="lucide:list" className="w-[0.85vw] h-[0.85vw]" />
          <span>Detailed Leads ({filteredLeads.length})</span>
          {activeTab === 'leads' && (
            <span className="absolute bottom-0 left-0 right-0 h-[0.12vw] bg-[#4c5add] rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('account_overview')}
          className={`pb-[0.45vw] text-[0.8vw] font-medium flex items-center gap-[0.3vw] transition-all cursor-pointer relative ${
            activeTab === 'account_overview' ? 'text-[#4c5add] font-bold' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Icon icon="carbon:analytics" className="w-[0.85vw] h-[0.85vw]" />
          <span>Flipbook Overview ({bookBreakdown.length})</span>
          {activeTab === 'account_overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-[0.12vw] bg-[#4c5add] rounded-full" />
          )}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-gray-50 border border-gray-200 rounded-[0.6vw] p-[0.6vw] mb-[0.9vw] flex flex-wrap items-center justify-between gap-[0.6vw] relative z-20">
        
        {/* Search */}
        <div className="relative flex-1 min-w-[14vw]">
          <Icon icon="lucide:search" className="absolute left-[0.6vw] top-1/2 -translate-y-1/2 text-gray-500 w-[0.85vw] h-[0.85vw]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, flipbook..."
            className="w-full bg-white border border-gray-300 rounded-[0.4vw] pl-[1.9vw] pr-[1.8vw] py-[0.35vw] text-[0.74vw] text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#4c5add] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-[0.6vw] top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              <Icon icon="lucide:x" className="w-[0.7vw] h-[0.7vw]" />
            </button>
          )}
        </div>

        {/* Right Filters */}
        <div className="flex items-center gap-[0.5vw] flex-wrap">
          
          {/* Flipbook Filter - Custom Interactive Dropdown */}
          <div className="relative" ref={bookDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsBookDropdownOpen(!isBookDropdownOpen);
                setIsDateDropdownOpen(false);
              }}
              className="flex items-center gap-[0.35vw] bg-white border border-gray-300 hover:border-gray-400 rounded-[0.4vw] px-[0.65vw] py-[0.35vw] text-[0.74vw] font-medium text-gray-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Icon icon="clarity:library-line" className="text-gray-600 w-[0.85vw] h-[0.85vw] shrink-0" />
              <span className="max-w-[13vw] truncate font-medium text-gray-800">{selectedBookLabel}</span>
              <Icon icon="lucide:chevron-down" className={`w-[0.75vw] h-[0.75vw] text-gray-500 transition-transform ${isBookDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isBookDropdownOpen && (
              <div className="absolute right-0 mt-[0.3vw] w-[18vw] max-h-[16vw] overflow-y-auto bg-white border border-gray-200 rounded-[0.5vw] shadow-lg py-[0.3vw] z-50 text-[0.74vw]">
                {/* Option: All Flipbooks */}
                <div
                  onClick={() => {
                    setSelectedBookFilter('all');
                    setIsBookDropdownOpen(false);
                  }}
                  className={`px-[0.8vw] py-[0.4vw] cursor-pointer flex items-center justify-between transition-colors ${
                    selectedBookFilter === 'all'
                      ? 'bg-indigo-50 font-bold text-[#4c5add]'
                      : 'text-gray-800 hover:bg-gray-100 font-medium'
                  }`}
                >
                  <span className="truncate">All Flipbooks</span>
                  <span className="text-[0.68vw] text-gray-600 font-mono">({leads.length})</span>
                </div>

                <div className="h-[1px] bg-gray-100 my-[0.2vw]" />

                {/* Flipbook list */}
                {distinctFlipbooks.map(b => {
                  const count = leads.filter(l => l.v_id === b.v_id).length;
                  const isSelected = selectedBookFilter === b.v_id;
                  return (
                    <div
                      key={b.v_id}
                      onClick={() => {
                        setSelectedBookFilter(b.v_id);
                        setIsBookDropdownOpen(false);
                      }}
                      className={`px-[0.8vw] py-[0.4vw] cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 font-bold text-[#4c5add]'
                          : 'text-gray-800 hover:bg-gray-100 font-medium'
                      }`}
                    >
                      <span className="truncate max-w-[13vw]">{b.flipbookName}</span>
                      <span className="text-[0.68vw] text-gray-600 font-mono shrink-0 ml-[0.3vw]">({count})</span>
                    </div>
                  );
                })}

                {distinctFlipbooks.length === 0 && (
                  <div className="px-[0.8vw] py-[0.5vw] text-gray-500 text-center">
                    No flipbooks found
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date Filter - Custom Interactive Dropdown */}
          <div className="relative" ref={dateDropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsDateDropdownOpen(!isDateDropdownOpen);
                setIsBookDropdownOpen(false);
              }}
              className="flex items-center gap-[0.35vw] bg-white border border-gray-300 hover:border-gray-400 rounded-[0.4vw] px-[0.65vw] py-[0.35vw] text-[0.74vw] font-medium text-gray-800 transition-colors cursor-pointer shadow-2xs"
            >
              <Icon icon="solar:calendar-outline" className="text-gray-600 w-[0.85vw] h-[0.85vw] shrink-0" />
              <span className="font-medium text-gray-800 max-w-[14vw] truncate">{currentDateLabel}</span>
              <Icon icon="lucide:chevron-down" className={`w-[0.75vw] h-[0.75vw] text-gray-500 transition-transform ${isDateDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDateDropdownOpen && (
              <div className="absolute right-0 mt-[0.3vw] w-[15vw] bg-white border border-gray-200 rounded-[0.5vw] shadow-lg py-[0.3vw] z-50 text-[0.74vw]">
                {['all', 'today', '7days', '30days'].map((key) => (
                  <div
                    key={key}
                    onClick={() => {
                      setDateRangeFilter(key);
                      setCustomStartDate('');
                      setCustomEndDate('');
                      setIsDateDropdownOpen(false);
                    }}
                    className={`px-[0.8vw] py-[0.4vw] cursor-pointer transition-colors ${
                      dateRangeFilter === key
                        ? 'bg-indigo-50 font-bold text-[#4c5add]'
                        : 'text-gray-800 hover:bg-gray-100 font-medium'
                    }`}
                  >
                    {dateFilterLabels[key]}
                  </div>
                ))}

                <div className="h-[1px] bg-gray-100 my-[0.2vw]" />

                {/* Custom Date Range Option */}
                <div className="px-[0.8vw] py-[0.4vw]">
                  <div
                    onClick={() => setDateRangeFilter('custom')}
                    className={`cursor-pointer transition-colors mb-[0.4vw] font-semibold flex items-center justify-between ${
                      dateRangeFilter === 'custom' ? 'text-[#4c5add]' : 'text-gray-800 hover:text-gray-900'
                    }`}
                  >
                    <span>Custom Date Range</span>
                    {dateRangeFilter === 'custom' && <Icon icon="lucide:check" className="w-[0.8vw] h-[0.8vw]" />}
                  </div>

                  <div className="space-y-[0.3vw] pt-[0.2vw]">
                    <div>
                      <span className="text-[0.65vw] text-gray-600 font-medium block mb-[0.1vw]">From:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => {
                          setCustomStartDate(e.target.value);
                          setDateRangeFilter('custom');
                        }}
                        className="w-full bg-white border border-gray-300 rounded-[0.3vw] px-[0.4vw] py-[0.2vw] text-[0.72vw] text-gray-800 focus:outline-none focus:border-[#4c5add]"
                      />
                    </div>
                    <div>
                      <span className="text-[0.65vw] text-gray-600 font-medium block mb-[0.1vw]">To:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => {
                          setCustomEndDate(e.target.value);
                          setDateRangeFilter('custom');
                        }}
                        className="w-full bg-white border border-gray-300 rounded-[0.3vw] px-[0.4vw] py-[0.2vw] text-[0.72vw] text-gray-800 focus:outline-none focus:border-[#4c5add]"
                      />
                    </div>

                    <div className="pt-[0.3vw] flex justify-end gap-[0.3vw]">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomStartDate('');
                          setCustomEndDate('');
                          setDateRangeFilter('all');
                          setIsDateDropdownOpen(false);
                        }}
                        className="text-[0.68vw] text-gray-600 hover:text-gray-900 font-medium px-[0.4vw] py-[0.2vw]"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsDateDropdownOpen(false)}
                        className="text-[0.68vw] bg-[#4c5add] hover:bg-[#3d48c8] text-white font-medium px-[0.6vw] py-[0.2vw] rounded-[0.3vw] transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {(selectedBookFilter !== 'all' || dateRangeFilter !== 'all' || customStartDate || customEndDate || searchQuery.trim()) && (
            <button
              onClick={() => {
                setSelectedBookFilter('all');
                setDateRangeFilter('all');
                setCustomStartDate('');
                setCustomEndDate('');
                setSearchQuery('');
              }}
              className="text-[0.74vw] text-red-600 hover:text-red-700 font-semibold px-[0.4vw] py-[0.3vw] hover:bg-red-50 rounded-[0.3vw] transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1">
        {loading ? (
          <div className="py-[3vw] flex flex-col items-center justify-center text-gray-600">
            <Icon icon="eos-icons:loading" className="w-[1.6vw] h-[1.6vw] animate-spin text-[#4c5add] mb-[0.4vw]" />
            <p className="text-[0.78vw] font-medium">Loading lead data...</p>
          </div>
        ) : activeTab === 'account_overview' ? (
          /* OVERVIEW BREAKDOWN VIEW */
          <div className="space-y-[0.8vw]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[0.8vw]">
              {bookBreakdown.map(item => (
                <div
                  key={item.v_id || item.name}
                  onClick={() => {
                    setSelectedBookFilter(item.v_id);
                    setActiveTab('leads');
                  }}
                  className="p-[0.9vw] border border-gray-200 rounded-[0.6vw] bg-white hover:border-[#4c5add] hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-[0.4vw]">
                      <span className="text-[0.65vw] font-mono text-gray-500 uppercase tracking-wide truncate max-w-[11vw]">
                        {item.v_id || 'Direct'}
                      </span>
                      <span className="text-[0.7vw] font-bold text-[#4c5add]">
                        {item.count} {item.count === 1 ? 'Lead' : 'Leads'}
                      </span>
                    </div>

                    <h4 className="text-[0.88vw] font-bold text-gray-900 group-hover:text-[#4c5add] transition-colors truncate">
                      {item.name}
                    </h4>

                    <p className="text-[0.7vw] text-gray-600 mt-[0.2vw]">
                      Latest: <span className="text-gray-900 font-semibold">{formatDateTime(item.latestDate)}</span>
                    </p>
                  </div>

                  <div className="mt-[0.8vw] pt-[0.6vw] border-t border-gray-100 flex items-center justify-between text-[#4c5add] text-[0.74vw] font-semibold">
                    <span>View leads</span>
                    <Icon icon="lucide:arrow-right" className="w-[0.8vw] h-[0.8vw] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))}

              {bookBreakdown.length === 0 && (
                <div className="col-span-full py-[3vw] text-center text-gray-600">
                  <Icon icon="clarity:library-line" className="w-[2.4vw] h-[2.4vw] mx-auto text-gray-400 mb-[0.4vw]" />
                  <p className="text-[0.85vw] font-semibold text-gray-800">No Flipbook Lead Data Found</p>
                  <p className="text-[0.72vw] text-gray-600 mt-[0.1vw]">
                    When viewers submit lead forms on your flipbooks, they will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* TRADITIONAL TABLE WITH CLEAR BORDER CELLS, NO PILLS, DARK READABLE TEXT */
          <div className="border border-gray-300 rounded-[0.4vw] overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 text-[0.72vw] uppercase tracking-wider font-bold text-gray-800">
                    <th className="py-[0.65vw] px-[0.8vw] w-[4%] text-center border-r border-gray-200">S.No</th>
                    <th className="py-[0.65vw] px-[0.8vw] w-[15%] border-r border-gray-200">Date & Time</th>
                    <th className="py-[0.65vw] px-[0.8vw] w-[24%] border-r border-gray-200">Flipbook</th>
                    <th className="py-[0.65vw] px-[0.8vw] w-[17%] border-r border-gray-200">Contact Name</th>
                    <th className="py-[0.65vw] px-[0.8vw] w-[22%] border-r border-gray-200">Email / Phone</th>
                    <th className="py-[0.65vw] px-[0.8vw] w-[12%] border-r border-gray-200">Captured Info</th>
                    <th className="py-[0.65vw] px-[0.8vw] w-[6%] text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-[0.76vw]">
                  {paginatedLeads.map((lead, idx) => {
                    const sNo = (safeCurrentPage - 1) * pageSize + idx + 1;
                    const summary = getLeadSummary(lead.leadData);
                    const leadFieldsCount = lead.leadData && typeof lead.leadData === 'object' ? Object.keys(lead.leadData).length : 0;

                    return (
                      <tr key={lead._id || lead.leadId} className="hover:bg-slate-50 transition-colors">
                        
                        {/* S.No */}
                        <td className="py-[0.65vw] px-[0.8vw] text-center font-mono text-gray-700 text-[0.72vw] border-r border-gray-200">
                          {sNo}
                        </td>

                        {/* Date & Time (replaces Lead ID position) */}
                        <td className="py-[0.65vw] px-[0.8vw] text-gray-800 whitespace-nowrap text-[0.72vw] border-r border-gray-200">
                          <span>{formatDateTime(lead.submittedAt || lead.createdAt)}</span>
                        </td>

                        {/* Flipbook */}
                        <td className="py-[0.65vw] px-[0.8vw] max-w-[15vw] truncate border-r border-gray-200 text-gray-900 text-[0.76vw]">
                          <span className="truncate block font-medium">{lead.flipbookName || 'Untitled Flipbook'}</span>
                        </td>

                        {/* Contact Name */}
                        <td className="py-[0.65vw] px-[0.8vw] text-gray-900 border-r border-gray-200">
                          {summary.name !== '—' ? (
                            <span>{summary.name}</span>
                          ) : (
                            <span className="text-gray-500 italic">Not provided</span>
                          )}
                        </td>

                        {/* Email / Phone */}
                        <td className="py-[0.65vw] px-[0.8vw] text-gray-800 border-r border-gray-200">
                          <div className="flex flex-col gap-[0.1vw]">
                            {summary.email !== '—' && (
                              <span className="flex items-center gap-[0.3vw] text-gray-900 truncate max-w-[14vw]">
                                <Icon icon="lucide:mail" className="w-[0.7vw] h-[0.7vw] text-gray-500 shrink-0" />
                                <span className="truncate">{summary.email}</span>
                              </span>
                            )}
                            {summary.phone !== '—' && (
                              <span className="flex items-center gap-[0.3vw] text-gray-700 text-[0.72vw]">
                                <Icon icon="lucide:phone" className="w-[0.7vw] h-[0.7vw] text-gray-500 shrink-0" />
                                {summary.phone}
                              </span>
                            )}
                            {summary.email === '—' && summary.phone === '—' && (
                              <span className="text-gray-500">—</span>
                            )}
                          </div>
                        </td>

                        {/* Captured Info - Normal clean text, no pill */}
                        <td className="py-[0.65vw] px-[0.8vw] text-gray-800 border-r border-gray-200">
                          <span className="flex items-center gap-[0.3vw]">
                            <Icon icon="lucide:file-text" className="w-[0.7vw] h-[0.7vw] text-[#4c5add]" />
                            {leadFieldsCount} field{leadFieldsCount === 1 ? '' : 's'}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-[0.65vw] px-[0.8vw] text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedLeadModal(lead)}
                            className="px-[0.6vw] py-[0.25vw] rounded-[0.3vw] bg-white hover:bg-[#4c5add] hover:text-white text-gray-700 text-[0.72vw] font-medium transition-all cursor-pointer inline-flex items-center gap-[0.25vw] border border-gray-300 shadow-2xs"
                          >
                            <Icon icon="lucide:eye" className="w-[0.75vw] h-[0.75vw]" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredLeads.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-[3vw] text-center text-gray-600">
                        <Icon icon="solar:folder-open-broken" className="w-[2vw] h-[2vw] mx-auto text-gray-400 mb-[0.4vw]" />
                        <p className="text-[0.85vw] font-bold text-gray-800">No leads found</p>
                        <p className="text-[0.72vw] text-gray-600 mt-[0.1vw]">
                          Try adjusting your search query, flipbook filter, or date range.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination & Summary Footer */}
            <div className="bg-gray-100 border-t border-gray-300 px-[0.9vw] py-[0.55vw] flex flex-col sm:flex-row items-center justify-between gap-[0.5vw] text-[0.74vw] text-gray-700">
              
              {/* Left: Range and Page Size selector */}
              <div className="flex items-center gap-[0.8vw]">
                <span>
                  Showing{' '}
                  <strong className="text-gray-900 font-bold">
                    {totalItems > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-gray-900 font-bold">
                    {Math.min(safeCurrentPage * pageSize, totalItems)}
                  </strong>{' '}
                  of <strong className="text-gray-900 font-bold">{totalItems}</strong> entries
                </span>

                <div className="flex items-center gap-[0.3vw]">
                  <span className="text-gray-600 font-medium">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="bg-white border border-gray-300 rounded-[0.3vw] px-[0.4vw] py-[0.15vw] text-[0.72vw] font-semibold text-gray-900 cursor-pointer focus:outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {/* Right: Pagination Controls */}
              <div className="flex items-center gap-[0.3vw]">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={safeCurrentPage <= 1}
                  className={`w-[1.6vw] h-[1.6vw] flex items-center justify-center rounded-[0.35vw] border transition-all ${
                    safeCurrentPage <= 1
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                      : 'border-gray-300 text-gray-800 hover:bg-gray-200 hover:text-black cursor-pointer bg-white font-bold'
                  }`}
                  title="First Page"
                >
                  <Icon icon="lucide:chevrons-left" className="w-[0.85vw] h-[0.85vw]" />
                </button>

                {/* Prev Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className={`w-[1.6vw] h-[1.6vw] flex items-center justify-center rounded-[0.35vw] border transition-all ${
                    safeCurrentPage <= 1
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                      : 'border-gray-300 text-gray-800 hover:bg-gray-200 hover:text-black cursor-pointer bg-white font-bold'
                  }`}
                  title="Previous Page"
                >
                  <Icon icon="lucide:chevron-left" className="w-[0.85vw] h-[0.85vw]" />
                </button>

                {/* Page Indicator */}
                <div className="flex items-center gap-[0.2vw] px-[0.4vw]">
                  <span className="text-gray-900 font-bold">Page {safeCurrentPage} of {totalPages}</span>
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className={`w-[1.6vw] h-[1.6vw] flex items-center justify-center rounded-[0.35vw] border transition-all ${
                    safeCurrentPage >= totalPages
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                      : 'border-gray-300 text-gray-800 hover:bg-gray-200 hover:text-black cursor-pointer bg-white font-bold'
                  }`}
                  title="Next Page"
                >
                  <Icon icon="lucide:chevron-right" className="w-[0.85vw] h-[0.85vw]" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={safeCurrentPage >= totalPages}
                  className={`w-[1.6vw] h-[1.6vw] flex items-center justify-center rounded-[0.35vw] border transition-all ${
                    safeCurrentPage >= totalPages
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50'
                      : 'border-gray-300 text-gray-800 hover:bg-gray-200 hover:text-black cursor-pointer bg-white font-bold'
                  }`}
                  title="Last Page"
                >
                  <Icon icon="lucide:chevrons-right" className="w-[0.85vw] h-[0.85vw]" />
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* LEAD DETAIL MODAL */}
      {selectedLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-[1vw] animate-in fade-in duration-150">
          <div className="bg-white rounded-[0.9vw] w-full max-w-[38vw] max-h-[82vh] flex flex-col shadow-xl border border-gray-200 overflow-hidden">
            
            <div className="px-[1.2vw] py-[0.9vw] bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[0.62vw] uppercase tracking-wider text-slate-300 font-mono block">
                  Lead #{selectedLeadModal.leadId}
                </span>
                <h3 className="text-[0.95vw] font-bold text-white mt-[0.05vw]">
                  {selectedLeadModal.flipbookName || 'Untitled Flipbook'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLeadModal(null)}
                className="w-[1.8vw] h-[1.8vw] rounded-full hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <Icon icon="lucide:x" className="w-[0.95vw] h-[0.95vw]" />
              </button>
            </div>

            <div className="p-[1.2vw] overflow-y-auto space-y-[1vw] flex-1">
              <div className="grid grid-cols-2 gap-[0.6vw] bg-gray-50 border border-gray-200 rounded-[0.6vw] p-[0.7vw] text-[0.74vw]">
                <div>
                  <span className="text-gray-600 block text-[0.65vw] font-medium">Flipbook ID (v_id)</span>
                  <span className="font-bold text-gray-900 font-mono">{selectedLeadModal.v_id || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-600 block text-[0.65vw] font-medium">Submitted At</span>
                  <span className="font-bold text-gray-900">{formatDateTime(selectedLeadModal.submittedAt || selectedLeadModal.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-600 block text-[0.65vw] font-medium">Viewer IP</span>
                  <span className="font-bold text-gray-900 font-mono">{selectedLeadModal.viewerIp || 'Unknown'}</span>
                </div>
                <div>
                  <span className="text-gray-600 block text-[0.65vw] font-medium">Share ID</span>
                  <span className="font-bold text-gray-900 font-mono">{selectedLeadModal.shareId || 'Direct'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-[0.78vw] font-bold text-gray-900 mb-[0.5vw] flex items-center gap-[0.35vw]">
                  <Icon icon="solar:clipboard-list-bold-duotone" className="text-[#4c5add] w-[0.9vw] h-[0.9vw]" />
                  Submitted Form Fields
                </h4>

                <div className="border border-gray-200 rounded-[0.6vw] overflow-hidden divide-y divide-gray-200 bg-white">
                  {selectedLeadModal.leadData && typeof selectedLeadModal.leadData === 'object' && Object.keys(selectedLeadModal.leadData).length > 0 ? (
                    Object.entries(selectedLeadModal.leadData).map(([key, value]) => {
                      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                        return (
                          <div key={key} className="p-[0.7vw] flex flex-col gap-[0.4vw]">
                            <span className="text-[0.74vw] font-bold text-gray-800 capitalize">{key}:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[0.4vw]">
                              {value.map((prod, idx) => (
                                <div key={idx} className="flex items-center gap-[0.5vw] p-[0.5vw] bg-gray-50 border border-gray-200 rounded-[0.4vw]">
                                  {prod.image && typeof prod.image === 'string' ? (
                                    <img src={prod.image} alt={prod.name || 'item'} className="w-[1.8vw] h-[1.8vw] object-cover rounded-[0.25vw] border border-gray-200" />
                                  ) : (
                                    <div className="w-[1.8vw] h-[1.8vw] bg-gray-200 rounded-[0.25vw] flex items-center justify-center text-gray-600 text-[0.75vw]">
                                      <Icon icon="lucide:package" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[0.72vw] font-bold text-gray-900 truncate">{prod.name || prod.title || 'Product'}</p>
                                    <p className="text-[0.65vw] text-gray-700 font-medium">Qty: {prod.quantity || 1}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      let displayVal = value;
                      if (Array.isArray(value)) {
                        displayVal = value.join(', ');
                      } else if (typeof value === 'object' && value !== null) {
                        displayVal = JSON.stringify(value);
                      }

                      return (
                        <div key={key} className="p-[0.65vw] flex items-start justify-between gap-[0.8vw]">
                          <span className="text-[0.74vw] font-bold text-gray-700 capitalize w-[35%] shrink-0">
                            {key}
                          </span>
                          <span className="text-[0.76vw] text-gray-900 font-semibold break-all flex-1 text-right select-all">
                            {String(displayVal || '—')}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-[1.2vw] text-center text-gray-600 text-[0.74vw]">
                      No custom fields recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-[1.2vw] py-[0.7vw] bg-gray-50 border-t border-gray-200 flex items-center justify-end">
              <button
                onClick={() => setSelectedLeadModal(null)}
                className="px-[0.8vw] py-[0.35vw] bg-gray-200 hover:bg-gray-300 text-gray-900 text-[0.72vw] font-semibold rounded-[0.4vw] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LeadFormData;
