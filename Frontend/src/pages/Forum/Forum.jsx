// Frontend/src/pages/Forum/Forum.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Flame, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle
} from 'lucide-react';
import ForumSidebar from './ForumSidebar';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import PostDetailModal from './PostDetailModal';
import { 
  FORUM_MODULES, 
  getStoredPosts, 
  saveStoredPosts 
} from './forumData';
import { useToast } from '../../components/CustomToast';

export default function Forum() {
  const [posts, setPosts] = useState(() => getStoredPosts());
  const [selectedModuleId, setSelectedModuleId] = useState('my-flipbooks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filters & Sorting (StackOverflow / Reddit style)
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'unanswered' | 'solved'
  const [sortOrder, setSortOrder] = useState('latest'); // 'latest' | 'votes' | 'active'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const toast = useToast();

  const [currentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user_profile') || localStorage.getItem('user');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
  });

  const currentUserId = currentUser?.email || currentUser?.emailId || 'current_user';

  // Sync with storage
  useEffect(() => {
    saveStoredPosts(posts);
  }, [posts]);

  // Counts by module
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

  // Filtered & sorted posts for active module
  const modulePosts = useMemo(() => {
    return posts.filter(post => {
      if (post.moduleId !== selectedModuleId) return false;
      
      const hasAnswers = post.comments && post.comments.length > 0;
      const isResolved = post.status === 'resolved' || post.hasAcceptedSolution;

      if (statusFilter === 'unanswered' && hasAnswers) return false;
      if (statusFilter === 'solved' && !isResolved) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const inTitle = post.title?.toLowerCase().includes(query);
        const inDesc = post.description?.toLowerCase().includes(query);
        const inAuthor = post.author?.name?.toLowerCase().includes(query);
        const inTags = post.tags && post.tags.some(t => t.toLowerCase().includes(query));
        if (!inTitle && !inDesc && !inAuthor && !inTags) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortOrder === 'votes') {
        const scoreA = a.votes ?? (a.upvotes || 0);
        const scoreB = b.votes ?? (b.upvotes || 0);
        return scoreB - scoreA;
      }
      if (sortOrder === 'active') {
        return (b.comments?.length || 0) - (a.comments?.length || 0);
      }
      return 0; // Default latest
    });
  }, [posts, selectedModuleId, statusFilter, sortOrder, searchQuery]);

  // Create new post
  const handleCreatePost = (newPostData) => {
    const newPost = {
      id: `post-${Date.now()}`,
      ...newPostData,
      status: 'open',
      hasAcceptedSolution: false,
      author: {
        name: currentUser?.name || currentUser?.email?.split('@')[0] || 'Community Member',
        username: currentUser?.email?.split('@')[0] || 'user',
        email: currentUser?.email || currentUser?.emailId || 'user@example.com',
        avatarColor: currentUser?.avatarBgColor || '#ec5137',
        role: 'Community Member'
      },
      createdAt: 'Just now',
      votes: 1,
      upvotedBy: [currentUserId],
      downvotedBy: [],
      views: 1,
      comments: []
    };

    setPosts([newPost, ...posts]);
    if (toast?.showToast) {
      toast.showToast(`Posted to ${activeModule.name}!`, 'success');
    }
  };

  // Reddit / StackOverflow upvote & downvote scoring
  const handleVotePost = (postId, delta) => {
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          let upvotedBy = p.upvotedBy ? [...p.upvotedBy] : [];
          let downvotedBy = p.downvotedBy ? [...p.downvotedBy] : [];
          let currentScore = p.votes ?? (p.upvotes || 0);

          const isUp = upvotedBy.includes(currentUserId);
          const isDown = downvotedBy.includes(currentUserId);

          if (delta === 1) {
            if (isUp) {
              // Undo upvote
              upvotedBy = upvotedBy.filter(id => id !== currentUserId);
              currentScore -= 1;
            } else {
              // Apply upvote
              upvotedBy.push(currentUserId);
              currentScore += 1;
              if (isDown) {
                downvotedBy = downvotedBy.filter(id => id !== currentUserId);
                currentScore += 1;
              }
            }
          } else if (delta === -1) {
            if (isDown) {
              // Undo downvote
              downvotedBy = downvotedBy.filter(id => id !== currentUserId);
              currentScore += 1;
            } else {
              // Apply downvote
              downvotedBy.push(currentUserId);
              currentScore -= 1;
              if (isUp) {
                upvotedBy = upvotedBy.filter(id => id !== currentUserId);
                currentScore -= 1;
              }
            }
          }

          const updated = {
            ...p,
            votes: currentScore,
            upvotes: currentScore,
            upvotedBy,
            downvotedBy
          };

          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(updated);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Comment voting
  const handleVoteComment = (postId, commentId, delta) => {
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          const updatedComments = (p.comments || []).map(c => {
            if (c.id === commentId) {
              const currentScore = c.votes || 0;
              return {
                ...c,
                votes: currentScore + delta
              };
            }
            return c;
          });
          const updated = { ...p, comments: updatedComments };
          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(updated);
          }
          return updated;
        }
        return p;
      })
    );
  };

  // Add comment / answer
  const handleAddComment = (postId, comment) => {
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          const updatedComments = [...(p.comments || []), comment];
          const updated = {
            ...p,
            comments: updatedComments
          };
          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(updated);
          }
          return updated;
        }
        return p;
      })
    );
    if (toast?.showToast) {
      toast.showToast('Answer posted!', 'success');
    }
  };

  // Toggle solved
  const handleToggleSolved = (postId) => {
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p.id === postId) {
          const isCurrentlyResolved = p.status === 'resolved' || p.hasAcceptedSolution;
          const newStatus = isCurrentlyResolved ? 'open' : 'resolved';
          const updated = {
            ...p,
            status: newStatus,
            hasAcceptedSolution: !isCurrentlyResolved
          };
          if (selectedPost && selectedPost.id === postId) {
            setSelectedPost(updated);
          }
          return updated;
        }
        return p;
      })
    );
  };

  const handleSelectPost = (post) => {
    const updatedPost = {
      ...post,
      views: (post.views || 0) + 1
    };
    setSelectedPost(updatedPost);
    setPosts(prev => prev.map(p => p.id === post.id ? updatedPost : p));
  };

  return (
    <div className="flex h-full w-full bg-[#f6f7f8] overflow-hidden">
      {/* 1. Left Sidebar: Folder / Module Selection with Minimise Option */}
      <ForumSidebar
        selectedModuleId={selectedModuleId}
        onSelectModule={(modId) => {
          setSelectedModuleId(modId);
          setSearchQuery('');
          setStatusFilter('all');
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        moduleCounts={moduleCounts}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Reddit / StackOverflow Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
          {/* Active Module Title & Tagline */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight">
                {activeModule.name}
              </h1>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {moduleCounts[selectedModuleId] || 0} questions
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {activeModule.tagline}
            </p>
          </div>

          {/* Right Action Tools: Search, Sort, Filter, and Ask Question Button */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeModule.shortName}...`}
                className="pl-9 pr-3 py-2 text-sm bg-gray-50 hover:bg-white focus:bg-white border border-gray-300 rounded-xl w-48 sm:w-64 focus:outline-none focus:border-[#ec5137] transition-all"
              />
            </div>

            {/* Filter Pills (All / Unanswered / Solved) */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('unanswered')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'unanswered' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Unanswered
              </button>
              <button
                onClick={() => setStatusFilter('solved')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === 'solved' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Solved
              </button>
            </div>

            {/* Sort Options */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm font-medium bg-white border border-gray-300 rounded-xl text-gray-700 focus:outline-none focus:border-[#ec5137] cursor-pointer"
            >
              <option value="latest">Newest</option>
              <option value="votes">Highest Score</option>
              <option value="active">Most Answers</option>
            </select>

            {/* Post button strictly for this module */}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
            >
              <Plus size={16} />
              <span>Ask in {activeModule.shortName}</span>
            </button>
          </div>
        </header>

        {/* Discussions List Feed (Reddit / StackOverflow style) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            {modulePosts.length > 0 ? (
              modulePosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSelectPost={handleSelectPost}
                  onVote={handleVotePost}
                  currentUserId={currentUserId}
                />
              ))
            ) : (
              <div className="py-16 text-center text-gray-500">
                <p className="text-base font-semibold text-gray-800">
                  No questions or issues found in {activeModule.name}.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Got a technical question or issue with this module?
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#ec5137] hover:bg-[#d9442b] transition-colors cursor-pointer"
                >
                  Ask the first question in {activeModule.shortName}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Modal (Locked to active module) */}
      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePost}
        targetModuleId={selectedModuleId}
      />

      {/* Detail Modal (StackOverflow / Reddit full thread) */}
      <PostDetailModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onVotePost={handleVotePost}
        onVoteComment={handleVoteComment}
        onAddComment={handleAddComment}
        onToggleSolved={handleToggleSolved}
        currentUserId={currentUserId}
        currentUser={currentUser}
      />
    </div>
  );
}
