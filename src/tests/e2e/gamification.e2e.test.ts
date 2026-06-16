import request from 'supertest';
import app from '../../app';
import { setupTestDB, loginUser } from '../setup';
import { GamificationService } from '../../services/GamificationService';
import UserXpModel from '../../models/user_xp_model';
import AchievementModel from '../../models/achievement_model';

setupTestDB();

describe('Gamification & Community E2E', () => {
  let authHeader: string;
  let userId: string;
  let postId: string;

  beforeAll(async () => {
    const userResult = await loginUser('gamification@example.com');
    userId = userResult.user._id.toString();
    authHeader = userResult.authHeader;
  });

  it('Directly call GamificationService.addXp(userId, 100) and assert XP', async () => {
    const gamificationService = new GamificationService();
    
    // 1. Add 100 XP
    await gamificationService.addXp(userId, 100);

    // 2. Query UserXp
    const userXp = await UserXpModel.findOne({ user: userId });
    expect(userXp).toBeDefined();
    expect(userXp!.totalXp).toBeGreaterThanOrEqual(100);
  });

  it('Assert that an Achievement was automatically generated', async () => {
    // 3. Query Achievement
    const achievements = await AchievementModel.find({ user: userId });
    expect(achievements.length).toBeGreaterThanOrEqual(1);

    // Look for Seedling or generic level up achievement
    const hasAchievement = achievements.some(a => a.title.includes('Seedling') || a.xpAwarded >= 0);
    expect(hasAchievement).toBe(true);
  });

  it('POST /v2/posts - Create a social post', async () => {
    // 4. Test Social endpoints
    const res = await request(app)
      .post('/api/v2/posts')
      .set('Authorization', authHeader)
      .set('x-client-operation-id', 'op-post-1')
      .send({
        content: 'Check out my new plant setup!'
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('_id');
    expect(res.body.data.content).toBe('Check out my new plant setup!');
    
    postId = res.body.data._id;
  });

  it('POST /v2/posts/:id/like - Like the post and increment likesCount', async () => {
    const res = await request(app)
      .post(`/api/v2/posts/${postId}/like`)
      .set('Authorization', authHeader)
      .set('x-client-operation-id', 'op-like-1')
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.message).toMatch(/liked/i);

    // Verify likesCount on the post
    const getRes = await request(app)
      .get('/api/v2/posts')
      .set('Authorization', authHeader)
      .expect(200);

    const post = getRes.body.data.data.find((p: any) => p._id === postId);
    expect(post).toBeDefined();
    expect(post.likesCount).toBe(1);
  });
});
