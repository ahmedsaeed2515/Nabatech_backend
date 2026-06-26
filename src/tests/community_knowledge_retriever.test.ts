import mongoose from "mongoose";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./db.setup";
import DiagnosisHistory from "../models/diagnosis_history_model";
import CommunityPost from "../models/community_post_model";
import Comment from "../models/comment_model";
import SpecialistOffer from "../models/specialist_offer_model";
import User, { UserRole } from "../models/user_model";
import { retrieveCommunityContext } from "../services/ai/community_knowledge_retriever";

describe("Community Knowledge Retriever", () => {
  let userFarmerId: mongoose.Types.ObjectId;
  let userExpertId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await connectTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create test users
    const farmer = await User.create({
      email: "farmer@nabatech.com",
      passwordHash: "hash123",
      role: UserRole.USER,
      name: "Ahmed Saeed",
      status: "active"
    });
    userFarmerId = farmer._id as mongoose.Types.ObjectId;

    const expert = await User.create({
      email: "expert_ahmed@nabatech.com",
      passwordHash: "hash123",
      role: UserRole.EXPERT,
      name: "Dr. Ahmed",
      status: "active"
    });
    userExpertId = expert._id as mongoose.Types.ObjectId;
  });

  it("gathers statistics for a disease", async () => {
    // Seed diagnosis history
    await DiagnosisHistory.create([
      {
        user: userFarmerId,
        imageUrl: "http://example.com/img1.jpg",
        diseaseNameAr: "مرض ذبول الطماطم",
        diseaseNameEn: "Tomato_yellow_leaf_curl_virus",
        confidence: 0.95,
        feedbackStatus: "confirmed"
      },
      {
        user: userFarmerId,
        imageUrl: "http://example.com/img2.jpg",
        diseaseNameAr: "مرض ذبول الطماطم",
        diseaseNameEn: "Tomato_yellow_leaf_curl_virus",
        confidence: 0.88,
        feedbackStatus: "pending"
      },
      {
        user: userFarmerId,
        imageUrl: "http://example.com/img3.jpg",
        diseaseNameAr: "مرض ذبول الطماطم",
        diseaseNameEn: "Tomato_yellow_leaf_curl_virus",
        confidence: 0.72,
        feedbackStatus: "rejected"
      }
    ]);

    const result = await retrieveCommunityContext("Tomato_yellow_leaf_curl_virus");

    expect(result.meta.similarCasesCount).toBe(2); // confirmed + pending (not rejected)
    expect(result.meta.confirmedCount).toBe(1);
    expect(result.text).toContain("Similar cases in community: 2");
    expect(result.text).toContain("Confirmed cases of this disease: 1");
  });

  it("applies the trust hierarchy and masks PII", async () => {
    // 1. Seed Diagnosis
    const diag = await DiagnosisHistory.create({
      user: userFarmerId,
      imageUrl: "http://example.com/img1.jpg",
      diseaseNameAr: "مرض ذبول الطماطم",
      diseaseNameEn: "Tomato_yellow_leaf_curl_virus",
      confidence: 0.95,
      feedbackStatus: "confirmed"
    });

    // 2. Seed Community Post linked to diagnosis
    const post = await CommunityPost.create({
      author: userFarmerId,
      authorName: "Ahmed Saeed",
      plantTag: "Diagnosis",
      title: "My tomato plants have yellow curly leaves",
      content: "Please help, all my tomato plants are dying in the garden.",
      linkedDiagnosis: diag._id,
      status: "visible"
    });

    // 3. Seed Expert Comment (Medium Trust)
    await Comment.create({
      post: post._id,
      author: userExpertId,
      authorName: "Dr. Ahmed",
      text: "Apply neem oil to control whitefly vectors and isolate infected plants.",
      status: "visible"
    });

    // 4. Seed Normal User Comment (Low Trust)
    await Comment.create({
      post: post._id,
      author: userFarmerId,
      authorName: "Ahmed Saeed",
      text: "Try spraying with baking soda, it worked for me.",
      status: "visible"
    });

    // 5. Seed Accepted Specialist Offer (Highest Trust)
    await SpecialistOffer.create({
      post: post._id,
      specialist: userExpertId,
      specialistName: "Dr. Ahmed",
      farmer: userFarmerId,
      farmerName: "Ahmed Saeed",
      plan: "Isolate tomato plants, apply copper-based fungicide, and water only at the base.",
      price: 100,
      status: "accepted"
    });

    const result = await retrieveCommunityContext("Tomato_yellow_leaf_curl_virus");

    expect(result.hasData).toBe(true);
    expect(result.meta.acceptedOffersCount).toBe(1);
    expect(result.meta.expertCommentsCount).toBe(1);

    // Verify Trust Hierarchy order in output
    const text = result.text;
    expect(text).toContain("[TRUST RANK 1: VERIFIED EXPERT ACCEPTED CURE PLANS]");
    expect(text).toContain("Specialist Dr. Ahmed provided a custom curing plan that was ACCEPTED by the farmer:");
    expect(text).toContain("Cure Plan Details: \"Isolate tomato plants, apply copper-based fungicide, and water only at the base.\"");

    expect(text).toContain("[TRUST RANK 2: VERIFIED EXPERT RECOMMENDATIONS]");
    expect(text).toContain("Expert Dr. Ahmed recommended:");
    expect(text).toContain("\"Apply neem oil to control whitefly vectors and isolate infected plants.\"");

    expect(text).toContain("[TRUST RANK 3: ANONYMOUS PEER COMMENTS]");
    // Ahmed Saeed is normal user, so his name is masked
    expect(text).toContain("Farmer A. suggested:");
    expect(text).toContain("\"Try spraying with baking soda, it worked for me.\"");
    expect(text).not.toContain("Ahmed Saeed suggested:");

    expect(text).toContain("[TRUST RANK 4: RELATED DISCUSSION THREADS]");
    expect(text).toContain("Post by Farmer A. (Tag: Diagnosis): \"My tomato plants have yellow curly leaves\"");
  });

  it("falls back to keyword search for text queries", async () => {
    // 1. Seed community post
    await CommunityPost.create({
      author: userFarmerId,
      authorName: "Ahmed Saeed",
      plantTag: "Care Tips",
      title: "How to water basil plants",
      content: "Basil likes moist but not soggy soil. Water it when the top soil is dry.",
      status: "visible"
    });

    const result = await retrieveCommunityContext(undefined, "How often should I water my basil plant?");

    expect(result.hasData).toBe(true);
    expect(result.text).toContain("[TRUST RANK 4: RELATED DISCUSSION THREADS]");
    expect(result.text).toContain("How to water basil plants");
  });
});


