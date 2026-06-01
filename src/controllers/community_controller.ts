import { Request, Response } from "express";
import CommunityPost from "../models/community_post_model";
import Comment from "../models/comment_model";
import cloudinary from "../config/cloudinary";

// Helper function to upload buffer stream to Cloudinary
const uploadToCloudinary = (fileBuffer: Buffer, folderName: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folderName },
      (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// Helper function to format creation date as relative label
const formatRelativeTime = (date: Date): string => {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// @desc    Get all community posts
// @route   GET /api/community/posts
// @access  Private
export const getCommunityPosts = async (req: Request, res: Response) => {
  try {
    const category = req.query.category as string;
    const query: any = {};

    if (category && category !== "all") {
      // Map frontend category filters to DB tags
      let mappedTag = category;
      if (category.toLowerCase() === "diagnosis") mappedTag = "Diagnosis";
      else if (category.toLowerCase() === "care_tips") mappedTag = "Care Tips";
      else if (category.toLowerCase() === "watering") mappedTag = "Watering";
      else if (category.toLowerCase() === "pests") mappedTag = "Pests";
      
      query.plantTag = mappedTag;
    }

    let posts = await CommunityPost.find(query)
      .populate("author", "name role")
      .sort({ createdAt: -1 });

    // Seed mock data if collection is empty
    if (posts.length === 0) {
      const defaultUserId = (req as any).user.id;
      const seedPosts = [
        {
          author: defaultUserId,
          authorName: "Mariam Ali",
          plantTag: "Diagnosis",
          title: "Brown edges after fertilizing",
          content: "I used liquid fertilizer yesterday and noticed slight brown edges today. Any dosage advice?",
          likes: 18,
          commentsCount: 2,
        },
        {
          author: defaultUserId,
          authorName: "Omar Hassan",
          plantTag: "Watering",
          title: "Best sunlight duration indoors?",
          content: "My basil gets 3 hours direct sun from the balcony. Should I move it for stronger growth?",
          likes: 24,
          commentsCount: 0,
        }
      ];
      await CommunityPost.create(seedPosts);
      posts = await CommunityPost.find(query)
        .populate("author", "name role")
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: posts.length,
      posts: posts.map(p => ({
        id: p._id,
        author: p.author,
        authorName: p.authorName,
        // FIXED: Include authorRole from populated user
        authorRole: (p.author as any)?.role ?? "farmer",
        plantTag: p.plantTag,
        title: p.title,
        content: p.content,
        timeLabel: formatRelativeTime(p.createdAt),
        likes: p.likes,
        comments: p.commentsCount,
        imagePath: p.imagePath,
        liked: p.likedBy.includes((req as any).user.id),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch posts", error });
  }
};

// @desc    Create a community post
// @route   POST /api/community/posts
// @access  Private
export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const username = (req as any).user.name;
    const { title, content, plantTag } = req.body;

    if (!title || !content || !plantTag) {
      return res.status(400).json({ message: "Title, content and plant tag are required" });
    }

    if (title.trim().length < 5) {
      return res.status(400).json({ message: "Title must be at least 5 characters long" });
    }

    if (content.trim().length < 10) {
      return res.status(400).json({ message: "Content must be at least 10 characters long" });
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, "community_posts");
    }

    const post = await CommunityPost.create({
      author: userId,
      authorName: username,
      plantTag,
      title: title.trim(),
      content: content.trim(),
      imagePath: imageUrl || "",
    });

    res.status(201).json({
      success: true,
      post: {
        id: post._id,
        authorName: post.authorName,
        plantTag: post.plantTag,
        title: post.title,
        content: post.content,
        likes: post.likes,
        comments: post.commentsCount,
        imagePath: post.imagePath
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create post", error });
  }
};

// @desc    Toggle post like status
// @route   POST /api/community/posts/:id/like
// @access  Private
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userIndex = post.likedBy.indexOf(userId);
    let liked = false;

    if (userIndex > -1) {
      // User has already liked the post, unlike it
      post.likedBy.splice(userIndex, 1);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // Like the post
      post.likedBy.push(userId);
      post.likes += 1;
      liked = true;
    }

    await post.save();

    res.status(200).json({
      success: true,
      likes: post.likes,
      liked,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle like", error });
  }
};

// @desc    Get comments of a post
// @route   GET /api/community/posts/:id/comments
// @access  Private
export const getComments = async (req: Request, res: Response) => {
  try {
    const comments = await Comment.find({ post: req.params.id }).sort({ createdAt: -1 });

    // Seed mock comments if list is empty (only for seeded default posts)
    if (comments.length === 0 && (req.params.id === "p1" || req.params.id === "p2")) {
      const seedComments = [
        {
          post: req.params.id,
          author: (req as any).user.id,
          authorName: "Nour",
          text: "Try reducing fertilizer concentration to half dose next time.",
        },
        {
          post: req.params.id,
          author: (req as any).user.id,
          authorName: "Karim",
          text: "Flush the soil once and monitor new leaves for a week.",
        }
      ];
      await Comment.create(seedComments);
      const seeded = await Comment.find({ post: req.params.id }).sort({ createdAt: -1 });
      return res.status(200).json({
        success: true,
        comments: seeded.map(c => ({
          id: c._id,
          authorName: c.authorName,
          text: c.text,
          timeLabel: formatRelativeTime(c.createdAt),
        })),
      });
    }

    res.status(200).json({
      success: true,
      comments: comments.map(c => ({
        id: c._id,
        authorName: c.authorName,
        text: c.text,
        timeLabel: formatRelativeTime(c.createdAt),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments", error });
  }
};

// @desc    Add a comment
// @route   POST /api/community/posts/:id/comments
// @access  Private
export const createComment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const username = (req as any).user.name;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await Comment.create({
      post: post._id,
      author: userId,
      authorName: username,
      text: text.trim(),
    });

    post.commentsCount += 1;
    await post.save();

    res.status(201).json({
      success: true,
      comment: {
        id: comment._id,
        authorName: comment.authorName,
        text: comment.text,
        timeLabel: "now",
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add comment", error });
  }
};
