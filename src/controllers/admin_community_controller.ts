import { Request, Response } from 'express';
import CommunityPost from '../models/community_post_model';
import Comment from '../models/comment_model';
import { logger } from '../utils/logger';
import { AppError } from '../utils/app_error';
import CommunityReport from '../models/community_report_model';
import UserReputation from '../models/user_reputation_model';
import Follow from '../models/follow_model';
import SavedPost from '../models/saved_post_model';
import CommunityAudit from '../models/community_audit_model';

export const getCommunityAnalytics = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      topPostToday, topAuthor, mostDiscussed, mostReported, postsPerDay, commentsPerDay,
      totalFollowers, totalSavedPosts, totalActivities, followersPerDay, savesPerDay, activitiesPerDay
    ] = await Promise.all([
      // Top post today (most likes)
      CommunityPost.findOne({ createdAt: { $gte: today }, status: 'visible' }).sort({ likes: -1 }).populate('author', 'name'),
      // Top author (most posts)
      CommunityPost.aggregate([
        { $match: { status: 'visible' } },
        { $group: { _id: "$authorName", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      // Most discussed (most comments)
      CommunityPost.findOne({ status: 'visible' }).sort({ commentsCount: -1 }).populate('author', 'name'),
      // Most reported
      CommunityReport.aggregate([
        { $group: { _id: "$reportedPost", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]),
      // Posts per day
      CommunityPost.aggregate([
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } }
      ]),
      // Comments per day
      Comment.aggregate([
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } }
      ]),
      // Total Followers
      Follow.countDocuments(),
      // Total Saved Posts
      SavedPost.countDocuments(),
      // Total Activities
      CommunityAudit.countDocuments(),
      // Followers per day
      Follow.aggregate([
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } }
      ]),
      // Saves per day
      SavedPost.aggregate([
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } }
      ]),
      // Activities per day
      CommunityAudit.aggregate([
        { 
          $group: { 
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    let mostReportedPostDetails = null;
    if (mostReported.length > 0 && mostReported[0]._id) {
      mostReportedPostDetails = await CommunityPost.findById(mostReported[0]._id).populate('author', 'name');
    }

    res.status(200).json({
      success: true,
      data: {
        topPostToday: topPostToday ? { title: topPostToday.title, likes: topPostToday.likes, author: topPostToday.authorName } : null,
        topAuthor: topAuthor.length > 0 ? { name: topAuthor[0]._id, posts: topAuthor[0].count } : null,
        mostDiscussedPost: mostDiscussed ? { title: mostDiscussed.title, comments: mostDiscussed.commentsCount, author: mostDiscussed.authorName } : null,
        mostReportedPost: mostReportedPostDetails ? { title: mostReportedPostDetails.title, reports: mostReported[0].count, author: mostReportedPostDetails.authorName } : null,
        totalFollowers,
        totalSavedPosts,
        totalActivities,
        charts: {
          postsPerDay: postsPerDay.map(p => ({ date: p._id, count: p.count })),
          commentsPerDay: commentsPerDay.map(c => ({ date: c._id, count: c.count })),
          followersPerDay: followersPerDay.map(f => ({ date: f._id, count: f.count })),
          savesPerDay: savesPerDay.map(s => ({ date: s._id, count: s.count })),
          activitiesPerDay: activitiesPerDay.map(a => ({ date: a._id, count: a.count }))
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get community analytics', { event: 'community_feed_and_moderation.admin_analytics.error', error });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminGetPosts = async (req: Request, res: Response) => {
  try {
    const { cursor, limit, status, authorId } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 20;

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (authorId) query.author = authorId;
    if (cursor) query._id = { $lt: cursor };

    const posts = await CommunityPost.find(query)
      .sort({ _id: -1 })
      .limit(qLimit + 1)
      .populate('author', 'name email role accountType');

    const hasNextPage = posts.length > qLimit;
    if (hasNextPage) posts.pop();

    const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

    logger.info('Admin retrieved community posts', { event: 'community_feed_and_moderation.admin_list_posts', requestId: (req as any).id, limit: qLimit, count: posts.length });

    return res.status(200).json({
      success: true,
      data: {
        items: posts,
        pageInfo: { hasNextPage, nextCursor }
      }
    });
  } catch (error) {
    logger.error('Failed to list community posts for admin', { event: 'community_feed_and_moderation.admin_list_posts.error', error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminModeratePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason, version } = req.body;
    const adminId = (req as any).user.id;

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' });
    }

    if (post.version !== version) {
      return res.status(409).json({ success: false, message: 'Version mismatch', code: 'CONFLICT' });
    }

    const newStatus = action === 'approve' || action === 'restore' ? 'visible' : action === 'hide' ? 'hidden' : 'removed';

    post.status = newStatus;
    post.moderationReason = reason || '';
    post.moderatedBy = adminId;
    post.moderatedAt = new Date();
    post.version += 1;

    await post.save();

    logger.info(`Admin moderated post ${id}`, {
      event: 'community_feed_and_moderation.admin_moderate_post',
      requestId: (req as any).id,
      actorId: adminId,
      targetId: id,
      action,
      newStatus
    });

    return res.status(200).json({ success: true, data: { post } });
  } catch (error) {
    logger.error('Failed to moderate post', { event: 'community_feed_and_moderation.admin_moderate_post.error', error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminResolvePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).user.id;

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' });
    }

    post.status = 'resolved';
    post.moderationNotes = 'Admin intervened';
    post.moderatedBy = adminId;
    post.moderatedAt = new Date();
    post.version += 1;

    await post.save();

    logger.info(`Admin resolved post ${id}`, {
      event: 'community_feed_and_moderation.admin_resolve_post',
      requestId: (req as any).id,
      actorId: adminId,
      targetId: id
    });

    return res.status(200).json({ success: true, data: { post } });
  } catch (error) {
    logger.error('Failed to resolve post', { event: 'community_feed_and_moderation.admin_resolve_post.error', error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminGetComments = async (req: Request, res: Response) => {
  try {
    const { cursor, limit, status, authorId, postId } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 20;

    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (authorId) query.author = authorId;
    if (postId) query.post = postId;
    if (cursor) query._id = { $lt: cursor };

    const comments = await Comment.find(query)
      .sort({ _id: -1 })
      .limit(qLimit + 1)
      .populate('author', 'name email role');

    const hasNextPage = comments.length > qLimit;
    if (hasNextPage) comments.pop();

    const nextCursor = comments.length > 0 ? comments[comments.length - 1]._id : null;

    logger.info('Admin retrieved community comments', { event: 'community_feed_and_moderation.admin_list_comments', requestId: (req as any).id, limit: qLimit, count: comments.length });

    return res.status(200).json({
      success: true,
      data: {
        items: comments,
        pageInfo: { hasNextPage, nextCursor }
      }
    });
  } catch (error) {
    logger.error('Failed to list community comments for admin', { event: 'community_feed_and_moderation.admin_list_comments.error', error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminModerateComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, reason, version } = req.body;
    const adminId = (req as any).user.id;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found', code: 'RESOURCE_NOT_FOUND' });
    }

    if (comment.version !== version) {
      return res.status(409).json({ success: false, message: 'Version mismatch', code: 'CONFLICT' });
    }

    const newStatus = action === 'approve' || action === 'restore' ? 'visible' : action === 'hide' ? 'hidden' : 'removed';

    comment.status = newStatus;
    comment.moderationReason = reason || '';
    comment.moderatedBy = adminId;
    comment.moderatedAt = new Date();
    comment.version += 1;

    await comment.save();

    logger.info(`Admin moderated comment ${id}`, {
      event: 'community_feed_and_moderation.admin_moderate_comment',
      requestId: (req as any).id,
      actorId: adminId,
      targetId: id,
      action,
      newStatus
    });

    return res.status(200).json({ success: true, data: { comment } });
  } catch (error) {
    logger.error('Failed to moderate comment', { event: 'community_feed_and_moderation.admin_moderate_comment.error', error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCommunityReputationStats = async (req: Request, res: Response) => {
  try {
    const [topContributor, mostFollowed, highestReputation, recentExperts, badgeDistribution] = await Promise.all([
      // Top Contributor by points
      UserReputation.findOne().sort({ points: -1 }).populate('userId', 'name role'),
      // Most Followed Expert
      Follow.aggregate([
        { $group: { _id: "$following", followerCount: { $sum: 1 } } },
        { $sort: { followerCount: -1 } },
        { $limit: 1 }
      ]),
      // Highest Reputation (same as top contributor essentially, but could be different metric)
      UserReputation.findOne().sort({ points: -1 }).populate('userId', 'name'),
      // Recent Experts
      UserReputation.find({ level: { $in: ['Expert', 'Master'] } })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('userId', 'name avatarUrl'),
      // Badge Distribution
      UserReputation.aggregate([
        { $unwind: "$badges" },
        { $group: { _id: "$badges", count: { $sum: 1 } } }
      ])
    ]);

    let mostFollowedUserDetails = null;
    if (mostFollowed.length > 0 && mostFollowed[0]._id) {
      // Need to populate the user info manually since aggregate doesn't
      mostFollowedUserDetails = await UserReputation.findOne({ userId: mostFollowed[0]._id }).populate('userId', 'name');
    }

    res.status(200).json({
      success: true,
      data: {
        topContributor: topContributor ? { name: (topContributor.userId as any)?.name, points: topContributor.points } : null,
        mostFollowed: mostFollowedUserDetails ? { name: (mostFollowedUserDetails.userId as any)?.name, followers: mostFollowed[0].followerCount } : null,
        highestReputation: highestReputation ? { name: (highestReputation.userId as any)?.name, points: highestReputation.points } : null,
        recentExperts: recentExperts.map(re => ({
          name: (re.userId as any)?.name,
          level: re.level,
        })),
        badgeDistribution: badgeDistribution.map(b => ({ badge: b._id, count: b.count }))
      }
    });
  } catch (error) {
    logger.error('Failed to get community reputation stats', { event: 'community_feed_and_moderation.admin_reputation_stats.error', error });
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminUpdatePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, likes } = req.body;
    const adminId = (req as any).user.id;

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' });
    }

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (likes !== undefined) post.likes = likes;

    post.lastEditedAt = new Date();
    post.version += 1;

    await post.save();

    logger.info(`Admin updated post ${id}`, {
      event: 'community_feed_and_moderation.admin_update_post',
      requestId: (req as any).id,
      actorId: adminId,
      targetId: id
    });

    return res.status(200).json({ success: true, data: { post } });
  } catch (error) {
    logger.error('Failed to update post', { event: 'community_feed_and_moderation.admin_update_post.error', error });
    return res.status(500).json({ message: 'Internal server error' });
  }
};

