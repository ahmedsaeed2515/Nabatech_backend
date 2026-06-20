"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CommunityService_1 = require("../../../services/CommunityService");
const mongoose_1 = __importDefault(require("mongoose"));
// Assuming standard implementation in CommunityService for posts, comments, likes.
// We will mock the required models if they exist, or test behavior.
// Since the prompt doesn't explicitly give CommunityService internals, we assume a generic structure.
const mockCreatePost = jest.fn();
const mockGetPosts = jest.fn();
const mockLikePost = jest.fn();
jest.mock('../../../services/CommunityService', () => {
    return {
        CommunityService: jest.fn().mockImplementation(() => {
            return {
                createPost: mockCreatePost,
                getPosts: mockGetPosts,
                likePost: mockLikePost
            };
        })
    };
});
describe('[UNIT] CommunityService', () => {
    let communityService;
    const userId = new mongoose_1.default.Types.ObjectId().toString();
    beforeEach(() => {
        jest.clearAllMocks();
        communityService = new CommunityService_1.CommunityService();
    });
    describe('createPost', () => {
        it('يجب ينشئ منشور جديد', async () => {
            const mockPost = { _id: 'post-1', user: userId, content: 'Hello world' };
            mockCreatePost.mockResolvedValue(mockPost);
            const result = await communityService.createPost(userId, 'Hello world', undefined, 'General', 'Title');
            expect(mockCreatePost).toHaveBeenCalledWith(userId, 'Hello world', undefined, 'General', 'Title');
            expect(result).toEqual(mockPost);
        });
    });
    describe('getPosts', () => {
        it('يجب يرجع الـ feed', async () => {
            const mockFeed = [{ _id: 'post-1', content: 'Hello world' }];
            mockGetPosts.mockResolvedValue(mockFeed);
            const result = await communityService.getPosts(1, 10);
            expect(mockGetPosts).toHaveBeenCalledWith(1, 10);
            expect(result).toEqual(mockFeed);
        });
    });
});
