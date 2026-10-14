import ForumPost from './forumModel.js';
import { FORUM_MODULES } from './forumConstants.js';
import { nanoid } from 'nanoid';
import User from '../models/auth.js';

// Helper to check if given email is an admin
export const isUserAdmin = async (email) => {
  if (!email) return false;
  try {
    const user = await User.findOne({ emailId: email.trim().toLowerCase() });
    return user && user.role === 'admin';
  } catch (err) {
    console.error('[isUserAdmin Error]:', err);
    return false;
  }
};

/**
 * 1. Get all forum posts with filtering, search & sorting
 * Query params:
 *   - area: 'all' | 'modules' | 'my_posts'
 *   - moduleId: e.g. 'my-flipbooks'
 *   - status: 'all' | 'unanswered' | 'answered' | 'under_review' | etc.
 *   - postType: 'all' | 'question' | 'suggestion'
 *   - search: string
 *   - sort: 'newest' | 'updated' | 'popular'
 *   - userEmail: string (optional, for my_posts or tracking interactions)
 */
export const getForumPosts = async (req, res) => {
  try {
    const {
      area = 'all',
      moduleId,
      status = 'all',
      postType = 'all',
      search = '',
      sort = 'newest',
      userEmail = ''
    } = req.query;

    const filter = {};

    // Filter by module if area === 'modules' or moduleId specified
    if (moduleId && moduleId !== 'all') {
      filter.moduleId = moduleId;
    }

    // Filter by user's own posts if area === 'my_posts' or status === 'my_posts'
    if (area === 'my_posts' || status === 'my_posts') {
      if (userEmail) {
        filter['author.email'] = userEmail;
      }
    }

    // Filter by Status
    if (status && status !== 'all' && status !== 'my_posts') {
      if (status === 'unanswered') {
        filter.status = { $in: ['awaiting_admin', 'under_review'] };
      } else if (status === 'answered') {
        filter.status = { $in: ['answered', 'implemented'] };
      } else {
        filter.status = status;
      }
    }

    // Filter by post type
    if (postType && postType !== 'all') {
      filter.postType = postType;
    }

    // Filter by search keyword
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { moduleName: { $regex: q, $options: 'i' } },
        { 'author.name': { $regex: q, $options: 'i' } }
      ];
    }

    // Sorting
    let sortOptions = { isPinned: -1 };
    if (sort === 'updated') {
      sortOptions.updatedAt = -1;
    } else if (sort === 'popular') {
      // Sort by sameQuestion count / views
      sortOptions.viewsCount = -1;
      sortOptions.createdAt = -1;
    } else {
      // Default newest
      sortOptions.createdAt = -1;
    }

    const posts = await ForumPost.find(filter)
      .sort(sortOptions)
      .lean();

    // Module stats for summary cards & badges
    const totalCount = await ForumPost.countDocuments({});
    const unansweredCount = await ForumPost.countDocuments({
      status: { $in: ['awaiting_admin', 'under_review'] }
    });

    res.json({
      success: true,
      count: posts.length,
      stats: {
        total: totalCount,
        unanswered: unansweredCount
      },
      posts
    });
  } catch (error) {
    console.error('[ForumController - getForumPosts] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch forum posts', error: error.message });
  }
};

/**
 * 2. Get a single post by ID (and increment view count)
 */
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await ForumPost.findOneAndUpdate(
      { id },
      { $inc: { viewsCount: 1 } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: 'Discussion post not found' });
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error('[ForumController - getPostById] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch post', error: error.message });
  }
};

/**
 * 3. Create a new Forum discussion / suggestion
 */
export const createForumPost = async (req, res) => {
  try {
    const {
      moduleId,
      moduleName,
      postType = 'question',
      title,
      description,
      author
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    if (!moduleId) {
      return res.status(400).json({ success: false, message: 'Module ID is required' });
    }

    const resolvedModule = FORUM_MODULES.find(m => m.id === moduleId);
    const resolvedModuleName = moduleName || resolvedModule?.name || 'General';

    const authorData = {
      name: author?.name || author?.email?.split('@')[0] || 'Community Member',
      email: author?.email || req.user?.email || 'anonymous@flipibook.com',
      initials: author?.initials || (author?.name ? author.name.slice(0, 2).toUpperCase() : 'U'),
      avatarColor: author?.avatarColor || author?.avatarBgColor || '#ec5137',
      role: author?.role || 'User',
      isAdmin: Boolean(author?.isAdmin)
    };

    const initialStatus = postType === 'suggestion' ? 'under_review' : 'awaiting_admin';

    const newPost = new ForumPost({
      moduleId,
      moduleName: resolvedModuleName,
      postType,
      status: initialStatus,
      title: title.trim(),
      description: description.trim(),
      author: authorData,
      sameQuestionUsers: authorData.email ? [authorData.email] : [],
      followedBy: authorData.email ? [authorData.email] : []
    });

    const savedPost = await newPost.save();

    res.status(201).json({
      success: true,
      message: postType === 'suggestion' 
        ? 'Suggestion submitted for review!' 
        : 'Question posted! Awaiting official reply.',
      post: savedPost
    });
  } catch (error) {
    console.error('[ForumController - createForumPost] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post', error: error.message });
  }
};

/**
 * 4. Toggle "I have this question too" / Upvote
 */
export const toggleSameQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'User email is required to vote' });
    }

    const post = await ForumPost.findOne({ id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const existingUsers = post.sameQuestionUsers || [];
    const hasVoted = existingUsers.includes(userEmail);

    let updatedUsers;
    if (hasVoted) {
      updatedUsers = existingUsers.filter(e => e !== userEmail);
    } else {
      updatedUsers = [...existingUsers, userEmail];
    }

    post.sameQuestionUsers = updatedUsers;
    await post.save();

    res.json({
      success: true,
      voted: !hasVoted,
      count: post.sameQuestionUsers.length,
      sameQuestionUsers: post.sameQuestionUsers,
      message: !hasVoted ? 'Marked: "I have this question too!"' : 'Removed your vote'
    });
  } catch (error) {
    console.error('[ForumController - toggleSameQuestion] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle vote', error: error.message });
  }
};

/**
 * 5. Add Community User Comment
 */
export const addUserComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, author, isAuthorFollowUp = false } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    const post = await ForumPost.findOne({ id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const authorData = {
      name: author?.name || 'Community Member',
      email: author?.email || 'user@example.com',
      initials: author?.initials || (author?.name ? author.name.slice(0, 2).toUpperCase() : 'U'),
      avatarColor: author?.avatarColor || '#ec5137',
      role: author?.role || 'User',
      isAdmin: Boolean(author?.isAdmin)
    };

    const newComment = {
      id: `c-${nanoid(8)}`,
      author: authorData,
      content: content.trim(),
      createdAt: new Date(),
      isAuthorFollowUp
    };

    post.comments.push(newComment);
    await post.save();

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      comments: post.comments
    });
  } catch (error) {
    console.error('[ForumController - addUserComment] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
};

/**
 * 6. Author Follow-Up Question
 */
export const addAuthorFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, author } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, message: 'Follow-up question cannot be empty' });
    }

    const post = await ForumPost.findOne({ id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const authorData = {
      name: author?.name || post.author?.name || 'Author',
      email: author?.email || post.author?.email || 'author@flipibook.com',
      initials: author?.initials || post.author?.initials || 'AU',
      avatarColor: author?.avatarColor || post.author?.avatarColor || '#ec5137',
      role: author?.role || 'Author'
    };

    const newFollowUp = {
      id: `fu-${nanoid(8)}`,
      author: authorData,
      question: question.trim(),
      createdAt: new Date(),
      adminReply: null
    };

    post.authorFollowUps.push(newFollowUp);
    await post.save();

    res.status(201).json({
      success: true,
      message: 'Follow-up question submitted',
      followUp: newFollowUp,
      authorFollowUps: post.authorFollowUps
    });
  } catch (error) {
    console.error('[ForumController - addAuthorFollowUp] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add follow-up', error: error.message });
  }
};

/**
 * 7. Official Admin Reply & Status Change
 */
export const addAdminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, status = 'answered', author } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Admin reply content is required' });
    }

    const post = await ForumPost.findOne({ id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Check admin permissions if email is provided or if not in dev bypass
    const requesterEmail = author?.email || req.headers['x-user-email'];
    if (requesterEmail) {
      const user = await User.findOne({ emailId: requesterEmail.trim().toLowerCase() });
      if (user && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Admin access required to post official replies' });
      }
    }

    const adminAuthor = {
      name: author?.name || 'Flipibook Engineering',
      email: requesterEmail || author?.email || 'team@flipibook.com',
      initials: author?.initials || 'FE',
      avatarColor: author?.avatarColor || '#2563eb',
      role: author?.role || 'Official Reply',
      isAdmin: true
    };

    post.adminReply = {
      id: `admin-rep-${nanoid(8)}`,
      author: adminAuthor,
      content: content.trim(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    post.status = status;
    await post.save();

    res.json({
      success: true,
      message: 'Official reply and status updated',
      adminReply: post.adminReply,
      status: post.status,
      post
    });
  } catch (error) {
    console.error('[ForumController - addAdminReply] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit admin reply', error: error.message });
  }
};

/**
 * 8. Admin Direct Reply to an Author Follow-Up
 */
export const addAdminFollowUpReply = async (req, res) => {
  try {
    const { id, followUpId } = req.params;
    const { content, author } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content cannot be empty' });
    }

    const requesterEmail = author?.email || req.headers['x-user-email'];
    if (requesterEmail) {
      const user = await User.findOne({ emailId: requesterEmail.trim().toLowerCase() });
      if (user && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Admin access required to reply' });
      }
    }

    const post = await ForumPost.findOne({ id });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const followUp = post.authorFollowUps.find(f => f.id === followUpId);
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up question not found' });
    }

    const adminAuthor = {
      name: author?.name || 'Flipibook Engineering',
      email: requesterEmail || author?.email || 'team@flipibook.com',
      initials: author?.initials || 'FE',
      avatarColor: author?.avatarColor || '#2563eb',
      role: 'Official Reply',
      isAdmin: true
    };

    followUp.adminReply = {
      id: `admin-fu-rep-${nanoid(8)}`,
      author: adminAuthor,
      content: content.trim(),
      createdAt: new Date()
    };

    await post.save();

    res.json({
      success: true,
      message: 'Admin reply to follow-up added',
      authorFollowUps: post.authorFollowUps
    });
  } catch (error) {
    console.error('[ForumController - addAdminFollowUpReply] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to reply to follow-up', error: error.message });
  }
};

/**
 * 9. Update Post Status (Admin control)
 */
export const updatePostStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userEmail } = req.body;

    const requesterEmail = userEmail || req.headers['x-user-email'];
    if (requesterEmail) {
      const user = await User.findOne({ emailId: requesterEmail.trim().toLowerCase() });
      if (user && user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
      }
    }

    const validStatuses = [
      'awaiting_admin',
      'answered',
      'under_review',
      'planned',
      'implemented',
      'declined'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${status}` });
    }

    const post = await ForumPost.findOneAndUpdate(
      { id },
      { $set: { status } },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, message: 'Post status updated', status: post.status, post });
  } catch (error) {
    console.error('[ForumController - updatePostStatus] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

/**
 * 10. Delete a Forum Post
 */
export const deleteForumPost = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterEmail = req.headers['x-user-email'] || req.query.userEmail;

    if (requesterEmail) {
      const user = await User.findOne({ emailId: requesterEmail.trim().toLowerCase() });
      const post = await ForumPost.findOne({ id });
      if (post && user && user.role !== 'admin' && post.author?.email !== requesterEmail.toLowerCase()) {
        return res.status(403).json({ success: false, message: 'Forbidden: Cannot delete other users posts' });
      }
    }

    const deleted = await ForumPost.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Post not found or already deleted' });
    }

    res.json({ success: true, message: 'Post deleted successfully', id });
  } catch (error) {
    console.error('[ForumController - deleteForumPost] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete post', error: error.message });
  }
};

/**
 * 11. Seed initial sample discussions if collection is empty
 */
export const seedInitialForumPosts = async (req, res) => {
  try {
    const count = await ForumPost.countDocuments();
    if (count > 0) {
      return res.json({ success: true, message: `Forum already contains ${count} posts. Seed skipped.` });
    }

    const samplePosts = [
      {
        id: 'post-1',
        moduleId: 'my-flipbooks',
        moduleName: 'My Flipbooks',
        postType: 'question',
        status: 'answered',
        title: 'High-res PDF page takes more than 15 seconds to render first flip preview',
        description: 'When uploading a 60-page PDF containing high-resolution vector diagrams (around 45MB), the first-page rendering in the shelf preview takes prolonged time or sometimes shows the shimmer skeleton continuously. Is there an automatic downsampling preset for this case?',
        author: {
          name: 'Elena Rostova',
          initials: 'ER',
          email: 'elena@example.com',
          avatarColor: '#7c3aed',
          role: 'User'
        },
        sameQuestionUsers: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
        followedBy: ['user1@example.com', 'elena@example.com'],
        adminReply: {
          id: 'admin-rep-1',
          author: {
            name: 'Flipibook Engineering',
            email: 'team@flipibook.com',
            initials: 'FE',
            role: 'Official Reply',
            isAdmin: true,
            avatarColor: '#2563eb'
          },
          content: "Currently, there isn't an automatic downsampling preset for preview rendering. You can try uploading the PDF in smaller resolution or we are working on adding this feature in the next release. We'll keep you posted once it's available."
        },
        comments: [
          {
            id: 'c-user-1',
            author: {
              name: 'John Smith',
              initials: 'JS',
              email: 'john@example.com',
              avatarColor: '#2563eb'
            },
            content: 'Facing the same issue with a 42MB file. Looking forward to the update!'
          }
        ]
      },
      {
        id: 'post-2',
        moduleId: '3d-editor',
        moduleName: '3D Editor',
        postType: 'suggestion',
        status: 'under_review',
        title: 'Support for ambient occlusion & normal map strength slider for 3D textures',
        description: 'It would be fantastic to have independent AO intensity and normal depth sliders inside the 3D material drawer so that glTF models look grounded in AR view without requiring Blender texture re-bakes.',
        author: {
          name: 'Marcus Vance',
          initials: 'MV',
          email: 'marcus@example.com',
          avatarColor: '#059669',
          role: 'Creator'
        },
        sameQuestionUsers: ['marcus@example.com', 'david@example.com'],
        followedBy: ['marcus@example.com'],
        comments: []
      },
      {
        id: 'post-3',
        moduleId: 'customised-editor',
        moduleName: 'Customised Editor',
        postType: 'question',
        status: 'awaiting_admin',
        title: 'Lead Form modal does not dismiss automatically after submission on iOS Safari',
        description: 'When viewers complete the lead generation form on an iPad using mobile Safari, the form shows the checkmark animation but remains overlaid on the book unless they tap outside the backdrop. Is there an auto-timeout parameter?',
        author: {
          name: 'Sarah Chen',
          initials: 'SC',
          email: 'sarah@example.com',
          avatarColor: '#ea580c',
          role: 'User'
        },
        sameQuestionUsers: ['sarah@example.com'],
        followedBy: ['sarah@example.com'],
        comments: []
      }
    ];

    await ForumPost.insertMany(samplePosts);
    res.json({ success: true, message: `Successfully seeded ${samplePosts.length} forum discussions!` });
  } catch (error) {
    console.error('[ForumController - seedInitialForumPosts] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed posts', error: error.message });
  }
};
