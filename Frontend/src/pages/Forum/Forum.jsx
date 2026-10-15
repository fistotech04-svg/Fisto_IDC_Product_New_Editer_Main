// Frontend/src/pages/Forum/Forum.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  Layers, 
  UserCheck, 
  CheckCircle2, 
  HelpCircle,
  Clock,
  Sparkles,
  Inbox,
  AlertCircle,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import ForumSidebar from './ForumSidebar';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import PostDetailView from './PostDetailView';
import { FORUM_MODULES } from './forumData';
import { 
  fetchForumPosts, 
  fetchPostById, 
  createPostApi, 
  toggleVoteApi, 
  addCommentApi, 
  addFollowUpApi, 
  addAdminReplyApi, 
  replyToFollowUpApi, 
  deletePostApi 
} from './forumApi';
import { useToast } from '../../components/CustomToast';

export default function Forum({ isAdminMode = false }) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  
  // Primary Forum Navigation Areas:
  // 'all' = All Discussions
  // 'modules' = Module Discussions (if clicked from sidebar)
  // 'my_posts' = Personal user posts
  const [activeArea, setActiveArea] = useState('all'); 
  const [selectedModuleId, setSelectedModuleId] = useState('my-flipbooks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Filters: 'all' | 'unanswered' | 'answered' | 'my_posts'
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Sorting: 'newest' | 'updated'
  const [sortOrder, setSortOrder] = useState('newest');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Navigation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [activePost, setActivePost] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const toast = useToast();

  const [currentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  const effectiveUser = useMemo(() => {
    return currentUser;
  }, [currentUser]);

  const currentUserId = effectiveUser?.email || effectiveUser?.emailId || 'current_user';
  const isAdminUser = Boolean(
    isAdminMode ||
    effectiveUser?.isAdmin || 
    effectiveUser?.role === 'admin' || 
    effectiveUser?.role === 'Staff'
  );

  // Central function to load posts from Backend
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const queryParams = {
        area: activeArea,
        moduleId: activeArea === 'modules' ? selectedModuleId : undefined,
        status: statusFilter,
        sort: sortOrder,
        search: searchQuery.trim() || undefined,
        userEmail: currentUserId
      };
      const res = await fetchForumPosts(queryParams);
      setPosts(res.posts || []);
    } catch (err) {
      console.error('[Forum loadPosts error]:', err);
      setLoadError(err.message || 'Failed to load forum discussions from server');
    } finally {
      setIsLoading(false);
    }
  }, [activeArea, selectedModuleId, statusFilter, sortOrder, searchQuery, currentUserId]);

  // Initial load and filter change trigger
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Load individual post when selected
  useEffect(() => {
    if (!selectedPostId) {
      setActivePost(null);
      return;
    }

    const localMatch = posts.find(p => p.id === selectedPostId);
    if (localMatch) {
      setActivePost(localMatch);
    }

    let isMounted = true;
    setIsLoadingDetail(true);
    fetchPostById(selectedPostId)
      .then(fetchedPost => {
        if (isMounted && fetchedPost) {
          setActivePost(fetchedPost);
          setPosts(prev => prev.map(p => p.id === fetchedPost.id ? fetchedPost : p));
        }
      })
      .catch(err => {
        console.warn('Error fetching post by ID:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDetail(false);
      });

    return () => { isMounted = false; };
  }, [selectedPostId]);

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

  // Counts of posts per module for sidebar badge
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

  // Count user's personal posts
  const myPostsCount = useMemo(() => {
    return posts.filter(p => p.author?.email === currentUserId || p.author?.name === currentUser?.name).length;
  }, [posts, currentUserId, currentUser]);

  // Unanswered count across entire forum
  const totalUnansweredCount = useMemo(() => {
    return posts.filter(p => p.status === 'awaiting_admin').length;
  }, [posts]);

  // Handlers for Backend API Integrations
  const handleCreatePost = async (newPostData) => {
    const payload = {
      ...newPostData,
      author: {
        name: currentUser?.name || currentUser?.email?.split('@')[0] || 'Community Member',
        email: currentUserId,
        initials: (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'ME'),
        avatarColor: currentUser?.avatarBgColor || '#4f46e5'
      }
    };

    const createdPost = await createPostApi(payload);
    setPosts(prev => [createdPost, ...prev]);
    if (toast?.showToast) {
      toast.showToast(
        newPostData.postType === 'suggestion' 
          ? 'Suggestion submitted for review!' 
          : 'Question posted! Awaiting response.', 
        'success'
      );
    }
  };

  const handleToggleSameQuestion = async (postId) => {
    try {
      const res = await toggleVoteApi(postId, {
        name: currentUser?.name || 'User',
        email: currentUserId
      });
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        sameQuestionUsers: res.sameQuestionUsers || p.sameQuestionUsers,
        sameQuestionCount: res.sameQuestionCount
      } : p));
      if (activePost && activePost.id === postId) {
        setActivePost(prev => ({
          ...prev,
          sameQuestionUsers: res.sameQuestionUsers || prev.sameQuestionUsers,
          sameQuestionCount: res.sameQuestionCount
        }));
      }
      if (toast?.showToast) {
        toast.showToast(res.message || 'Vote updated', 'info');
      }
    } catch (err) {
      if (toast?.showToast) toast.showToast(err.message || 'Failed to update vote', 'error');
    }
  };

  const handleAddAdminReply = async (postId, adminPayload) => {
    const res = await addAdminReplyApi(postId, adminPayload);
    setPosts(prev => prev.map(p => p.id === postId ? res.post || {
      ...p,
      adminReply: res.adminReply,
      status: res.status
    } : p));
    if (activePost && activePost.id === postId) {
      setActivePost(res.post || {
        ...activePost,
        adminReply: res.adminReply,
        status: res.status
      });
    }
  };

  const handleAddAuthorFollowUp = async (postId, followUpPayload) => {
    const res = await addFollowUpApi(postId, followUpPayload);
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      authorFollowUps: res.authorFollowUps || [...(p.authorFollowUps || []), res.followUp]
    } : p));
    if (activePost && activePost.id === postId) {
      setActivePost(prev => ({
        ...prev,
        authorFollowUps: res.authorFollowUps || [...(prev.authorFollowUps || []), res.followUp]
      }));
    }
  };

  const handleAddAdminFollowUpReply = async (postId, followUpId, adminReplyPayload) => {
    const res = await replyToFollowUpApi(postId, followUpId, adminReplyPayload);
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      authorFollowUps: res.authorFollowUps || p.authorFollowUps
    } : p));
    if (activePost && activePost.id === postId) {
      setActivePost(prev => ({
        ...prev,
        authorFollowUps: res.authorFollowUps || prev.authorFollowUps
      }));
    }
  };

  const handleAddUserComment = async (postId, commentPayload) => {
    const res = await addCommentApi(postId, commentPayload);
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      comments: res.comments || [...(p.comments || []), res.comment]
    } : p));
    if (activePost && activePost.id === postId) {
      setActivePost(prev => ({
        ...prev,
        comments: res.comments || [...(prev.comments || []), res.comment]
      }));
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deletePostApi(postId, currentUserId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSelectedPostId(null);
      setActivePost(null);
      if (toast?.showToast) {
        toast.showToast('Post deleted successfully', 'success');
      }
    } catch (err) {
      if (toast?.showToast) toast.showToast(err.message || 'Failed to delete post', 'error');
    }
  };

  const basePath = '/forum';

  const handleSelectPost = (post) => {
    setSelectedPostId(post.id);
    setActivePost(post);
    try {
      window.history.pushState({}, '', `${basePath}?post=${post.id}`);
    } catch (e) {}
  };

  const handleBackToList = () => {
    setSelectedPostId(null);
    setActivePost(null);
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
            setActivePost(null);
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

      {/* Mobile Drawer (Left Sidebar on Mobile) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex">
          <div 
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full bg-white z-10 shadow-2xl flex flex-col">
            <div className="p-3.5 border-b border-orange-100 flex items-center justify-between">
              <span className="text-sm font-bold text-stone-900">Forum Modules</span>
              <button 
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer"
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
                  setActivePost(null);
                  setSearchQuery('');
                  setIsMobileDrawerOpen(false);
                  try {
                    window.history.pushState({}, '', basePath);
                  } catch (e) {}
                }}
                isCollapsed={false}
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
          onToggleSameQuestion={handleToggleSameQuestion}
          onDeletePost={handleDeletePost}
          currentUserId={currentUserId}
          currentUser={effectiveUser}
          isAdmin={isAdminUser}
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
                    {isAdminUser && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-[#ec5137] border border-red-200 flex items-center gap-1">
                        <ShieldCheck size={12} />
                        <span>Admin</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 font-normal hidden sm:block">
                    {isAdminUser 
                      ? 'Admin Mode: Verified replies & discussion status controls enabled.'
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
                  setSelectedPostId(null);
                  setActivePost(null);
                }}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeArea === 'all'
                    ? 'border-[#ec5137] text-[#c23d26] bg-orange-50/40'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <Layers size={15} />
                <span>All Discussions</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-600 font-medium">
                  {posts.length}
                </span>
              </button>

              {/* Tab B: My Posts */}
              <button
                onClick={() => {
                  setActiveArea('my_posts');
                  setStatusFilter('all');
                  setSelectedPostId(null);
                  setActivePost(null);
                }}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-t-xl text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeArea === 'my_posts'
                    ? 'border-[#ec5137] text-[#c23d26] bg-orange-50/40'
                    : 'border-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                }`}
              >
                <UserCheck size={15} />
                <span>My Posts</span>
                {myPostsCount > 0 && (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-md bg-orange-100 text-[#c23d26] font-semibold">
                    {myPostsCount}
                  </span>
                )}
              </button>
            </div>

            {/* CTA Button: Ask Question or Suggestion */}
            <div className="pb-2 sm:pb-0 flex items-center gap-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] active:bg-[#c23d26] rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Plus size={16} />
                <span>Ask Question or Suggest</span>
              </button>
            </div>
          </div>

          {/* Section 2: Filters & Sorting Toolbar (Admin Only) */}
          {isAdminUser && (
            <div className="px-4 sm:px-6 py-2.5 bg-stone-50/60 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 flex-shrink-0 text-xs">
              {/* Left: Quick Status Filters */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-stone-500 font-medium mr-1 hidden sm:inline flex-shrink-0">
                  Filter:
                </span>

                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  All Status
                </button>

                <button
                  onClick={() => setStatusFilter('unanswered')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'unanswered'
                      ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <HelpCircle size={12} />
                  <span>Awaiting Admin</span>
                  {totalUnansweredCount > 0 && (
                    <span className={`text-[10px] px-1 rounded-sm ${
                      statusFilter === 'unanswered' ? 'bg-amber-800 text-amber-100' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {totalUnansweredCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setStatusFilter('answered')}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === 'answered'
                      ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                      : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  <CheckCircle2 size={12} />
                  <span>Answered</span>
                </button>
              </div>

              {/* Right: Sorting Mode */}
              <div className="flex items-center justify-between sm:justify-end gap-2 text-stone-500">
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg border border-stone-200/80">
                  <button
                    onClick={() => setSortOrder('newest')}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
                      sortOrder === 'newest'
                        ? 'bg-white text-stone-900 border border-stone-300 shadow-2xs font-semibold'
                        : 'text-stone-600 hover:bg-stone-200/60'
                    }`}
                    title="Shows newest discussions first"
                  >
                    Newest
                  </button>
                  <button
                    onClick={() => setSortOrder('updated')}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer ${
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
          )}

          {/* Section 3: Discussions Feed (Full-Width Responsive Layout) */}
          <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 lg:p-8">
            <div className="w-full space-y-3.5">
              {isLoading ? (
                <div className="py-20 text-center text-stone-500">
                  <Loader2 size={28} className="animate-spin text-[#ec5137] mx-auto mb-3" />
                  <p className="text-sm font-semibold text-stone-700">Loading discussions from server...</p>
                  <p className="text-xs text-stone-400 mt-1">Fetching live forum data</p>
                </div>
              ) : loadError ? (
                <div className="py-12 text-center bg-white rounded-2xl border border-red-200 p-6 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2">
                    <AlertCircle size={20} />
                  </div>
                  <h3 className="text-sm font-semibold text-stone-900">Failed to connect to forum server</h3>
                  <p className="text-xs text-stone-500 mt-1">{loadError}</p>
                  <button
                    onClick={loadPosts}
                    className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-[#ec5137] hover:bg-[#d9442b] rounded-lg cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onSelectPost={handleSelectPost}
                    isAdmin={isAdminUser}
                    currentUser={effectiveUser}
                    onAddAdminReply={handleAddAdminReply}
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
