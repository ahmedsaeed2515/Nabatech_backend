import request from 'supertest';
import app from '../../app';
import UserModel from '../../models/user_model';
import PostModel from '../../models/post_model';
import CommentV2Model from '../../models/comment_v2_model';
import LikeV2Model from '../../models/like_v2_model';
import { createFakeUser } from '../factories';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

describe('[INTEGRATION] Community Controller (V2) - Phase 3', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await UserModel.create(createFakeUser());
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
    jest.clearAllMocks();
  });

  describe('Posts CRUD', () => {
    it('PASS: Create Post', async () => {
      const res = await request(app)
        .post('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Hello Community!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.content).toBe('Hello Community!');
    });

    it('PASS: Get Posts', async () => {
      await PostModel.create({
        author: userId,
        authorName: 'Test',
        content: 'Post 1',
        plantTag: 'General',
        likes: 0,
        commentsCount: 0,
        likedBy: [],
        status: 'visible'
      });

      const res = await request(app)
        .get('/api/v1/posts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.posts.length).toBeGreaterThanOrEqual(1);
    });

    it('PASS: Update Post', async () => {
      const post = await PostModel.create({
        author: userId, authorName: 'Test', content: 'Old Content', plantTag: 'General',
        likes: 0, commentsCount: 0, likedBy: [], status: 'visible'
      });

      const res = await request(app)
        .put(`/api/v1/posts/${post._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated Content'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.content).toBe('Updated Content');
    });

    it('PASS: Delete Post', async () => {
      const post = await PostModel.create({
        author: userId, authorName: 'Test', content: 'Delete Me', plantTag: 'General',
        likes: 0, commentsCount: 0, likedBy: [], status: 'visible'
      });

      const res = await request(app)
        .delete(`/api/v1/posts/${post._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      const check = await PostModel.findById(post._id);
      expect(check?.deletedAt).toBeDefined(); // Soft delete check
    });
  });

  describe('Likes and Comments', () => {
    let postId: string;

    beforeEach(async () => {
      const post = await PostModel.create({
        author: userId, authorName: 'Test', content: 'Base Post', plantTag: 'General',
        likes: 0, commentsCount: 0, likedBy: [], status: 'visible'
      });
      postId = post._id.toString();
    });

    it('PASS: Toggle Like', async () => {
      const res = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.liked).toBe(true);

      const resUnlike = await request(app)
        .post(`/api/v1/posts/${postId}/like`)
        .set('Authorization', `Bearer ${authToken}`);
        
      expect(resUnlike.status).toBe(200);
      expect(resUnlike.body.data.liked).toBe(false);
    });

    it('PASS: Add and Get Comment', async () => {
      const addRes = await request(app)
        .post(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Nice post!' });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.content).toBe('Nice post!');

      const getRes = await request(app)
        .get(`/api/v1/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('PASS: Update and Delete Comment', async () => {
      const comment = await CommentV2Model.create({
        user: userId, post: postId, content: 'To be updated'
      });
      const commentId = comment._id.toString();

      const updateRes = await request(app)
        .put(`/api/v1/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated comment' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.content).toBe('Updated comment');

      const delRes = await request(app)
        .delete(`/api/v1/posts/${postId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(delRes.status).toBe(200);
      
      const check = await CommentV2Model.findById(commentId);
      expect(check?.deletedAt).toBeDefined(); // Soft delete check for comments or hard delete if BaseRepository hardDelete was used
    });
  });
});
