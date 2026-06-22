"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteOnPoll = void 0;
const community_poll_model_1 = __importDefault(require("../models/community_poll_model"));
const community_poll_option_model_1 = __importDefault(require("../models/community_poll_option_model"));
const community_poll_vote_model_1 = __importDefault(require("../models/community_poll_vote_model"));
const logger_1 = require("../utils/logger");
// @desc    Vote on a poll
// @route   POST /api/community/polls/:pollId/vote
// @access  Private
const voteOnPoll = async (req, res) => {
    try {
        const userId = req.user.id;
        const pollId = req.params.pollId;
        const { optionId } = req.body;
        if (!optionId) {
            return res.status(400).json({ error: "Option ID is required", errorCode: "VALIDATION_FAILED" });
        }
        const poll = await community_poll_model_1.default.findById(pollId);
        if (!poll) {
            return res.status(404).json({ error: "Poll not found", errorCode: "RESOURCE_NOT_FOUND" });
        }
        const option = await community_poll_option_model_1.default.findOne({ _id: optionId, poll: pollId });
        if (!option) {
            return res.status(404).json({ error: "Poll option not found", errorCode: "RESOURCE_NOT_FOUND" });
        }
        const existingVote = await community_poll_vote_model_1.default.findOne({ poll: pollId, user: userId });
        if (existingVote) {
            return res.status(400).json({ error: "You have already voted on this poll", errorCode: "ALREADY_VOTED" });
        }
        // Record vote
        await community_poll_vote_model_1.default.create({
            poll: pollId,
            option: optionId,
            user: userId,
        });
        // Increment counts
        await community_poll_option_model_1.default.updateOne({ _id: optionId }, { $inc: { votes: 1 } });
        await community_poll_model_1.default.updateOne({ _id: pollId }, { $inc: { totalVotes: 1 } });
        // Fetch updated poll
        const updatedPoll = await community_poll_model_1.default.findById(pollId);
        const options = await community_poll_option_model_1.default.find({ poll: pollId }).sort({ sortOrder: 1 });
        res.status(200).json({
            data: {
                poll: {
                    id: updatedPoll._id.toString(),
                    question: updatedPoll.question,
                    options: options.map(o => ({
                        id: o._id.toString(),
                        text: o.text,
                        votes: o.votes
                    })),
                    userVotedOptionId: optionId,
                    totalVotes: updatedPoll.totalVotes
                }
            }
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "You have already voted on this poll", errorCode: "ALREADY_VOTED" });
        }
        logger_1.logger.error('Failed to vote on poll', { error });
        res.status(500).json({ message: "Failed to vote on poll" });
    }
};
exports.voteOnPoll = voteOnPoll;
