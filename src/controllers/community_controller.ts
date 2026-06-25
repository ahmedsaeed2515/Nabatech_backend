import { Request, Response } from "express";
import CommunityPost from "../models/community_post_model";
import Comment from "../models/comment_model";
import cloudinary from "../config/cloudinary";
import { logger } from "../utils/logger";
import { AppError } from "../utils/app_error";
import { NextFunction } from "express";
import { NotificationService } from "../services/notification_service";
import { CommunityAuditService } from "../services/community_audit_service";
import CommunityPoll from "../models/community_poll_model";
import CommunityPollOption from "../models/community_poll_option_model";
import CommunityPollVote from "../models/community_poll_vote_model";
import SavedPost from "../models/saved_post_model";

// Helper function to upload buffer stream to Cloudinary
const uploadToCloudinary = (fileBuffer: Buffer, folderName: string): Promise<{ url: string, public_id: string }> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName, resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result!.secure_url, public_id: result!.public_id });
      }
    );
    stream.end(fileBuffer);
  });
};

// Helper function to format creation date as relative label
export const formatRelativeTime = (date: Date): string => {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

const mapPostToDTO = async (post: any, userId: string) => {
  const isLikedByMe = post.likedBy?.map((id: any) => id.toString()).includes(userId);
  const isSaved = await SavedPost.exists({ post: post._id, user: userId });
  let pollDto = null;

  if (post.poll) {
    const pollId = post.poll._id ? post.poll._id : post.poll;
    const pollObj = post.poll._id ? post.poll : await CommunityPoll.findById(pollId).lean();
    if (pollObj) {
      const options = await CommunityPollOption.find({ poll: pollObj._id }).sort({ sortOrder: 1 }).lean();
      const vote = await CommunityPollVote.findOne({ poll: pollObj._id, user: userId }).lean();
      
      pollDto = {
        id: pollObj._id.toString(),
        question: pollObj.question,
        totalVotes: pollObj.totalVotes,
        options: options.map(o => ({
          id: o._id.toString(),
          text: o.text,
          votes: o.votes
        })),
        userVotedOptionId: vote ? vote.option.toString() : null
      };
    }
  }

  return {
    id: post._id.toString(),
    author: {
      id: post.author?._id?.toString() || post.author?.toString(),
      name: post.author?.name || post.authorName
    },
    authorRole: post.author?.role || "farmer",
    plantTag: post.plantTag,
    title: post.title,
    content: post.content,
    timeLabel: formatRelativeTime(post.createdAt),
    likes: post.likes,
    comments: post.commentsCount,
    imagePath: post.imagePath || null,
    imageUrls: post.imageUrls || [],
    isLikedByMe,
    isSaved: !!isSaved,
    isPinned: post.isPinned || false,
    linkedDiagnosisId: post.linkedDiagnosis?._id?.toString() || null,
    diagnosisDisease: post.linkedDiagnosis?.diseaseNameEn || null,
    diagnosisConfidence: post.linkedDiagnosis?.confidence || null,
    diagnosisSeverity: post.linkedDiagnosis?.severity || null,
    poll: pollDto,
    createdAt: post.createdAt.toISOString()
  };
};

// @desc    Get all community posts
// @route   GET /api/community/posts
// @access  Private
export const getCommunityPosts = async (req: Request, res: Response) => {
  try {
    const { category, cursor, limit, status, authorId } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 20;
    
    const query: any = { status: 'visible' };

    if (authorId) {
      query.author = authorId;
    }

    if (category && category !== "all") {
      let mappedTag = category as string;
      if (mappedTag.toLowerCase() === "diagnosis") mappedTag = "Diagnosis";
      else if (mappedTag.toLowerCase() === "care_tips") mappedTag = "Care Tips";
      else if (mappedTag.toLowerCase() === "watering") mappedTag = "Watering";
      else if (mappedTag.toLowerCase() === "pests") mappedTag = "Pests";
      
      query.plantTag = mappedTag;
    }

    if (cursor) {
      query._id = { $lt: cursor };
    }

    let posts = await CommunityPost.find(query)
      .populate("author", "name role")
      .populate("linkedDiagnosis", "diseaseNameEn confidence severity")
      .sort({ isPinned: -1, createdAt: -1, _id: -1 })
      .limit(qLimit + 1);



    const hasNextPage = posts.length > qLimit;
    if (hasNextPage) posts.pop();

    const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

    const mappedPosts = await Promise.all(posts.map(p => mapPostToDTO(p, (req as any).user.id)));

    res.status(200).json({
      success: true,
      data: {
        items: mappedPosts,
        pageInfo: { hasNextPage, nextCursor }
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

// @desc    Search community posts
// @route   GET /api/community/search
// @access  Private
export const searchPosts = async (req: Request, res: Response) => {
  try {
    const { q, cursor, limit, category, plantTag } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 10;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ success: false, message: "Search query 'q' is required" });
    }

    const query: any = { 
      status: 'visible',
      $text: { $search: q }
    };

    if (category && category !== "all") {
      query.plantTag = category; // fallback logic if category is sent
    }
    if (plantTag && plantTag !== "all") {
      query.plantTag = plantTag;
    }

    if (cursor) {
      // In text search, cursor pagination by _id might conflict with text score sorting.
      // For simplicity, we just filter by _id if cursor is provided and sort by _id
      // For a production app, we'd use skip/limit or cursor on score.
      query._id = { $lt: cursor };
    }

    let posts = await CommunityPost.find(query, { score: { $meta: "textScore" } })
      .populate("author", "name role")
      .populate("linkedDiagnosis", "diseaseNameEn confidence severity")
      .sort({ score: { $meta: "textScore" }, _id: -1 })
      .limit(qLimit + 1);

    const hasNextPage = posts.length > qLimit;
    if (hasNextPage) posts.pop();

    const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

    const mappedPosts = await Promise.all(posts.map(p => mapPostToDTO(p, (req as any).user.id)));

    res.status(200).json({
      success: true,
      data: {
        items: mappedPosts,
        pageInfo: { hasNextPage, nextCursor }
      }
    });
  } catch (error) {
    logger.error('Failed to search posts', { event: 'community_feed_and_moderation.search_posts.error', error });
    res.status(500).json({ message: "Failed to search posts" });
  }
};

// @desc    Get trending community posts
// @route   GET /api/community/trending
// @access  Private
export const getTrendingPosts = async (req: Request, res: Response) => {
  try {
    const { cursor, limit } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 10;
    
    const query: any = { status: 'visible' };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    // We'll calculate a simple trending score sorting by recent high engagement.
    // In a real app, this would be an aggregation pipeline.
    let posts = await CommunityPost.aggregate([
      { $match: query },
      { 
        $addFields: {
          ageInHours: { 
            $divide: [
              { $subtract: [new Date(), "$createdAt"] },
              1000 * 60 * 60
            ]
          }
        }
      },
      {
        $addFields: {
          trendingScore: {
            $divide: [
              { $add: [{ $multiply: ["$likes", 1.5] }, { $multiply: ["$commentsCount", 2] }] },
              { $pow: [{ $add: ["$ageInHours", 2] }, 1.8] }
            ]
          }
        }
      },
      { $sort: { trendingScore: -1, _id: -1 } },
      { $limit: qLimit + 1 }
    ]);

    // Populate after aggregate
    posts = await CommunityPost.populate(posts, [
      { path: "author", select: "name role" },
      { path: "linkedDiagnosis", select: "diseaseNameEn confidence severity" }
    ]);

    const hasNextPage = posts.length > qLimit;
    if (hasNextPage) posts.pop();

    const nextCursor = posts.length > 0 ? posts[posts.length - 1]._id : null;

    const mappedPosts = await Promise.all(posts.map(p => mapPostToDTO(p, (req as any).user.id)));

    res.status(200).json({
      success: true,
      data: {
        items: mappedPosts,
        pageInfo: { hasNextPage, nextCursor }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch trending posts', { event: 'community_feed_and_moderation.trending_posts.error', error });
    res.status(500).json({ message: "Failed to fetch trending posts" });
  }
};

// @desc    Create a community post
// @route   POST /api/community/posts
// @access  Private
export const createPost = async (req: Request, res: Response) => {
  let uploadedImagePublicIds: string[] = [];
  try {
    const userId = (req as any).user.id;
    const username = (req as any).user.name;
    const { title, content, plantTag, clientOperationId, linkedDiagnosisId, pollQuestion, pollOptions } = req.body;

    // Validation is mostly handled by Zod now, but idempotency check happens here
    if (clientOperationId) {
      const existing = await CommunityPost.findOne({ author: userId, clientOperationId })
          .populate("author", "name role")
          .populate("linkedDiagnosis", "diseaseNameEn confidence severity");
      if (existing) {
        const dto = await mapPostToDTO(existing, userId);
        return res.status(201).json({
          success: true,
          data: { post: dto }
        });
      }
    }

    let imageUrl = "";
    let imagePublicId = "";
    const imageUrls: string[] = [];
    
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadToCloudinary(file.buffer, "community_posts");
        imageUrls.push(uploadResult.url);
        uploadedImagePublicIds.push(uploadResult.public_id);
      }
      if (imageUrls.length > 0) {
        imageUrl = imageUrls[0];
        imagePublicId = uploadedImagePublicIds[0];
      }
    } else if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "community_posts");
      imageUrl = uploadResult.url;
      imagePublicId = uploadResult.public_id;
      imageUrls.push(imageUrl);
      uploadedImagePublicIds.push(imagePublicId);
    }

    let linkedPollId = undefined;

    if (pollQuestion && pollOptions) {
      const optionsArray = Array.isArray(pollOptions) ? pollOptions : [pollOptions];
      if (optionsArray.length >= 2) {
        const poll = await CommunityPoll.create({
          question: pollQuestion.trim(),
          totalVotes: 0,
        });
        linkedPollId = poll._id;

        let sortOrder = 0;
        for (const opt of optionsArray) {
          await CommunityPollOption.create({
            poll: poll._id,
            text: opt.trim(),
            votes: 0,
            sortOrder: sortOrder++,
          });
        }
      }
    }

    const post = await CommunityPost.create({
      author: userId,
      authorName: username,
      plantTag,
      title: title.trim(),
      content: content.trim(),
      imagePath: imageUrl,
      imagePublicId,
      imageUrls,
      clientOperationId,
      linkedDiagnosis: linkedDiagnosisId || undefined,
      poll: linkedPollId,
    });

    try {
      await CommunityAuditService.logAction(userId, 'CREATE_POST', 'CommunityPost', post._id.toString(), { title: post.title.substring(0, 50), plantTag });
      logger.info('Created community post', {
        event: 'community_feed_and_moderation.create_post',
        requestId: (req as any).id,
        actorId: userId,
        targetId: post._id,
        payload: { title: post.title.substring(0, 50), plantTag }
      });

      // Notify followers
      const mongoose = require('mongoose');
      const Follow = mongoose.model('Follow');
      const followers = await Follow.find({ following: new mongoose.Types.ObjectId(userId) });
      for (const follow of followers) {
        await NotificationService.sendNotification({
          userId: follow.follower.toString(),
          actorId: userId,
          type: 'NEW_POST_FROM_FOLLOWING',
          entityId: post._id.toString(),
          entityType: 'CommunityPost',
          title: 'New Post',
          message: `${username} published a new post.`
        });
      }
    } catch (auditErr) {
      logger.error('Failed to log audit action for CREATE_POST or notify followers', { error: auditErr, postId: post._id });
    }

    const populatedPost = await CommunityPost.findById(post._id)
        .populate("author", "name role")
        .populate("linkedDiagnosis", "diseaseNameEn confidence severity");
        
    const dto = await mapPostToDTO(populatedPost, userId);

    res.status(201).json({
      success: true,
      data: { post: dto }
    });
  } catch (error: any) {
    // Cloudinary Cleanup on Failure
    for (const pubId of uploadedImagePublicIds) {
      await cloudinary.uploader.destroy(pubId).catch(err => logger.error('Cloudinary cleanup failed', err));
    }

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Conflict on create', code: 'CONFLICT' });
    }
    logger.error('Failed to create post', { event: 'community_feed_and_moderation.create_post.error', error });
    res.status(500).json({ message: "Failed to create post" });
  }
};

// @desc    Toggle post like status
// @route   POST /api/community/posts/:id/like
// @access  Private
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const postId = req.params.id;
    // Spec: body.liked=true means like, false means unlike
    const wantsToLike: boolean | undefined = req.body?.liked;

    const post = await CommunityPost.findOne({ _id: postId, status: 'visible' });
    if (!post) {
      return res.status(404).json({ error: "Post not found", errorCode: 'RESOURCE_NOT_FOUND' });
    }

    const hasLiked = post.likedBy.map((id: any) => id.toString()).includes(userId);

    // Determine desired state: if wantsToLike is explicitly provided, use it; otherwise toggle
    const shouldLike = wantsToLike !== undefined ? wantsToLike : !hasLiked;
    let liked = false;

    if (!shouldLike && hasLiked) {
      // Unlike atomically
      await CommunityPost.updateOne(
        { _id: postId },
        { 
          $pull: { likedBy: userId },
          $inc: { likes: -1 }
        }
      );
    } else if (shouldLike && !hasLiked) {
      // Like atomically
      await CommunityPost.updateOne(
        { _id: postId },
        { 
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 }
        }
      );
      liked = true;

      // Send Notification to post author if not liking own post
      if (post.author.toString() !== userId) {
        NotificationService.sendNotification({
          userId: post.author.toString(),
          actorId: userId,
          type: 'LIKE_POST',
          entityId: post._id.toString(),
          entityType: 'CommunityPost',
          title: 'New Like',
          message: `${(req as any).user.name || 'Someone'} liked your post "${post.title.substring(0, 20)}..."`
        }).catch(e => logger.error('Error sending like notification', { error: e }));
      }
    } else {
      // No change needed, just return current state
      liked = hasLiked;
    }

    // Fetch the updated post to get the true current count
    const updatedPost = await CommunityPost.findById(postId);

    logger.info(`User ${liked ? 'liked' : 'unliked'} post`, {
      event: 'community_feed_and_moderation.toggle_like',
      requestId: (req as any).id,
      actorId: userId,
      targetId: postId,
      result: liked ? 'liked' : 'unliked'
    });

    res.status(200).json({
      success: true,
      data: { liked, likes: updatedPost?.likes || 0 }
    });
  } catch (error) {
    logger.error('Failed to toggle like', { event: 'community_feed_and_moderation.toggle_like.error', error });
    res.status(500).json({ message: "Failed to toggle like" });
  }
};

// @desc    Get comments of a post
// @route   GET /api/community/posts/:id/comments
// @access  Private
export const getComments = async (req: Request, res: Response) => {
  try {
    const { cursor, limit } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 50;

    const query: any = { post: req.params.id, status: 'visible' };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const comments = await Comment.find(query)
      .sort({ createdAt: 1 })
      .populate('author', 'name role');

    const topLevelComments: any[] = [];
    const repliesMap = new Map<string, any[]>();

    for (const c of comments) {
      if (c.parentId) {
        const pId = c.parentId.toString();
        if (!repliesMap.has(pId)) repliesMap.set(pId, []);
        repliesMap.get(pId)!.push(c);
      } else {
        topLevelComments.push(c);
      }
    }

    // Apply pagination only to top-level comments for simplicity (or as requested)
    // We reverse the top level comments if we want newest first, but spec usually wants oldest first or newest first
    topLevelComments.reverse();
    
    const hasNextPage = topLevelComments.length > qLimit;
    if (hasNextPage) topLevelComments.pop();

    const nextCursor = topLevelComments.length > 0 ? topLevelComments[topLevelComments.length - 1]._id : null;

    const mapCommentToDTO = (comment: any): any => {
      const authorRole = comment.author?.role || "farmer";
      return {
        id: comment._id.toString(),
        author: {
          id: comment.author?._id?.toString() || comment.author?.toString(),
          name: comment.author?.name || comment.authorName
        },
        authorRole,
        content: comment.text,
        createdAt: comment.createdAt.toISOString(),
        isExpert: authorRole === "expert" || authorRole === "agronomist",
        parentId: comment.parentId?.toString() || null,
        replies: (repliesMap.get(comment._id.toString()) || []).map((r: any) => mapCommentToDTO(r))
      };
    };

    const mappedComments = topLevelComments.map(mapCommentToDTO);

    res.status(200).json({
      success: true,
      data: {
        items: mappedComments,
        pageInfo: { hasNextPage, nextCursor }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch comments', { event: 'community_feed_and_moderation.list_comments.error', error });
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

// @desc    Add a comment
// @route   POST /api/community/posts/:id/comments
// @access  Private
export const createComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const username = (req as any).user.name;
    const { text, clientOperationId, parentId } = req.body;
    const postId = req.params.id;

    if (clientOperationId) {
      const existing = await Comment.findOne({ author: userId, post: postId, clientOperationId }).populate('author', 'name role');
      if (existing) {
        const authorRole = (existing.author as any)?.role || "farmer";
        return res.status(201).json({
          success: true,
          data: {
            comment: {
              id: existing._id,
              author: { id: (existing.author as any)?._id || userId, name: existing.authorName },
              authorRole,
              content: existing.text,
              createdAt: existing.createdAt.toISOString(),
              isExpert: authorRole === "expert" || authorRole === "agronomist",
              parentId: existing.parentId?.toString() || null,
              replies: []
            }
          }
        });
      }
    }

    const post = await CommunityPost.findOne({ _id: postId, status: 'visible' });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found or unavailable", code: 'RESOURCE_NOT_FOUND' });
    }

    let parentComment = null;
    if (parentId) {
      parentComment = await Comment.findOne({ _id: parentId, post: postId });
      if (!parentComment) {
        return res.status(404).json({ success: false, message: "Parent comment not found", code: 'RESOURCE_NOT_FOUND' });
      }
    }

    // Create comment
    const comment = await Comment.create({
      post: post._id,
      author: userId,
      authorName: username,
      text: text.trim(),
      clientOperationId,
      parentId: parentId || undefined,
    });

    const populatedComment = await Comment.findById(comment._id).populate('author', 'name role');
    const authorRole = (populatedComment?.author as any)?.role || "farmer";

    // Atomically increment comment count
    await CommunityPost.updateOne({ _id: post._id }, { $inc: { commentsCount: 1 } });

    // Send Notification
    if (parentId && parentComment) {
      if (parentComment.author.toString() !== userId) {
        NotificationService.sendNotification({
          userId: parentComment.author.toString(),
          actorId: userId,
          type: 'REPLY_COMMENT',
          entityId: post._id.toString(),
          entityType: 'CommunityPost',
          title: 'New Reply',
          message: `${username} replied to your comment on "${post.title.substring(0, 20)}..."`
        }).catch(e => logger.error('Error sending reply notification', { error: e }));
      }
    } else {
      if (post.author.toString() !== userId) {
        NotificationService.sendNotification({
          userId: post.author.toString(),
          actorId: userId,
          type: 'COMMENT_POST',
          entityId: post._id.toString(),
          entityType: 'CommunityPost',
          title: 'New Comment',
          message: `${username} commented on your post "${post.title.substring(0, 20)}..."`
        }).catch(e => logger.error('Error sending comment notification', { error: e }));
      }
    }

    await CommunityAuditService.logAction(userId, 'CREATE_COMMENT', 'Comment', comment._id.toString(), { postId: post._id.toString(), textLength: text.length });
    logger.info('Created comment on post', {
      event: 'community_feed_and_moderation.create_comment',
      requestId: (req as any).id,
      actorId: userId,
      targetId: comment._id,
      payload: { postId: post._id, textLength: text.length }
    });

    res.status(201).json({
      success: true,
      data: {
        comment: {
          id: comment._id.toString(),
          author: { id: (populatedComment?.author as any)?._id || userId, name: comment.authorName },
          authorRole,
          content: comment.text,
          createdAt: comment.createdAt.toISOString(),
          isExpert: authorRole === "expert" || authorRole === "agronomist",
          parentId: comment.parentId?.toString() || null,
          replies: []
        }
      }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Conflict on create', code: 'CONFLICT' });
    }
    if (error.name === 'ValidationError') {
      return next(new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error.message }));
    }
    logger.error('Failed to create comment', { event: 'community_feed_and_moderation.create_comment.error', error });
    next(error);
  }
};

// @desc    Delete a community post
// @route   DELETE /api/community/posts/:id
// @access  Private
export const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const postId = req.params.id;

    const post = await CommunityPost.findOne({ _id: postId });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found", code: 'RESOURCE_NOT_FOUND' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ error: "You can only delete your own posts", errorCode: 'AUTH_FORBIDDEN' });
    }

    await CommunityPost.updateOne({ _id: postId }, { status: 'removed' });

    await CommunityAuditService.logAction(userId, 'DELETE_POST', 'CommunityPost', postId as string);
    logger.info('User deleted community post', {
      event: 'community_feed_and_moderation.delete_post',
      requestId: (req as any).id,
      actorId: userId,
      targetId: postId,
    });

    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error: any) {
    logger.error('Failed to delete post', { event: 'community_feed_and_moderation.delete_post.error', error });
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// @desc    Update a community post
// @route   PUT /api/community/posts/:id
// @access  Private
export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  let uploadedImagePublicIds: string[] = [];
  try {
    const userId = (req as any).user.id;
    const postId = req.params.id;
    const { title, content, plantTag } = req.body;

    const post = await CommunityPost.findOne({ _id: postId });
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found", code: 'RESOURCE_NOT_FOUND' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ error: "You can only edit your own posts", errorCode: 'AUTH_FORBIDDEN' });
    }

    if (title) post.title = title;
    if (content) post.content = content;
    if (plantTag) post.plantTag = plantTag;
    post.lastEditedAt = new Date();

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const urls: string[] = [];
      for (const file of req.files) {
        const uploadResult = await uploadToCloudinary(file.buffer, "community_posts");
        urls.push(uploadResult.url);
        uploadedImagePublicIds.push(uploadResult.public_id);
      }
      if (urls.length > 0) {
        post.imagePath = urls[0];
        post.imageUrls = urls;
        // Should we update imagePublicId too? If there's multiple, maybe just the first one?
        post.imagePublicId = uploadedImagePublicIds[0];
      }
    } else if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "community_posts");
      post.imagePath = uploadResult.url;
      post.imagePublicId = uploadResult.public_id;
      post.imageUrls = [uploadResult.url];
      uploadedImagePublicIds.push(uploadResult.public_id);
    }

    await post.save();

    try {
      await CommunityAuditService.logAction(userId, 'UPDATE_POST', 'CommunityPost', postId as string, { plantTag: post.plantTag });
      logger.info('User updated community post', {
        event: 'community_feed_and_moderation.update_post',
        requestId: (req as any).id,
        actorId: userId,
        targetId: postId,
      });
    } catch (auditErr) {
      logger.error('Failed to log audit action for UPDATE_POST', { error: auditErr, postId });
    }

    const populatedPost = await CommunityPost.findById(post._id)
      .populate("author", "name role")
      .populate("linkedDiagnosis", "diseaseNameEn confidence severity");
    const dto = await mapPostToDTO(populatedPost, userId);

    res.status(200).json({
      success: true,
      data: { post: dto }
    });
  } catch (error: any) {
    // Cloudinary Cleanup on Failure
    for (const pubId of uploadedImagePublicIds) {
      await cloudinary.uploader.destroy(pubId).catch(err => logger.error('Cloudinary cleanup failed', err));
    }

    logger.error('Failed to update post', { event: 'community_feed_and_moderation.update_post.error', error });
    res.status(500).json({ message: "Failed to update post" });
  }
};

// @desc    Update a comment
// @route   PUT /api/community/posts/:id/comments/:commentId
// @access  Private
export const updateComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const commentId = req.params.commentId;
    const { text } = req.body;

    const comment = await Comment.findOne({ _id: commentId });
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found", code: 'RESOURCE_NOT_FOUND' });
    }

    if (comment.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to edit this comment", code: 'FORBIDDEN' });
    }

    comment.text = text;
    comment.lastEditedAt = new Date();
    await comment.save();

    await CommunityAuditService.logAction(userId, 'UPDATE_COMMENT', 'Comment', commentId as string);
    logger.info('User updated comment', {
      event: 'community_feed_and_moderation.update_comment',
      requestId: (req as any).id,
      actorId: userId,
      targetId: commentId,
    });

    res.status(200).json({
      success: true,
      comment: {
        id: comment._id,
        authorName: comment.authorName,
        text: comment.text,
        timeLabel: formatRelativeTime(comment.createdAt),
        lastEditedAt: comment.lastEditedAt,
      },
      data: { comment }
    });
  } catch (error: any) {
    logger.error('Failed to update comment', { event: 'community_feed_and_moderation.update_comment.error', error });
    res.status(500).json({ message: "Failed to update comment" });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/community/posts/:id/comments/:commentId
// @access  Private
export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const commentId = req.params.commentId;
    const postId = req.params.id;

    const comment = await Comment.findOne({ _id: commentId });
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found", code: 'RESOURCE_NOT_FOUND' });
    }

    if (comment.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment", code: 'FORBIDDEN' });
    }

    comment.status = 'removed';
    await comment.save();

    await CommunityPost.updateOne({ _id: postId }, { $inc: { commentsCount: -1 } });

    await CommunityAuditService.logAction(userId, 'DELETE_COMMENT', 'Comment', commentId as string);
    logger.info('User deleted comment', {
      event: 'community_feed_and_moderation.delete_comment',
      requestId: (req as any).id,
      actorId: userId,
      targetId: commentId,
    });

    res.status(200).json({ success: true, message: "Comment deleted successfully" });
  } catch (error: any) {
    logger.error('Failed to delete comment', { event: 'community_feed_and_moderation.delete_comment.error', error });
    res.status(500).json({ message: "Failed to delete comment" });
  }
};


// @desc    Toggle save post status
// @route   POST /api/community/posts/:id/save
// @access  Private
export const toggleSave = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const postId = req.params.id;
    // Spec: body.saved=true means save, false means unsave
    const wantsToSave: boolean | undefined = req.body?.saved;

    const post = await CommunityPost.findOne({ _id: postId, status: 'visible' });
    if (!post) {
      return res.status(404).json({ error: "Post not found", errorCode: 'RESOURCE_NOT_FOUND' });
    }

    const existingSave = await SavedPost.findOne({ user: userId, post: postId });
    const isSaved = !!existingSave;

    // Determine desired state: if wantsToSave explicitly provided, use it; otherwise toggle
    const shouldSave = wantsToSave !== undefined ? wantsToSave : !isSaved;
    let saved = false;

    if (!shouldSave && isSaved) {
      await SavedPost.deleteOne({ _id: existingSave._id });
    } else if (shouldSave && !isSaved) {
      await SavedPost.create({ user: userId, post: postId });
      saved = true;
    } else {
      // No change needed
      saved = isSaved;
    }

    logger.info(`User ${saved ? 'saved' : 'unsaved'} post`, {
      event: 'community_feed_and_moderation.toggle_save',
      actorId: userId,
      targetId: postId,
      result: saved ? 'saved' : 'unsaved'
    });

    res.status(200).json({
      success: true,
      data: { saved }
    });
  } catch (error) {
    logger.error('Failed to toggle save post', { error });
    res.status(500).json({ message: "Failed to toggle save post" });
  }
};

// @desc    Get saved posts
// @route   GET /api/community/saved
// @access  Private
export const getSavedPosts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { cursor, limit } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 20;

    const query: any = { user: userId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const savedPosts = await SavedPost.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(qLimit + 1)
      .populate({
        path: 'post',
        match: { status: 'visible' },
        populate: [
          { path: 'author', select: 'name role' },
          { path: 'linkedDiagnosis', select: 'diseaseNameEn confidence severity' }
        ]
      });

    // Filter out posts that might have been removed
    const validSavedPosts = savedPosts.filter(sp => sp.post != null);

    const hasNextPage = validSavedPosts.length > qLimit;
    if (hasNextPage) validSavedPosts.pop();

    const nextCursor = validSavedPosts.length > 0 ? validSavedPosts[validSavedPosts.length - 1]._id : null;

    const mappedPosts = validSavedPosts.map(sp => {
      const p = sp.post as any;
      return {
        id: p._id,
        author: p.author?._id,
        authorName: p.authorName,
        authorRole: p.author?.role ?? "farmer",
        plantTag: p.plantTag,
        title: p.title,
        content: p.content,
        timeLabel: formatRelativeTime(p.createdAt),
        likes: p.likes,
        comments: p.commentsCount,
        imagePath: p.imagePath,
        liked: p.likedBy?.includes(userId) ?? false,
        saved: true,
        linkedDiagnosisId: p.linkedDiagnosis?._id?.toString(),
        diagnosisDisease: p.linkedDiagnosis?.diseaseNameEn,
        diagnosisConfidence: p.linkedDiagnosis?.confidence,
        diagnosisSeverity: p.linkedDiagnosis?.severity,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        items: mappedPosts,
        pageInfo: { hasNextPage, nextCursor }
      }
    });
  } catch (error) {
    logger.error('Failed to get saved posts', { error });
    res.status(500).json({ message: "Failed to get saved posts" });
  }
};

// @desc    Get user activity center timeline
// @route   GET /api/community/activity
// @access  Private
export const getActivityCenter = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    // Aggregate posts
    const posts = await CommunityPost.find({ author: userId })
      .select('_id title content createdAt likes commentsCount plantTag')
      .sort({ createdAt: -1 })
      .lean();

    // Aggregate comments
    const comments = await Comment.find({ author: userId })
      .select('_id postId text createdAt')
      .populate('postId', 'title author')
      .sort({ createdAt: -1 })
      .lean();

    // Mapping items to a unified timeline
    const activities = [
      ...posts.map(p => ({
        type: 'POST_CREATED',
        id: p._id,
        entityId: p._id,
        content: p.title || p.content.substring(0, 50),
        plantTag: p.plantTag,
        stats: { likes: p.likes, comments: p.commentsCount },
        createdAt: p.createdAt
      })),
      ...comments.map((c: any) => {
        const post = c.postId as any;
        return {
          type: 'COMMENT_CREATED',
          id: c._id,
          entityId: post?._id,
          postTitle: post?.title,
          content: c.text,
          createdAt: c.createdAt
        };
      })
    ];

    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginatedActivities = activities.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      data: {
        items: paginatedActivities,
        pageInfo: {
          page,
          limit,
          total: activities.length,
          pages: Math.ceil(activities.length / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get activity center', { error });
    res.status(500).json({ message: "Failed to get activity center data" });
  }
};

