const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:10000/api/v1';

async function run() {
  console.log("Creating User A...");
  const userARes = await axios.post(`${BASE_URL}/auth/register`, {
    name: "User A", email: `usera_${Date.now()}@test.com`, password: "password123"
  });
  const tokenA = userARes.data.token;

  console.log("Creating User B...");
  const userBRes = await axios.post(`${BASE_URL}/auth/register`, {
    name: "User B", email: `userb_${Date.now()}@test.com`, password: "password123"
  });
  const tokenB = userBRes.data.token;

  const configA = { headers: { Authorization: `Bearer ${tokenA}` } };
  const configB = { headers: { Authorization: `Bearer ${tokenB}` } };

  // Phase 4: Create Post
  console.log("Creating Post...");
  const form = new FormData();
  form.append('title', 'Test Post');
  form.append('content', 'This is a test post');
  form.append('plantTag', 'general');

  const postRes = await axios.post(`${BASE_URL}/community/posts`, form, {
    headers: { ...configA.headers, ...form.getHeaders() }
  });
  const postId = postRes.data.data.post._id;
  console.log("Post Created:", postId);

  // Phase 2: Edit Post
  console.log("Editing Post...");
  const editForm = new FormData();
  editForm.append('title', 'Edited Test Post');
  editForm.append('content', 'Edited content');
  editForm.append('plantTag', 'general');
  
  await axios.put(`${BASE_URL}/community/posts/${postId}`, editForm, {
    headers: { ...configA.headers, ...editForm.getHeaders() }
  });
  console.log("Post Edited");

  // Phase 3: Save Post
  console.log("User B Saving Post...");
  await axios.post(`${BASE_URL}/community/posts/${postId}/save`, { saved: true }, configB);
  console.log("Post Saved");

  // Like Post
  console.log("User B Liking Post...");
  await axios.post(`${BASE_URL}/community/posts/${postId}/like`, { liked: true }, configB);
  console.log("Post Liked");

  // Comment
  console.log("User B Commenting...");
  const commentRes = await axios.post(`${BASE_URL}/community/posts/${postId}/comments`, { content: "Nice post!" }, configB);
  const commentId = commentRes.data.data.comment._id;
  console.log("Comment Added:", commentId);

  // Talk to Expert
  console.log("Requesting Consultation...");
  try {
    await axios.post(`${BASE_URL}/community/consultations`, { problemDescription: "Need help", post: postId }, configA);
    console.log("Consultation Requested");
  } catch (e) {
    console.error("Consultation error:", e.response?.data || e.message);
  }

  console.log("E2E Test Completed Successfully!");
}

run().catch(e => {
  if (e.response) {
    console.error("TEST FAILED (Response):", e.response.status, e.response.data);
  } else {
    console.error("TEST FAILED (Network/Other):", e.message);
  }
});
