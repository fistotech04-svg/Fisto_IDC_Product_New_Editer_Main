// Frontend/src/pages/Forum/Forum.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Layers, 
  FolderKanban, 
  UserCheck, 
  CheckCircle2, 
  HelpCircle,
  BookOpen,
  Filter,
  ArrowUpDown,
  Lightbulb,
  Clock,
  Sparkles,
  Inbox,
  AlertCircle,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ForumSidebar from './ForumSidebar';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import PostDetailView from './PostDetailView';
import { 
  FORUM_MODULES, 
  getStoredPosts, 
  saveStoredPosts 
} from './forumData';
import { useToast } from '../../components/CustomToast';

export default function Forum({ isAdminMode = false }) {
  const location = useLocation();
  const isAdminRoute = Boolean(isAdminMode || (location && location.pathname.includes('/forum/admin')));

  const [posts, setPosts] = useState(() => getStoredPosts());
  
  // 3 Primary Forum Navigation Areas:
  // 'all' = All Discussions across all 6 modules
  // 'modules' = Module Discussions (filtered by selected module)
  // 'my_posts' = Personal user posts
  const [activeArea, setActiveArea] = useState('all'); 
  const [selectedModuleId, setSelectedModuleId] = useState('my-flipbooks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters: 'all' | 'unanswered' | 'answered' | 'my_posts'
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Sorting: 'newest' | 'updated'
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Navigation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);

  const toast = useToast();

  const [currentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  const effectiveUser = useMemo(() => {
    if (isAdminRoute) {
      return {
        ...(currentUser || {}),
        name: currentUser?.name || 'Flipibook Admin',
        email: currentUser?.email || 'admin@flipibook.com',
        isAdmin: true,
        role: 'admin'
      };
    }
    return currentUser;
  }, [currentUser, isAdminRoute]);

  const currentUserId = effectiveUser?.email || effectiveUser?.emailId || 'current_user';

  // Check URL query on initial mount (for direct link sharing)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlPostId = params.get('post');
      if (urlPostId) {
        setSelectedPostId(urlPostId);
      }
    } catch (e) {}
  }, []);

  // Sync state changes with localStorage
  useEffect(() => {
    saveStoredPosts(posts);
  }, [posts]);

  // Counts of unanswered posts per module for sidebar badge
  const moduleCounts = useMemo(() => {
    const counts = {};
    FORUM_MODULES.forEach(m => {
      counts[m.id] = posts.filter(p => p.moduleId === m.id).length;
    });
    return counts;
  }, [posts]);

  const activeModule = useMemo(() => {
    return FORUM_MODULES.find(m => m.id === selectedModuleId) || FORUM_MODULES[0];
  }, [selectedModuleId]);

  // Currently opened post
  const activePost = useMemo(() => {
    if (!selectedPostId) return null;
    return posts.find(p => p.id === selectedPostId) || null;
  }, [posts, selectedPostId]);

  // Count user's personal posts
  const myPostsCount = useMemo(() => {
    return posts.filter(p => p.author?.email === currentUserId || p.author?.name === currentUser?.name).length;
  }, [posts, currentUserId, currentUser]);

  // Unanswered count across entire forum
  const totalUnansweredCount = useMemo(() => {
    return posts.filter(p => p.status === 'awaiting_admin').length;
  }, [posts]);

  // Filtered & sorted discussions
  const displayedPosts = useMemo(() => {
    return posts.filter(post => {
      // 1. Area filtering
      if (activeArea === 'modules') {
        if (post.moduleId !== selectedModuleId) return false;
      } else if (activeArea === 'my_posts') {
        const isMyPost = post.author?.email === currentUserId || post.author?.name === currentUser?.name;
        if (!isMyPost) return false;
      }

      // 2. Status filter
      if (statusFilter === 'unanswered') {
        if (post.status !== 'awaiting_admin') return false;
      } else if (statusFilter === 'answered') {
        if (post.status !== 'answered' && post.status !== 'implemented') return false;
      } else if (statusFilter === 'my_posts') {
        const isMyPost = post.author?.email === currentUserId || post.author?.name === currentUser?.name;
        if (!isMyPost) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = post.title?.toLowerCase().includes(query);
        const inDesc = post.description?.toLowerCase().includes(query);
        const inModule = post.moduleName?.toLowerCase().includes(query);
        const inAuthor = post.author?.name?.toLowerCase().includes(query);
        if (!inTitle && !inDesc && !inModule && !inAuthor) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'updated') {
        // Sort by updatedAt, fallback to createdAt or 0
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime() || (a.id > b.id ? 1 : -1);
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime() || (b.id > a.id ? 1 : -1);
        return timeB - timeA;
      }
      // Default: newest first (higher timestamp / ID)
      return b.id.localeCompare(a.id);
    });
  }, [posts, activeArea, selectedModuleId, statusFilter, sortOrder, searchQuery, currentUserId, currentUser]);

  // Handlers
  const handleCreatePost = (newPostData) => {
    const newPost = {
      id: `post-${Date.now()}`,
      ...newPostData,
      author: {
        name: currentUser?.name || currentUser?.email?.split('@')[0] || 'Community Member',
        email: currentUserId,
        initials: (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'ME'),
        avatarColor: currentUser?.avatarBgColor || '#4f46e5'
      },
      createdAt: 'Just now',
      updatedAt: 'Just now',
      sameQuestionUsers: [currentUserId],
      followedBy: [currentUserId],
      comments: [],
      adminReply: null
    };

    setPosts([newPost, ...posts]);
    if (toast?.showToast) {
      toast.showToast(
        newPostData.postType === 'suggestion' 
          ? 'Suggestion submitted for review!' 
          : 'Question posted! Awaiting admin response.', 
        'success'
      );
    }
  };

  const handleToggleSameQuestion = (postId) => {
    let wasLiked = false;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const users = p.sameQuestionUsers ? [...p.sameQuestionUsers] : [];
        const exists = users.includes(currentUserId);
        wasLiked = exists;
        const updated = exists ? users.filter(u => u !== currentUserId) : [...users, currentUserId];

        return {
          ...p,
          sameQuestionUsers: updated,
          updatedAt: 'Just now'
        };
      }
      return p;
    }));

    if (toast?.showToast) {
      toast.showToast(
        wasLiked ? 'Removed your vote' : 'Marked: "I have this question too!"',
        'info'
      );
    }
  };const handleAddAdminReply = (postId, adminReply, updatedStatus) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          status: updatedStatus || 'answered',
          adminReply,
          updatedAt: 'Just now'
        };
      }
      return p;
    }));
  };

  const handleAddAuthorFollowUp = (postId, followUp) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          authorFollowUps: [...(p.authorFollowUps || []), followUp],
          updatedAt: 'Just now'
        };
      }
      return p;
    }));
  };

  const handleAddAdminFollowUpReply = (postId, followUpId, adminReply) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const updatedFollowUps = (p.authorFollowUps || []).map(fu => {
          if (fu.id === followUpId) {
            return {
              ...fu,
              adminReply
            };
          }
          return fu;
        });
        return {
          ...p,
          authorFollowUps: updatedFollowUps,
          updatedAt: 'Just now'
        };
      }
      return p;
    }));
  };

  const handleAddUserComment = (postId, comment) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...(p.comments || []), comment],
          updatedAt: 'Just now'
        };
      }
      return p;
    }));
  };

  const handleDeletePost = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setSelectedPostId(null);
    if (toast?.showToast) {
      toast.showToast('Post deleted successfully', 'success');
    }
  };

  const basePath = isAdminRoute ? '/forum/admin' : '/forum';

  const handleSelectPost = (post) => {
    setSelectedPostId(post.id);
    try {
      window.history.pushState({}, '', `${basePath}?post=${post.id}`);
    } catch (e) {}
  };

  const handleBackToList = () => {
    setSelectedPostId(null);
    try {
      window.history.pushState({}, '', basePath);
    } catch (e) {}
  };

  return (
    <div className="flex h-full w-full bg-[#fdfcfa] overflow-hidden relative">
      {/* 1. Left Sidebar: Module Discussions navigation (Desktop/Tablet) */}
      <div className="hidden sm:block h-full">
        <ForumSidebar
          selectedModuleId={selectedModuleId}
          onSelectModule={(modId) => {
            setSelectedModuleId(modId);
            setActiveArea('modules');
            setSelectedPostId(null);
            setSearchQuery('');
            try {
              window.history.pushState({}, '', basePath);
            } catch (e) {}
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          moduleCounts={moduleCounts}
        />
      </div>

      {/* Mobile Drawer (Hamburger Slide-over) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          <div 
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="h-14 px-4 border-b border-orange-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-stone-900">Select Module</h2>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ForumSidebar
                selectedModuleId={selectedModuleId}
                onSelectModule={(modId) => {
                  setSelectedModuleId(modId);
                  setActiveArea('modules');
                  setSelectedPostId(null);
                  setSearchQuery('');
                  setIsMobileDrawerOpen(false);
                  try {
                    window.history.pushState({}, '', basePath);
                  } catch (e) {}
                }}
                isCollapsed={false}
                onToggleCollapse={() => setIsMobileDrawerOpen(false)}
                moduleCounts={moduleCounts}
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Content View Area */}
      {activePost ? (
        <PostDetailView
          post={activePost}
          onBack={handleBackToList}
          onAddAdminReply={handleAddAdminReply}
          onAddAuthorFollowUp={handleAddAuthorFollowUp}
          onAddAdminFollowUpReply={handleAddAdminFollowUpReply}
          onAddUserComment={handleAddUserComment}
          onToggleSameQuestion={handleToggleSameQuestion}          onDeletePost={handleDeletePost}
          currentUserId={currentUserId}
          currentUser={effectiveUser}
          isAdmin={isAdminRoute || effectiveUser?.isAdmin || effectiveUser?.role === 'admin'}
        />
      ) : (
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#fdfcfa]">
          {/* Top Main Forum Header */}
          <header className="bg-white border-b border-orange-100/80 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 flex-shrink-0">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center gap-2.5">
                {/* Mobile Hamburger Button */}
                <button
                  onClick={() => setIsMobileDrawerOpen(true)}
                  className="sm:hidden p-2 -ml-1 text-stone-600 hover:text-[#ec5137] hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
                  title="Open Modules"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
                      Forum
                    </h1>
                    {isAdminRoute && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-[#ec5137] border border-red-200 flex items-center gap-1">
                        <ShieldCheck size={12} />
                        <span>Admin</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 font-normal hidden sm:block">
                    {isAdminRoute 
                      ? 'Admin Dashboard: Publish official answers and update post status.'
                      : 'Ask questions, explore best practices, and get official support.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="relative w-full sm:w-auto">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search forum..."
                className="pl-8.5 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-stone-50/80 hover:bg-white focus:bg-white border border-stone-200 rounded-xl w-full sm:w-64 focus:outline-none focus:border-[#ec5137] focus:ring-1 focus:ring-[#ec5137]/20 transition-all text-stone-800"
              />
            </div>
          </header>

          {/* Section 1: The Three Main Areas Navigation Tabs */}
          <div className="bg-white border-b border-orange-100/70 px-4 sm:px-6 pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 flex-shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
              {/* Tab A: All Discussions */}
              <button
                onClick={() => {
                  setActiveArea('all');
                  setStatusFilter('all');
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeArea === 'all'
                    ? 'border-[#ec5137] text-[#c23d26] bg-orange-50/40'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                <Layers size={15} className={activeArea === 'all' ? 'text-[#ec5137]' : 'text-stone-400'} />
                <span>All</span>
                <span className="text-[11px] font-medium text-stone-400">
                  ({posts.length})
                </span>
              </button>

              {/* Tab B: Module Discussions */}
              <button
                onClick={() => {
                  setActiveArea('modules');
                  setStatusFilter('all');
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeArea === 'modules'
                    ? 'border-[#ec5137] text-[#c23d26] bg-orange-50/40'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                <FolderKanban size={15} className={activeArea === 'modules' ? 'text-[#ec5137]' : 'text-stone-400'} />
                <span>{activeModule.shortName || activeModule.name}</span>
                <span className="text-[11px] font-medium text-stone-400">
                  ({moduleCounts[selectedModuleId] || 0})
                </span>
              </button>

              {/* Tab C: My Posts */}
              <button
                onClick={() => {
                  setActiveArea('my_posts');
                  setStatusFilter('all');
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeArea === 'my_posts'
                    ? 'border-[#ec5137] text-[#c23d26] bg-orange-50/40'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                <UserCheck size={15} className={activeArea === 'my_posts' ? 'text-[#ec5137]' : 'text-stone-400'} />
                <span>My Posts</span>
                <span className="text-[11px] font-medium text-stone-400">
                  ({myPostsCount})
                </span>
              </button>
            </div>

            {/* Ask a Question / Suggestion Button */}
            <div className="pb-2 flex justify-end">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm"
              >
                <Plus size={15} />
                <span>New Discussion</span>
              </button>
            </div>
          </div>

          {/* Section 2: Filters and Sorting Controls Bar */}
          <div className="bg-stone-50/70 border-b border-stone-200/80 px-3 sm:px-6 py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 flex-shrink-0">
            {/* Mobile Filter Toggle Header */}
            <div className="flex sm:hidden items-center justify-between w-full">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-orange-50/30 transition-colors cursor-pointer"
              >
                <Filter size={12} className="text-[#ec5137]" />
                <span>Filters & Sorting</span>
                {statusFilter !== 'all' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ec5137]"></span>
                )}
                {showMobileFilters ? <ChevronUp size={13} className="text-stone-400" /> : <ChevronDown size={13} className="text-stone-400" />}
              </button>

              <span className="text-[11px] text-stone-500 font-medium">
                {statusFilter === 'all' ? 'All' : statusFilter === 'unanswered' ? 'Unanswered' : statusFilter === 'answered' ? 'Answered' : 'My Posts'} • {sortOrder === 'newest' ? 'Newest' : 'Updated'}
              </span>
            </div>

            {/* Expandable Controls Container on Mobile; Always visible on Desktop */}
            <div className={`${showMobileFilters ? 'flex' : 'hidden sm:flex'} flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full`}>
              {/* Useful Filters */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="hidden sm:inline-flex text-xs font-medium text-stone-500 mr-1 items-center gap-1">
                  <Filter size={13} />
                  <span>Filter:</span>
                </span>

                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-stone-900 shadow-2xs border border-stone-300 font-semibold'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  All Posts
                </button>

                <button
                  onClick={() => setStatusFilter('unanswered')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'unanswered'
                      ? 'bg-amber-100/80 text-amber-900 border border-amber-300 shadow-2xs font-semibold'
                      : 'text-amber-800 hover:bg-amber-50'
                  }`}
                >
                  <Clock size={12} />
                  <span>Unanswered</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-medium">
                    {totalUnansweredCount}
                  </span>
                </button>

                <button
                  onClick={() => setStatusFilter('answered')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'answered'
                      ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300 shadow-2xs font-semibold'
                      : 'text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <CheckCircle2 size={12} />
                  <span>Answered</span>
                </button>

                {activeArea !== 'my_posts' && (
                  <button
                    onClick={() => setStatusFilter('my_posts')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      statusFilter === 'my_posts'
                        ? 'bg-orange-100/80 text-[#c23d26] border border-orange-300 shadow-2xs font-semibold'
                        : 'text-stone-700 hover:bg-orange-50'
                    }`}
                  >
                    My Posts
                  </button>
                )}
              </div>

              {/* Sorting: Newest First & Recently Updated */}
              <div className="flex items-center gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-200/60">
                <span className="text-xs font-medium text-stone-500 flex items-center gap-1">
                  <ArrowUpDown size={13} />
                  <span>Sort:</span>
                </span>

                <button
                  onClick={() => setSortOrder('newest')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sortOrder === 'newest'
                      ? 'bg-white text-stone-900 border border-stone-300 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                >
                  Newest First
                </button>

                <button
                  onClick={() => setSortOrder('updated')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sortOrder === 'updated'
                      ? 'bg-white text-stone-900 border border-stone-300 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:bg-stone-200/60'
                  }`}
                  title="Shows recently replied or updated discussions"
                >
                  Recently Updated
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Discussions Feed (Full-Width Responsive Layout) */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 lg:p-8">
            <div className="w-full space-y-3.5">
              {displayedPosts.length > 0 ? (
                displayedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onSelectPost={handleSelectPost}
                  />
                ))
              ) : (
                <div className="py-16 text-center text-stone-500 bg-white rounded-2xl border border-stone-200 p-8 shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#ec5137] flex items-center justify-center mx-auto mb-3">
                    <Inbox size={24} />
                  </div>
                  <h3 className="text-base font-semibold text-stone-900">
                    No discussions found
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto font-normal">
                    {searchQuery 
                      ? `No results matching "${searchQuery}". Try a different keyword.` 
                      : activeArea === 'my_posts'
                        ? 'You have not submitted any questions or suggestions yet.'
                        : `No posts found under this filter for ${activeArea === 'modules' ? activeModule.name : 'the forum'}.`
                    }
                  </p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-4 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-colors cursor-pointer"
                  >
                    Create the first discussion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ask Question / Suggestion Modal */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        targetModuleId={selectedModuleId}
        existingPosts={posts}
      />
    </div>
  );
}


