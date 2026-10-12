import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Icon } from '@iconify/react';
import {
  Eye,
  Users,
  Clock,
  Hourglass,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  BookOpen,
  Calendar,
  ChevronDown,
  Sparkles,
  TrendingUp,
  MapPin,
  Compass,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

const getBackendUrl = () => {
  const origin = window.location.origin;
  if (origin.includes('devtunnels.ms')) {
    return origin.replace('-5173', '-5000');
  }
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    const portMatch = origin.match(/:(\d+)/);
    if (portMatch) {
      return origin.replace(portMatch[0], ':5000');
    }
  }
  return 'http://localhost:5000';
};

const formatDuration = (seconds = 0) => {
  const sec = Math.max(0, Math.round(Number(seconds) || 0));
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

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const now = new Date();
  const past = new Date(dateStr);
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  const days = Math.floor(diffSec / 86400);
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
      // Fallback if parsing fails
    }
    return '';
  }, []);

  const [flipbooks, setFlipbooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState('ALL'); // 'ALL' or specific v_id
  const [selectedDays, setSelectedDays] = useState(30); // 7, 30, 90
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState(null);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Fetch creator's books list for dropdown
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

  // Fetch analytics for ALL or specific book
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
      if (selectedBookId === 'ALL') {
        const res = await axios.get(`${backendUrl}/api/analytics/user/${encodeURIComponent(userEmail)}`);
        setAnalyticsData({
          mode: 'ALL',
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
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load tracking analytics. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userEmail, selectedBookId, selectedDays]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Compute key summary cards
  const summary = useMemo(() => {
    if (!analyticsData) {
      return { totalViews: 0, uniqueVisitors: 0, avgDuration: 0, totalDuration: 0 };
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
      totalDuration: analyticsData.totalDurationSeconds || 0
    };
  }, [analyticsData]);

  // Device split
  const devices = useMemo(() => {
    return analyticsData?.devices || [];
  }, [analyticsData]);

  // Top Countries
  const countries = useMemo(() => {
    return analyticsData?.countries || analyticsData?.topCountries || [];
  }, [analyticsData]);

  // Top States / Provinces
  const states = useMemo(() => {
    return analyticsData?.states || analyticsData?.topStates || [];
  }, [analyticsData]);

  // Daily views timeline for single book
  const dailyViews = useMemo(() => {
    return analyticsData?.dailyViews || [];
  }, [analyticsData]);

  // Top books for user overview
  const topBooks = useMemo(() => {
    return analyticsData?.topBooks || [];
  }, [analyticsData]);

  // Recent Sessions
  const recentSessions = useMemo(() => {
    return analyticsData?.recentSessions || [];
  }, [analyticsData]);

  const selectedBookTitle = useMemo(() => {
    if (selectedBookId === 'ALL') return 'All Flipbooks (Aggregate)';
    const found = flipbooks.find(b => b.v_id === selectedBookId);
    return found ? (found.flipbookName || 'Untitled Flipbook') : 'Selected Flipbook';
  }, [selectedBookId, flipbooks]);

  return (
    <div className="bg-slate-50/70 min-h-full rounded-[1.5vw] p-[1.8vw] text-slate-800 space-y-[1.6vw] animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-[1vw] pb-[1vw] border-b border-slate-200/80">
        <div className="space-y-[0.2vw]">
          <div className="flex items-center gap-[0.6vw]">
            <div className="w-[2.2vw] h-[2.2vw] min-w-[32px] min-h-[32px] rounded-xl bg-gradient-to-tr from-[#5551FF] to-[#8C89FF] flex items-center justify-center text-white shadow-md shadow-[#5551FF]/20">
              <TrendingUp className="w-[1.2vw] h-[1.2vw] min-w-[18px] min-h-[18px]" />
            </div>
            <div>
              <h1 className="text-[1.35vw] min-text-[20px] font-bold text-slate-900 tracking-tight flex items-center gap-[0.5vw]">
                Viewer Analytics & Tracking
                <span className="text-[0.65vw] min-text-[10px] font-semibold uppercase px-[0.5vw] py-[0.15vw] rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  Live In-House
                </span>
              </h1>
              <p className="text-[0.75vw] min-text-[12px] text-slate-500">
                Independent privacy-friendly tracking for view counts, stay durations, and audience locations.
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-[0.8vw]">
          {/* Flipbook Select Dropdown */}
          <div className="relative">
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-[0.8vw] min-text-[13px] rounded-[0.7vw] pl-[2.2vw] pr-[2.2vw] py-[0.5vw] focus:outline-none focus:ring-2 focus:ring-[#5551FF]/20 focus:border-[#5551FF] transition shadow-xs cursor-pointer"
            >
              <option value="ALL">📚 All Flipbooks Overview</option>
              {flipbooks.map(b => (
                <option key={b.v_id} value={b.v_id}>
                  📖 {b.flipbookName || 'Untitled Flipbook'}
                </option>
              ))}
            </select>
            <BookOpen className="w-[1vw] h-[1vw] min-w-[14px] min-h-[14px] text-slate-400 absolute left-[0.7vw] top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-[0.9vw] h-[0.9vw] min-w-[13px] min-h-[13px] text-slate-400 absolute right-[0.7vw] top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Time Filter for single book */}
          {selectedBookId !== 'ALL' && (
            <div className="flex bg-slate-200/70 p-[0.2vw] rounded-[0.6vw]">
              {[7, 30, 90].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDays(d)}
                  className={`text-[0.75vw] min-text-[12px] font-semibold px-[0.7vw] py-[0.35vw] rounded-[0.45vw] transition-all cursor-pointer ${
                    selectedDays === d
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing || loading}
            title="Refresh analytics data"
            className="flex items-center gap-[0.4vw] px-[0.9vw] py-[0.5vw] bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-[0.7vw] text-[0.8vw] min-text-[13px] font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-[0.9vw] h-[0.9vw] min-w-[14px] min-h-[14px] ${refreshing ? 'animate-spin text-[#5551FF]' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-[1vw] py-[0.7vw] rounded-xl text-[0.8vw] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => loadAnalytics(true)} className="underline font-semibold cursor-pointer">Retry</button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-[1.4vw] py-[2vw]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.2vw]">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="bg-white rounded-[1.2vw] p-[1.4vw] h-[7.5vw] min-h-[100px] animate-pulse border border-slate-100 flex flex-col justify-between">
                <div className="w-[40%] h-[1vw] bg-slate-200 rounded"></div>
                <div className="w-[60%] h-[2vw] bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-[1.2vw] p-[2vw] h-[20vw] min-h-[250px] animate-pulse border border-slate-100"></div>
        </div>
      ) : (
        <>
          {/* Key Metric Highlights Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.2vw]">
            {/* Total Views */}
            <div className="bg-white rounded-[1.2vw] p-[1.3vw] border border-slate-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-[0.8vw]">
                <span className="text-[0.78vw] min-text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Total Views</span>
                <div className="w-[2.2vw] h-[2.2vw] min-w-[32px] min-h-[32px] rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Eye className="w-[1.1vw] h-[1.1vw] min-w-[16px] min-h-[16px]" />
                </div>
              </div>
              <div className="text-[2vw] min-text-[26px] font-extrabold text-slate-900 tracking-tight leading-none mb-[0.4vw]">
                {summary.totalViews.toLocaleString()}
              </div>
              <p className="text-[0.72vw] min-text-[11px] text-slate-400">
                Shared flipbook link openings
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            </div>

            {/* Unique Visitors */}
            <div className="bg-white rounded-[1.2vw] p-[1.3vw] border border-slate-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-[0.8vw]">
                <span className="text-[0.78vw] min-text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Unique Visitors</span>
                <div className="w-[2.2vw] h-[2.2vw] min-w-[32px] min-h-[32px] rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-[1.1vw] h-[1.1vw] min-w-[16px] min-h-[16px]" />
                </div>
              </div>
              <div className="text-[2vw] min-text-[26px] font-extrabold text-slate-900 tracking-tight leading-none mb-[0.4vw]">
                {summary.uniqueVisitors.toLocaleString()}
              </div>
              <p className="text-[0.72vw] min-text-[11px] text-slate-400">
                Distinct IP addresses recorded
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            </div>

            {/* Average Duration */}
            <div className="bg-white rounded-[1.2vw] p-[1.3vw] border border-slate-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-[0.8vw]">
                <span className="text-[0.78vw] min-text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Avg. Session Time</span>
                <div className="w-[2.2vw] h-[2.2vw] min-w-[32px] min-h-[32px] rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock className="w-[1.1vw] h-[1.1vw] min-w-[16px] min-h-[16px]" />
                </div>
              </div>
              <div className="text-[2vw] min-text-[26px] font-extrabold text-slate-900 tracking-tight leading-none mb-[0.4vw]">
                {formatDuration(summary.avgDuration)}
              </div>
              <p className="text-[0.72vw] min-text-[11px] text-slate-400">
                Average reading time per session
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 to-pink-500"></div>
            </div>

            {/* Total Engagement Duration */}
            <div className="bg-white rounded-[1.2vw] p-[1.3vw] border border-slate-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-[0.8vw]">
                <span className="text-[0.78vw] min-text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Total Time Spent</span>
                <div className="w-[2.2vw] h-[2.2vw] min-w-[32px] min-h-[32px] rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Hourglass className="w-[1.1vw] h-[1.1vw] min-w-[16px] min-h-[16px]" />
                </div>
              </div>
              <div className="text-[2vw] min-text-[26px] font-extrabold text-slate-900 tracking-tight leading-none mb-[0.4vw]">
                {formatDuration(summary.totalDuration)}
              </div>
              <p className="text-[0.72vw] min-text-[11px] text-slate-400">
                Cumulative audience engagement
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 to-orange-500"></div>
            </div>
          </div>

          {/* Detailed Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1.4vw]">
            {/* Left 2 Cols: Views Over Time or Top Books */}
            <div className="lg:col-span-2 bg-white rounded-[1.2vw] p-[1.5vw] border border-slate-100 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-[1.2vw]">
                <div>
                  <h2 className="text-[1.05vw] min-text-[16px] font-bold text-slate-900 flex items-center gap-[0.4vw]">
                    {selectedBookId === 'ALL' ? (
                      <>
                        <BookOpen className="w-[1vw] h-[1vw] text-[#5551FF]" />
                        Top Performing Flipbooks
                      </>
                    ) : (
                      <>
                        <Calendar className="w-[1vw] h-[1vw] text-[#5551FF]" />
                        Views Over Time ({selectedDays} Days)
                      </>
                    )}
                  </h2>
                  <p className="text-[0.75vw] text-slate-400">
                    {selectedBookId === 'ALL'
                      ? 'Flipbooks ranked by visitor popularity and duration'
                      : `Daily readership trend for ${selectedBookTitle}`}
                  </p>
                </div>
                {selectedBookId !== 'ALL' && (
                  <span className="text-[0.72vw] font-semibold text-[#5551FF] bg-[#5551FF]/10 px-[0.6vw] py-[0.2vw] rounded-full">
                    {dailyViews.length} Active Days
                  </span>
                )}
              </div>

              {/* Views Timeline Chart (for single book) */}
              {selectedBookId !== 'ALL' && (
                <div className="w-full">
                  {dailyViews.length === 0 ? (
                    <div className="h-[14vw] min-h-[180px] flex flex-col items-center justify-center text-slate-400 text-[0.85vw]">
                      <Calendar className="w-[2vw] h-[2vw] text-slate-300 mb-[0.5vw]" />
                      <span>No views recorded in this period yet.</span>
                      <span className="text-[0.72vw] text-slate-400 mt-[0.2vw]">Share your flipbook link to start tracking daily views.</span>
                    </div>
                  ) : (
                    <div className="space-y-[1vw]">
                      <div className="h-[14vw] min-h-[190px] flex items-end gap-[0.5vw] pt-[2vw] px-[0.5vw] relative border-b border-slate-100">
                        {(() => {
                          const maxViews = Math.max(...dailyViews.map(d => d.views), 1);
                          return dailyViews.map((day, idx) => {
                            const barHeight = Math.max(12, Math.round((day.views / maxViews) * 100));
                            const isHovered = hoveredBar === idx;
                            return (
                              <div
                                key={day._id}
                                className="flex-1 flex flex-col items-center justify-end h-full relative group"
                                onMouseEnter={() => setHoveredBar(idx)}
                                onMouseLeave={() => setHoveredBar(null)}
                              >
                                {isHovered && (
                                  <div className="absolute -top-[3vw] bg-slate-900 text-white text-[0.7vw] font-medium py-[0.3vw] px-[0.6vw] rounded-lg shadow-lg whitespace-nowrap z-20 pointer-events-none animate-in fade-in duration-150">
                                    <div className="font-bold">{day._id}</div>
                                    <div className="text-blue-300">{day.views} {day.views === 1 ? 'view' : 'views'}</div>
                                    <div className="text-slate-300">Avg: {formatDuration(day.avgDuration)}</div>
                                  </div>
                                )}
                                <div
                                  className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                                    isHovered
                                      ? 'bg-gradient-to-t from-[#5551FF] to-[#8C89FF] shadow-md shadow-[#5551FF]/30 scale-y-105'
                                      : 'bg-gradient-to-t from-slate-300 to-indigo-300 hover:from-[#5551FF] hover:to-[#8C89FF]'
                                  }`}
                                  style={{ height: `${barHeight}%` }}
                                ></div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <div className="flex justify-between text-[0.68vw] text-slate-400 px-[0.5vw]">
                        <span>{dailyViews[0]?._id}</span>
                        <span>{dailyViews[dailyViews.length - 1]?._id}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Top Books Table (for ALL books mode) */}
              {selectedBookId === 'ALL' && (
                <div className="w-full overflow-x-auto">
                  {topBooks.length === 0 ? (
                    <div className="h-[14vw] min-h-[180px] flex flex-col items-center justify-center text-slate-400 text-[0.85vw]">
                      <BookOpen className="w-[2vw] h-[2vw] text-slate-300 mb-[0.5vw]" />
                      <span>No flipbook sessions recorded yet.</span>
                      <span className="text-[0.72vw] text-slate-400 mt-[0.2vw]">Once readers open your shared flipbook links, they'll appear here.</span>
                    </div>
                  ) : (
                    <table className="w-full text-left text-[0.78vw]">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[0.7vw] uppercase">
                          <th className="pb-[0.6vw] pl-[0.4vw]">Flipbook Name</th>
                          <th className="pb-[0.6vw] text-center">Views</th>
                          <th className="pb-[0.6vw] text-center">Avg. Time</th>
                          <th className="pb-[0.6vw] text-right pr-[0.4vw]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {topBooks.map((b) => (
                          <tr key={b.v_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-[0.7vw] pl-[0.4vw] font-semibold text-slate-800 flex items-center gap-[0.5vw]">
                              <span className="w-[1.6vw] h-[1.6vw] rounded-lg bg-indigo-50 text-[#5551FF] flex items-center justify-center text-[0.7vw] font-bold">
                                📖
                              </span>
                              <span className="truncate max-w-[200px]" title={b.name}>{b.name}</span>
                            </td>
                            <td className="py-[0.7vw] text-center font-bold text-slate-900">
                              {b.views.toLocaleString()}
                            </td>
                            <td className="py-[0.7vw] text-center text-slate-600 font-medium">
                              {formatDuration(b.avgDurationSeconds)}
                            </td>
                            <td className="py-[0.7vw] text-right pr-[0.4vw]">
                              <button
                                onClick={() => setSelectedBookId(b.v_id)}
                                className="inline-flex items-center gap-[0.2vw] text-[0.72vw] font-semibold text-[#5551FF] hover:text-[#423dff] bg-[#5551FF]/8 hover:bg-[#5551FF]/15 px-[0.6vw] py-[0.25vw] rounded-md transition cursor-pointer"
                              >
                                Deep Dive
                                <ArrowUpRight className="w-[0.75vw] h-[0.75vw]" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

            {/* Right 1 Col: Geographic Distribution */}
            <div className="bg-white rounded-[1.2vw] p-[1.5vw] border border-slate-100 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-[1vw]">
                  <h2 className="text-[1.05vw] min-text-[16px] font-bold text-slate-900 flex items-center gap-[0.4vw]">
                    <Globe className="w-[1vw] h-[1vw] text-emerald-500" />
                    Geographic Location
                  </h2>
                  <span className="text-[0.68vw] text-slate-400">By IP Address</span>
                </div>
                <p className="text-[0.75vw] text-slate-400 mb-[1.2vw]">
                  Where your readers are tuning in from across the world.
                </p>

                {countries.length === 0 ? (
                  <div className="h-[12vw] flex flex-col items-center justify-center text-slate-400 text-[0.8vw]">
                    <Compass className="w-[2vw] h-[2vw] text-slate-300 mb-[0.4vw]" />
                    <span>No country data recorded yet.</span>
                  </div>
                ) : (
                  <div className="space-y-[0.8vw]">
                    {countries.slice(0, 5).map((c) => {
                      const pct = summary.totalViews > 0 ? Math.round((c.views / summary.totalViews) * 100) : 0;
                      return (
                        <div key={c.country} className="space-y-[0.2vw]">
                          <div className="flex items-center justify-between text-[0.78vw] font-medium">
                            <span className="flex items-center gap-[0.4vw] text-slate-800">
                              <span className="text-[1vw]">{getCountryFlag(c.code)}</span>
                              <span className="font-semibold">{c.country}</span>
                            </span>
                            <span className="text-slate-500 font-semibold">
                              {c.views} <span className="text-slate-400 text-[0.7vw]">({pct}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-[6px] overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(8, pct))}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* States & Cities Badges */}
              {((states && states.length > 0) || (analyticsData?.cities && analyticsData.cities.length > 0)) && (
                <div className="pt-[1vw] mt-[1vw] border-t border-slate-100 space-y-[0.8vw]">
                  {states && states.length > 0 && (
                    <div>
                      <span className="text-[0.7vw] font-semibold text-slate-400 uppercase tracking-wider block mb-[0.4vw]">
                        Top States / Provinces
                      </span>
                      <div className="flex flex-wrap gap-[0.4vw]">
                        {states.map(st => (
                          <span
                            key={st.state}
                            className="text-[0.7vw] font-medium bg-emerald-50 text-emerald-800 border border-emerald-100 px-[0.5vw] py-[0.15vw] rounded-md flex items-center gap-[0.2vw]"
                          >
                            <MapPin className="w-[0.6vw] h-[0.6vw] text-emerald-600" />
                            {st.state} ({st.views})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analyticsData?.cities && analyticsData.cities.length > 0 && (
                    <div>
                      <span className="text-[0.7vw] font-semibold text-slate-400 uppercase tracking-wider block mb-[0.4vw]">
                        Top Cities
                      </span>
                      <div className="flex flex-wrap gap-[0.4vw]">
                        {analyticsData.cities.map(city => (
                          <span
                            key={city.city}
                            className="text-[0.7vw] font-medium bg-slate-100 text-slate-700 px-[0.5vw] py-[0.15vw] rounded-md flex items-center gap-[0.2vw]"
                          >
                            <MapPin className="w-[0.6vw] h-[0.6vw] text-slate-400" />
                            {city.city} ({city.views})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Grid: Devices Breakdown + Recent Sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-[1.4vw]">
            {/* Devices & Environment Breakdown */}
            <div className="bg-white rounded-[1.2vw] p-[1.5vw] border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between mb-[1vw]">
                <h2 className="text-[1.05vw] min-text-[16px] font-bold text-slate-900 flex items-center gap-[0.4vw]">
                  <Monitor className="w-[1vw] h-[1vw] text-indigo-500" />
                  Devices & Platforms
                </h2>
                <span className="text-[0.68vw] text-slate-400">User-Agent</span>
              </div>

              {devices.length === 0 ? (
                <div className="h-[8vw] flex flex-col items-center justify-center text-slate-400 text-[0.8vw]">
                  <span>No device data recorded yet.</span>
                </div>
              ) : (
                <div className="space-y-[1vw]">
                  <div className="grid grid-cols-3 gap-[0.6vw]">
                    {['Desktop', 'Mobile', 'Tablet'].map((devType) => {
                      const item = devices.find(d => d.type === devType);
                      const views = item ? item.views : 0;
                      const pct = summary.totalViews > 0 ? Math.round((views / summary.totalViews) * 100) : 0;
                      return (
                        <div key={devType} className="bg-slate-50/80 rounded-[0.8vw] p-[0.8vw] text-center border border-slate-100">
                          <div className="w-[2vw] h-[2vw] min-w-[28px] min-h-[28px] mx-auto mb-[0.4vw] rounded-lg bg-white shadow-xs flex items-center justify-center text-slate-600">
                            {devType === 'Desktop' && <Monitor className="w-[1vw] h-[1vw]" />}
                            {devType === 'Mobile' && <Smartphone className="w-[1vw] h-[1vw]" />}
                            {devType === 'Tablet' && <Tablet className="w-[1vw] h-[1vw]" />}
                          </div>
                          <div className="text-[0.72vw] font-semibold text-slate-500">{devType}</div>
                          <div className="text-[1.1vw] font-extrabold text-slate-900 leading-tight">{pct}%</div>
                          <div className="text-[0.65vw] text-slate-400">{views} views</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Browser Breakdown */}
                  {analyticsData?.browsers && analyticsData.browsers.length > 0 && (
                    <div className="pt-[0.8vw] border-t border-slate-100">
                      <span className="text-[0.7vw] font-semibold text-slate-400 uppercase tracking-wider block mb-[0.5vw]">
                        Browsers Used
                      </span>
                      <div className="space-y-[0.35vw]">
                        {analyticsData.browsers.map(b => (
                          <div key={b.browser} className="flex items-center justify-between text-[0.74vw]">
                            <span className="text-slate-700 font-medium">{b.browser}</span>
                            <span className="text-slate-400 font-semibold">{b.views} sessions</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Visitor Sessions Table */}
            <div className="lg:col-span-2 bg-white rounded-[1.2vw] p-[1.5vw] border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between mb-[1vw]">
                <div>
                  <h2 className="text-[1.05vw] min-text-[16px] font-bold text-slate-900 flex items-center gap-[0.4vw]">
                    <Clock className="w-[1vw] h-[1vw] text-amber-500" />
                    Recent Visitor Sessions
                  </h2>
                  <p className="text-[0.75vw] text-slate-400">
                    Live stream of recent audience interactions and reading sessions
                  </p>
                </div>
              </div>

              {recentSessions.length === 0 ? (
                <div className="h-[10vw] flex flex-col items-center justify-center text-slate-400 text-[0.8vw]">
                  <Users className="w-[2vw] h-[2vw] text-slate-300 mb-[0.4vw]" />
                  <span>No recent viewer sessions found.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[0.78vw]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[0.7vw] uppercase">
                        <th className="pb-[0.6vw]">Location</th>
                        <th className="pb-[0.6vw]">Device / Browser</th>
                        <th className="pb-[0.6vw] text-center">Duration</th>
                        <th className="pb-[0.6vw] text-center">Reading Depth</th>
                        <th className="pb-[0.6vw] text-right">When</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentSessions.map((sess) => (
                        <tr key={sess.sessionId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-[0.6vw] font-medium text-slate-800">
                            <div className="flex items-center gap-[0.4vw]">
                              <span className="text-[1.1vw]">{getCountryFlag(sess.location?.countryCode)}</span>
                              <div>
                                <div className="font-semibold text-slate-900 text-[0.76vw]">
                                  {sess.location?.country || 'Unknown'}
                                </div>
                                <div className="text-[0.68vw] text-slate-400">
                                  {[sess.location?.city !== 'Unknown' ? sess.location?.city : '', sess.location?.state !== 'Unknown' && sess.location?.state !== 'Local State' ? sess.location?.state : ''].filter(Boolean).join(', ') || sess.location?.city || sess.location?.ip}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-[0.6vw]">
                            <div className="text-slate-800 font-medium text-[0.76vw]">
                              {sess.device?.type || 'Desktop'}
                            </div>
                            <div className="text-[0.68vw] text-slate-400">
                              {sess.device?.browser || 'Browser'} • {sess.device?.os || 'OS'}
                            </div>
                          </td>
                          <td className="py-[0.6vw] text-center font-bold text-slate-800">
                            {formatDuration(sess.durationSeconds)}
                          </td>
                          <td className="py-[0.6vw] text-center">
                            <span className="px-[0.5vw] py-[0.15vw] rounded-full bg-indigo-50 text-[#5551FF] font-semibold text-[0.7vw]">
                              Page {sess.maxPageReached || 1}
                            </span>
                          </td>
                          <td className="py-[0.6vw] text-right text-slate-400 font-medium text-[0.72vw]">
                            {formatTimeAgo(sess.startedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
