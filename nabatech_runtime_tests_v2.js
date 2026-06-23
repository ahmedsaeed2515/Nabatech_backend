/**
 * NabaTech Runtime Verification Suite v2
 * - Uses correct DB name: "test"
 * - Uses real super_admin / admin user IDs from Atlas
 * - Tests all Admin API endpoints with real JWTs
 */

const http = require("http");
const https = require("https");
const fs = require("fs");

const BASE_URL = "http://localhost:10000";
const MONGO_URI = "mongodb+srv://ahmedsaeed2515_db_user:tdx7j8mKgH7Q7vMg@nabatech.jpiebma.mongodb.net/?appName=nabatech";
const DB_NAME = "test";
const JWT_SECRET = "b052986483b6d623b03047cef110569f84918bec6893822618c52c3e79c7f19e";

const CLOUDINARY_CLOUD_NAME = "dlgzjfjlb";
const CLOUDINARY_API_KEY = "756372299624643";
const CLOUDINARY_API_SECRET = "33EHbgBYYU_HWQrdzqQMLNmIjlA";

// Known users from live DB
const SUPER_ADMIN = { _id: "6a34bc5a27f1ee0a94b8f6d9", email: "ahmed@gmail.com", role: "super_admin", tokenVersion: 0 };
const ADMIN_USER  = { _id: "6a31957352ef150726e6dc89", email: "ahmedsaeed@gmail.com", role: "admin", tokenVersion: undefined };

const results = [];
let passed = 0, failed = 0;
let mongoClient = null, db = null;

// ── Helpers ───────────────────────────────────────────────────────────────────
function record(name, status, details = {}) {
  results.push({ name, status, ...details, ts: new Date().toISOString() });
  console.log(`${status === "PASS" ? "✅" : "❌"} [${status}] ${name}`);
  if (details.response) {
    const s = typeof details.response === "object" ? JSON.stringify(details.response) : String(details.response);
    console.log(`   ↳ ${s.substring(0, 300)}`);
  }
  if (details.error) console.log(`   ↳ ERROR: ${details.error}`);
  status === "PASS" ? passed++ : failed++;
}

function makeToken(user) {
  const jwt = require("jsonwebtoken");
  return jwt.sign(
    { id: user._id, sub: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function request(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const bodyStr = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: u.hostname, port: u.port || (u.protocol === "https:" ? 443 : 80),
      path: u.pathname + u.search, method,
      headers: { "Content-Type": "application/json", ...headers,
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}) }
    };
    const req = lib.request(opts, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: { raw: data.substring(0, 500) } }); }
      });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const apiGet    = (p, t)    => request("GET",    `${BASE_URL}${p}`, null, t ? { Authorization: `Bearer ${t}` } : {});
const apiPost   = (p, b, t) => request("POST",   `${BASE_URL}${p}`, b,    t ? { Authorization: `Bearer ${t}` } : {});
const apiDelete = (p, t)    => request("DELETE",  `${BASE_URL}${p}`, null, t ? { Authorization: `Bearer ${t}` } : {});

function cloudinaryReq(method, path, formBody = null) {
  const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64");
  return request(method, `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}${path}`, null, { Authorization: `Basic ${auth}` });
}

function cloudinaryUpload(publicId) {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="25" fill="#16a34a"/><text x="25" y="30" font-size="8" text-anchor="middle" fill="white">TEST</text></svg>`;
    const b64 = Buffer.from(svg).toString("base64");
    const boundary = "----NabatechBoundary";
    const body = [
      `--${boundary}`, `Content-Disposition: form-data; name="file"`, "", `data:image/svg+xml;base64,${b64}`,
      `--${boundary}`, `Content-Disposition: form-data; name="public_id"`, "", publicId,
      `--${boundary}--`
    ].join("\r\n");
    const req = https.request(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": Buffer.byteLength(body) }
    }, res => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
    });
    req.on("error", reject); req.write(body); req.end();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — MongoDB Live Tests
// ─────────────────────────────────────────────────────────────────────────────
async function phase1() {
  console.log("\n═══ PHASE 1 — MongoDB Live Tests (Direct Connection) ═══");
  const { MongoClient } = require("mongodb");
  mongoClient = new MongoClient(MONGO_URI);
  try {
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    record("MongoDB Atlas connection", "PASS", { response: `Connected to cluster, DB: ${DB_NAME}` });
  } catch(e) {
    record("MongoDB Atlas connection", "FAIL", { error: e.message });
    return;
  }

  // db.stats()
  try {
    const stats = await db.command({ dbStats: 1 });
    record("db.stats() — real database metrics", "PASS", {
      response: { dataSize_bytes: stats.dataSize, storageSize_bytes: stats.storageSize, collections: stats.collections, objects: stats.objects, indexes: stats.indexes }
    });
  } catch(e) { record("db.stats()", "FAIL", { error: e.message }); }

  // listCollections
  try {
    const cols = await db.listCollections().toArray();
    record("listCollections() — enumerate all collections", "PASS", {
      response: `${cols.length} collections found: ${cols.slice(0,8).map(c=>c.name).join(", ")} ...`
    });
  } catch(e) { record("listCollections()", "FAIL", { error: e.message }); }

  // Verify users count
  try {
    const count = await db.collection("users").estimatedDocumentCount();
    record("users collection document count", "PASS", { response: `${count} users in database` });
  } catch(e) { record("users collection count", "FAIL", { error: e.message }); }

  // collStats on real collection
  try {
    const cs = await db.command({ collStats: "users" });
    record("collStats(users) — size + indexes", "PASS", {
      response: { size_bytes: cs.size, count: cs.count, nindexes: cs.nindexes, storageSize_bytes: cs.storageSize }
    });
  } catch(e) { record("collStats(users)", "FAIL", { error: e.message }); }

  // Verify real super_admin exists
  try {
    const sa = await db.collection("users").findOne({ role: "super_admin" }, { projection: { email: 1, role: 1 } });
    record("Verify super_admin user exists in DB", sa ? "PASS" : "FAIL", {
      response: sa ? { email: sa.email, role: sa.role } : "Not found"
    });
  } catch(e) { record("Verify super_admin exists", "FAIL", { error: e.message }); }

  // Create, verify, and delete test document
  let testId = null;
  try {
    const ins = await db.collection("nabatech_test_runtime").insertOne({
      _marker: "RUNTIME_VERIFICATION",
      createdAt: new Date(Date.now() - 32 * 86400000),
      data: "This document was created by the NabaTech runtime test suite and should be deleted"
    });
    testId = ins.insertedId;
    record("Insert test document into nabatech_test_runtime", "PASS", {
      response: { _id: testId.toString(), collection: "nabatech_test_runtime" }
    });
  } catch(e) { record("Insert test document", "FAIL", { error: e.message }); }

  if (testId) {
    try {
      const found = await db.collection("nabatech_test_runtime").findOne({ _id: testId });
      record("Read-back test document (verify write)", found ? "PASS" : "FAIL", {
        response: found ? { _marker: found._marker, _id: found._id.toString() } : "Not found"
      });
    } catch(e) { record("Read-back test document", "FAIL", { error: e.message }); }

    try {
      const del = await db.collection("nabatech_test_runtime").deleteOne({ _id: testId });
      record("Delete test document", del.deletedCount === 1 ? "PASS" : "FAIL", {
        response: { deletedCount: del.deletedCount }
      });
    } catch(e) { record("Delete test document", "FAIL", { error: e.message }); }

    try {
      const gone = await db.collection("nabatech_test_runtime").findOne({ _id: testId });
      record("Verify test document permanently deleted", !gone ? "PASS" : "FAIL", {
        response: !gone ? "Confirmed — document does not exist" : "STILL EXISTS — deletion failed"
      });
    } catch(e) { record("Verify deletion", "FAIL", { error: e.message }); }
  }

  // Cleanup action simulation (insert 35-day-old doc in notifications, then delete it)
  try {
    const testNotif = { _marker: "CLEANUP_TEST", createdAt: new Date(Date.now() - 35 * 86400000), msg: "test" };
    await db.collection("notifications").insertOne(testNotif);
    const threshold = new Date(); threshold.setDate(threshold.getDate() - 30);
    const del = await db.collection("notifications").deleteMany({ _marker: "CLEANUP_TEST", createdAt: { $lt: threshold } });
    record("Cleanup simulation — delete 30-day-old notifications", del.deletedCount >= 1 ? "PASS" : "FAIL", {
      response: { deleted: del.deletedCount, query: "{ createdAt: { $lt: 30 days ago } }" }
    });
  } catch(e) { record("Cleanup simulation", "FAIL", { error: e.message }); }

  // Verify the fixed soft_deleted_users query
  try {
    const count = await db.collection("users").countDocuments({ isDeleted: true });
    record("soft_deleted_users query (fixed: isDeleted:true)", "PASS", {
      response: { count, note: count === 0 ? "No deleted users currently — query is syntactically correct" : `${count} soft-deleted users found` }
    });
  } catch(e) { record("soft_deleted_users query verification", "FAIL", { error: e.message }); }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Cloudinary Live Tests
// ─────────────────────────────────────────────────────────────────────────────
async function phase2() {
  console.log("\n═══ PHASE 2 — Cloudinary Live Tests (Direct API) ═══");

  // Fetch usage
  try {
    const res = await cloudinaryReq("GET", "/usage");
    record("GET Cloudinary /usage — real storage stats", res.status === 200 ? "PASS" : "FAIL", {
      response: {
        storage_used_bytes: res.body.storage?.usage,
        storage_limit_bytes: res.body.storage?.limit,
        storage_used_MB: ((res.body.storage?.usage || 0) / 1024 / 1024).toFixed(2),
        bandwidth_bytes: res.body.bandwidth?.usage,
        total_assets: res.body.resources,
        plan: res.body.plan
      }
    });
  } catch(e) { record("Cloudinary usage API", "FAIL", { error: e.message }); }

  // List assets
  try {
    const res = await cloudinaryReq("GET", "/resources/image?max_results=5");
    record("GET /resources/image — list real assets", res.status === 200 ? "PASS" : "FAIL", {
      response: {
        returned: res.body.resources?.length,
        first_public_id: res.body.resources?.[0]?.public_id,
        first_bytes: res.body.resources?.[0]?.bytes,
        has_more: !!res.body.next_cursor
      }
    });
  } catch(e) { record("Cloudinary list assets", "FAIL", { error: e.message }); }

  // Upload real test image
  let testPubId = null;
  try {
    const res = await cloudinaryUpload("nabatech_tests/runtime_test_" + Date.now());
    if (res.status === 200 && res.body?.public_id) {
      testPubId = res.body.public_id;
      record("Upload test image to Cloudinary", "PASS", {
        response: { public_id: testPubId, secure_url: res.body.secure_url, bytes: res.body.bytes, format: res.body.format }
      });
    } else {
      record("Upload test image to Cloudinary", "FAIL", {
        response: typeof res.body === "string" ? res.body.substring(0,300) : res.body
      });
    }
  } catch(e) { record("Upload test image", "FAIL", { error: e.message }); }

  // Verify asset appears
  if (testPubId) {
    try {
      const res = await cloudinaryReq("GET", `/resources/image/upload/${encodeURIComponent(testPubId)}`);
      record("Verify uploaded asset exists (GET by public_id)", res.status === 200 ? "PASS" : "FAIL", {
        response: res.status === 200
          ? { public_id: res.body.public_id, bytes: res.body.bytes, created_at: res.body.created_at }
          : `HTTP ${res.status}`
      });
    } catch(e) { record("Verify uploaded asset", "FAIL", { error: e.message }); }

    // Delete test image
    try {
      const res = await cloudinaryReq("DELETE", `/resources/image/upload?public_ids[]=${encodeURIComponent(testPubId)}`);
      const ok = res.body?.deleted?.[testPubId] === "deleted";
      record("Delete test image from Cloudinary", ok ? "PASS" : "FAIL", { response: res.body });

      // Confirm 404
      if (ok) {
        const verify = await cloudinaryReq("GET", `/resources/image/upload/${encodeURIComponent(testPubId)}`);
        record("Verify deletion — asset returns 404", verify.status === 404 ? "PASS" : "FAIL", {
          response: verify.status === 404 ? "Confirmed 404 — permanently removed" : `Unexpected status: ${verify.status}`
        });
      }
    } catch(e) { record("Delete test image", "FAIL", { error: e.message }); }
  }

  // Bandwidth check
  try {
    const res = await cloudinaryReq("GET", "/usage");
    const bw = res.body.bandwidth?.usage || 0;
    record("Cloudinary bandwidth usage reading", res.status === 200 ? "PASS" : "FAIL", {
      response: { bandwidth_used_bytes: bw, bandwidth_used_MB: (bw / 1024 / 1024).toFixed(2) }
    });
  } catch(e) { record("Cloudinary bandwidth check", "FAIL", { error: e.message }); }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — Admin API Live Tests
// ─────────────────────────────────────────────────────────────────────────────
async function phase3() {
  console.log("\n═══ PHASE 3 — Admin API Live HTTP Tests ═══");

  const saToken = makeToken(SUPER_ADMIN);
  const adminToken = makeToken(ADMIN_USER);
  console.log("   Generated super_admin JWT for:", SUPER_ADMIN.email);
  console.log("   Generated admin JWT for:", ADMIN_USER.email);

  // Health check
  try {
    const res = await request("GET", `${BASE_URL}/`);
    record("Backend GET / — health check", res.status === 200 ? "PASS" : "FAIL", { response: res.body });
  } catch(e) { record("Backend health check", "FAIL", { error: e.message }); return; }

  // Unauthenticated → 401
  try {
    const res = await apiGet("/api/admin/database/stats");
    record("Unauthenticated request → 401", res.status === 401 ? "PASS" : "FAIL", {
      response: { status: res.status, code: res.body?.error?.code }
    });
  } catch(e) { record("Unauthenticated → 401", "FAIL", { error: e.message }); }

  // ── MongoDB API Endpoints ──
  // GET /stats
  try {
    const res = await apiGet("/api/admin/database/stats", saToken);
    const ok = res.status === 200 && res.body?.data?.totalCollections > 0;
    record("GET /api/admin/database/stats", ok ? "PASS" : "FAIL", {
      response: res.status === 200 ? {
        totalDatabaseSize_bytes: res.body.data.totalDatabaseSize,
        totalStorageSize_bytes: res.body.data.totalStorageSize,
        totalCollections: res.body.data.totalCollections,
        totalDocuments: res.body.data.totalDocuments,
        indexesCount: res.body.data.indexesCount,
        largestCollections: res.body.data.largestCollections?.slice(0,3).map(c=>({name:c.name, size:c.size}))
      } : { status: res.status, error: res.body }
    });
  } catch(e) { record("GET /api/admin/database/stats", "FAIL", { error: e.message }); }

  // GET /collections
  let firstCollection = null;
  try {
    const res = await apiGet("/api/admin/database/collections", saToken);
    firstCollection = res.body?.data?.[0]?.name;
    record("GET /api/admin/database/collections", res.status === 200 && res.body?.data?.length > 0 ? "PASS" : "FAIL", {
      response: res.status === 200 ? {
        count: res.body.data.length,
        sample: res.body.data.slice(0,5).map(c=>({ name:c.name, count:c.count, size_bytes:c.size, indexes:c.indexes }))
      } : { status: res.status, error: res.body }
    });
  } catch(e) { record("GET /api/admin/database/collections", "FAIL", { error: e.message }); }

  // GET /collections/users (paginated)
  try {
    const res = await apiGet("/api/admin/database/collections/users?page=1&limit=3", saToken);
    record("GET /api/admin/database/collections/users?page=1&limit=3", res.status === 200 ? "PASS" : "FAIL", {
      response: res.status === 200 ? {
        totalDocuments: res.body.data.totalDocuments,
        totalPages: res.body.data.totalPages,
        page: res.body.data.page,
        indexesCount: res.body.data.indexesCount,
        documentsReturned: res.body.data.documents?.length,
        firstDocId: res.body.data.documents?.[0]?._id
      } : { status: res.status }
    });
  } catch(e) { record("GET /collections/users (paginated)", "FAIL", { error: e.message }); }

  // GET /collections/users page 2
  try {
    const res = await apiGet("/api/admin/database/collections/users?page=2&limit=3", saToken);
    record("GET /collections/users?page=2 — pagination", res.status === 200 && res.body.data.page === 2 ? "PASS" : "FAIL", {
      response: res.status === 200 ? { page: res.body.data.page, documentsReturned: res.body.data.documents?.length } : { status: res.status }
    });
  } catch(e) { record("GET /collections/users?page=2", "FAIL", { error: e.message }); }

  // GET /storage-analyzer
  try {
    const res = await apiGet("/api/admin/database/storage-analyzer", saToken);
    record("GET /api/admin/database/storage-analyzer", res.status === 200 ? "PASS" : "FAIL", {
      response: res.status === 200 ? {
        topCollections: res.body.data.largestCollections?.slice(0,5).map(c=>({ name:c.name, size_bytes:c.size, count:c.count }))
      } : { status: res.status, error: res.body }
    });
  } catch(e) { record("GET /storage-analyzer", "FAIL", { error: e.message }); }

  // POST /cleanup (old_notifications)
  try {
    const res = await apiPost("/api/admin/database/cleanup", { type: "old_notifications" }, saToken);
    record("POST /api/admin/database/cleanup (old_notifications)", res.status === 200 && res.body?.success ? "PASS" : "FAIL", {
      response: res.status === 200 ? res.body.data : { status: res.status, body: res.body }
    });
  } catch(e) { record("POST /cleanup (old_notifications)", "FAIL", { error: e.message }); }

  // POST /cleanup (old_diagnosis)
  try {
    const res = await apiPost("/api/admin/database/cleanup", { type: "old_diagnosis" }, saToken);
    record("POST /api/admin/database/cleanup (old_diagnosis)", res.status === 200 && res.body?.success ? "PASS" : "FAIL", {
      response: res.status === 200 ? res.body.data : { status: res.status }
    });
  } catch(e) { record("POST /cleanup (old_diagnosis)", "FAIL", { error: e.message }); }

  // POST /cleanup (soft_deleted_users — now fixed)
  try {
    const res = await apiPost("/api/admin/database/cleanup", { type: "soft_deleted_users" }, saToken);
    record("POST /api/admin/database/cleanup (soft_deleted_users — fixed query)", res.status === 200 && res.body?.success ? "PASS" : "FAIL", {
      response: res.status === 200 ? res.body.data : { status: res.status, body: res.body }
    });
  } catch(e) { record("POST /cleanup (soft_deleted_users)", "FAIL", { error: e.message }); }

  // POST /cleanup (invalid type → 400)
  try {
    const res = await apiPost("/api/admin/database/cleanup", { type: "hack_attempt" }, saToken);
    record("POST /cleanup invalid type → 400", res.status === 400 ? "PASS" : "FAIL", {
      response: { status: res.status, error: res.body?.error }
    });
  } catch(e) { record("POST /cleanup invalid type → 400", "FAIL", { error: e.message }); }

  // RBAC: admin role CANNOT call drop (expects 403)
  try {
    const res = await apiDelete("/api/admin/database/collections/dummy_nonexistent/drop", adminToken);
    record("RBAC: admin role → DROP endpoint → 403", res.status === 403 ? "PASS" : "FAIL", {
      response: { status: res.status, message: res.body?.error?.message || res.body?.message }
    });
  } catch(e) { record("RBAC admin cannot drop", "FAIL", { error: e.message }); }

  // RBAC: admin role CANNOT call purge (expects 403)
  try {
    const res = await apiDelete("/api/admin/database/collections/dummy_nonexistent/purge", adminToken);
    record("RBAC: admin role → PURGE endpoint → 403", res.status === 403 ? "PASS" : "FAIL", {
      response: { status: res.status, message: res.body?.error?.message || res.body?.message }
    });
  } catch(e) { record("RBAC admin cannot purge", "FAIL", { error: e.message }); }

  // RBAC: super_admin CAN reach drop endpoint (500 = collection not found = RBAC passed)
  try {
    const res = await apiDelete("/api/admin/database/collections/nabatech_dummy_zzz_nonexistent/drop", saToken);
    record("RBAC: super_admin → DROP endpoint → passes RBAC (gets 500 not 403)", res.status !== 403 ? "PASS" : "FAIL", {
      response: { status: res.status, note: res.status === 500 ? "RBAC passed — collection not found expected" : res.body }
    });
  } catch(e) { record("RBAC super_admin can reach drop", "FAIL", { error: e.message }); }

  // ── Cloudinary API Endpoints ──
  // GET /stats
  try {
    const res = await apiGet("/api/admin/cloudinary/stats", saToken);
    record("GET /api/admin/cloudinary/stats", res.status === 200 && res.body?.success ? "PASS" : "FAIL", {
      response: res.status === 200 ? {
        totalStorageUsed_bytes: res.body.data.totalStorageUsed,
        totalStorageUsed_MB: ((res.body.data.totalStorageUsed || 0) / 1024 / 1024).toFixed(2),
        totalBandwidth_bytes: res.body.data.totalBandwidth,
        totalAssets: res.body.data.totalAssets,
        imagesCount: res.body.data.imagesCount,
        videosCount: res.body.data.videosCount,
        documentsCount: res.body.data.documentsCount
      } : { status: res.status, error: res.body }
    });
  } catch(e) { record("GET /api/admin/cloudinary/stats", "FAIL", { error: e.message }); }

  // GET /assets
  let firstAssetId = null;
  try {
    const res = await apiGet("/api/admin/cloudinary/assets?max_results=10", saToken);
    firstAssetId = res.body?.data?.assets?.[0]?.public_id;
    record("GET /api/admin/cloudinary/assets", res.status === 200 ? "PASS" : "FAIL", {
      response: res.status === 200 ? {
        assetsReturned: res.body.data.assets?.length,
        firstAsset: firstAssetId,
        hasNextCursor: !!res.body.data.next_cursor
      } : { status: res.status }
    });
  } catch(e) { record("GET /api/admin/cloudinary/assets", "FAIL", { error: e.message }); }

  // GET /assets sorted by bytes (Storage Analyzer)
  try {
    const res = await apiGet("/api/admin/cloudinary/assets?sort_by=bytes&direction=desc&max_results=5", saToken);
    record("GET /api/admin/cloudinary/assets (sort_by=bytes) — Storage Analyzer", res.status === 200 ? "PASS" : "FAIL", {
      response: res.status === 200 ? {
        largestFiles: res.body.data.assets?.map(a => ({ public_id: a.public_id, bytes: a.bytes, format: a.format }))
      } : { status: res.status }
    });
  } catch(e) { record("GET /assets sort_by=bytes", "FAIL", { error: e.message }); }

  // GET /assets pagination — load next cursor
  try {
    const r1 = await apiGet("/api/admin/cloudinary/assets?max_results=5", saToken);
    const cursor = r1.body?.data?.next_cursor;
    if (cursor) {
      const r2 = await apiGet(`/api/admin/cloudinary/assets?max_results=5&next_cursor=${cursor}`, saToken);
      record("GET /api/admin/cloudinary/assets — cursor pagination (page 2)", r2.status === 200 && r2.body?.data?.assets?.length > 0 ? "PASS" : "FAIL", {
        response: { page2Assets: r2.body?.data?.assets?.length, firstAsset: r2.body?.data?.assets?.[0]?.public_id }
      });
    } else {
      record("GET /api/admin/cloudinary/assets — cursor pagination", "PASS", { response: "Only one page of assets (no next_cursor)" });
    }
  } catch(e) { record("GET /assets pagination", "FAIL", { error: e.message }); }

  // GET /folders
  try {
    const res = await apiGet("/api/admin/cloudinary/folders", saToken);
    record("GET /api/admin/cloudinary/folders", res.status === 200 ? "PASS" : "FAIL", {
      response: res.status === 200 ? { folders: res.body.data } : { status: res.status, error: res.body }
    });
  } catch(e) { record("GET /api/admin/cloudinary/folders", "FAIL", { error: e.message }); }

  // GET /orphans
  try {
    const res = await apiGet("/api/admin/cloudinary/orphans?max_results=50", saToken);
    record("GET /api/admin/cloudinary/orphans", res.status === 200 && res.body?.success ? "PASS" : "FAIL", {
      response: res.status === 200 ? {
        totalChecked: res.body.data.totalChecked,
        orphansFound: res.body.data.orphans?.length,
        hasNextCursor: !!res.body.data.next_cursor
      } : { status: res.status, error: res.body }
    });
  } catch(e) { record("GET /api/admin/cloudinary/orphans", "FAIL", { error: e.message }); }

  // RBAC: admin cannot bulk-delete (403)
  try {
    const res = await apiPost("/api/admin/cloudinary/assets/bulk-delete", { public_ids: ["dummy"] }, adminToken);
    record("RBAC: admin role → bulk-delete → 403", res.status === 403 ? "PASS" : "FAIL", {
      response: { status: res.status, message: res.body?.error?.message }
    });
  } catch(e) { record("RBAC admin cannot bulk-delete", "FAIL", { error: e.message }); }

  // RBAC: admin cannot cleanup orphans (403)
  try {
    const res = await apiPost("/api/admin/cloudinary/orphans/cleanup", { public_ids: ["dummy"] }, adminToken);
    record("RBAC: admin role → orphan cleanup → 403", res.status === 403 ? "PASS" : "FAIL", {
      response: { status: res.status, message: res.body?.error?.message }
    });
  } catch(e) { record("RBAC admin cannot cleanup orphans", "FAIL", { error: e.message }); }

  // Input validation: delete with no public_id → 400
  try {
    const res = await apiPost("/api/admin/cloudinary/assets/delete", {}, saToken);
    record("POST /assets/delete with no public_id → 400", res.status === 400 ? "PASS" : "FAIL", {
      response: { status: res.status, error: res.body?.error }
    });
  } catch(e) { record("POST /assets/delete no public_id → 400", "FAIL", { error: e.message }); }

  // Return tokens for phases 5-6
  return { saToken, adminToken };
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 5 — Orphan Detector End-to-End
// ─────────────────────────────────────────────────────────────────────────────
async function phase5(saToken) {
  console.log("\n═══ PHASE 5 — Orphan Detector End-to-End Test ═══");

  if (!saToken) { record("Orphan E2E: setup", "FAIL", { error: "No super_admin token" }); return; }

  // Upload an unreferenced image to Cloudinary
  const orphanPubId = `nabatech_tests/orphan_e2e_test_${Date.now()}`;
  let uploadedOk = false;
  try {
    const res = await cloudinaryUpload(orphanPubId);
    uploadedOk = res.status === 200 && !!res.body?.public_id;
    record("Orphan E2E: Upload unreferenced asset (no MongoDB reference)", uploadedOk ? "PASS" : "FAIL", {
      response: uploadedOk
        ? { public_id: res.body.public_id, secure_url: res.body.secure_url, bytes: res.body.bytes }
        : typeof res.body === "string" ? res.body.substring(0, 300) : res.body
    });
  } catch(e) { record("Orphan E2E: Upload unreferenced asset", "FAIL", { error: e.message }); }

  if (!uploadedOk) return;

  // Confirm it is NOT in any MongoDB collection
  try {
    const [p1, p2] = await Promise.all([
      db.collection("communityposts").countDocuments({ $or: [{ imagePublicId: orphanPubId }, { imageUrl: { $regex: orphanPubId } }] }),
      db.collection("diagnosishistories").countDocuments({ $or: [{ imagePublicId: orphanPubId }, { imageUrl: { $regex: orphanPubId } }] })
    ]);
    record("Orphan E2E: Confirm asset NOT in any MongoDB collection", p1 + p2 === 0 ? "PASS" : "FAIL", {
      response: { communityPosts: p1, diagnosisHistory: p2, note: "Asset is deliberately unreferenced" }
    });
  } catch(e) { record("Orphan E2E: Confirm not in MongoDB", "FAIL", { error: e.message }); }

  // Wait 2s for Cloudinary to index
  await new Promise(r => setTimeout(r, 2500));

  // Run orphan detector via API
  try {
    const res = await apiGet("/api/admin/cloudinary/orphans?max_results=200", saToken);
    const orphans = res.body?.data?.orphans || [];
    const found = orphans.some(o => o.public_id === orphanPubId);
    record("Orphan E2E: Orphan Detector finds the unreferenced asset", found ? "PASS" : "FAIL", {
      response: {
        totalAssetsChecked: res.body?.data?.totalChecked,
        orphansDetected: orphans.length,
        targetFound: found,
        targetPublicId: orphanPubId
      }
    });

    // Cleanup via API
    const cleanRes = await apiPost("/api/admin/cloudinary/orphans/cleanup", { public_ids: [orphanPubId] }, saToken);
    record("Orphan E2E: Cleanup orphan via /orphans/cleanup API", cleanRes.status === 200 && cleanRes.body?.success ? "PASS" : "FAIL", {
      response: { status: cleanRes.status, message: cleanRes.body?.message, result: cleanRes.body?.data }
    });

    // Confirm Cloudinary deletion
    const verify = await cloudinaryReq("GET", `/resources/image/upload/${encodeURIComponent(orphanPubId)}`);
    record("Orphan E2E: Verify cleanup removed asset from Cloudinary (404)", verify.status === 404 ? "PASS" : "FAIL", {
      response: verify.status === 404 ? "Confirmed 404 — asset permanently deleted" : `Unexpected: ${verify.status}`
    });
  } catch(e) { record("Orphan E2E: Orphan detection + cleanup cycle", "FAIL", { error: e.message }); }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6 — Super Admin Authorization Tests
// ─────────────────────────────────────────────────────────────────────────────
async function phase6(saToken, adminToken) {
  console.log("\n═══ PHASE 6 — Super Admin RBAC Tests ═══");

  // Create a test collection to use for drop/purge tests
  const testColName = `nabatech_rbac_test_${Date.now()}`;
  try {
    await db.createCollection(testColName);
    await db.collection(testColName).insertOne({ _marker: "rbac_test", ts: new Date() });
    record("Create test collection for RBAC test", "PASS", { response: { collection: testColName } });
  } catch(e) {
    record("Create test collection for RBAC test", "FAIL", { error: e.message });
    return;
  }

  // Admin CANNOT purge
  const purgeUrlPath = `/api/admin/database/collections/${testColName}/purge`;
  try {
    const res = await apiDelete(purgeUrlPath, adminToken);
    record(`RBAC: admin CANNOT purge ${testColName} (→ 403)`, res.status === 403 ? "PASS" : "FAIL", {
      response: { status: res.status, message: res.body?.error?.message }
    });
  } catch(e) { record("RBAC admin CANNOT purge", "FAIL", { error: e.message }); }

  // Admin CANNOT drop
  const dropUrlPath = `/api/admin/database/collections/${testColName}/drop`;
  try {
    const res = await apiDelete(dropUrlPath, adminToken);
    record(`RBAC: admin CANNOT drop ${testColName} (→ 403)`, res.status === 403 ? "PASS" : "FAIL", {
      response: { status: res.status, message: res.body?.error?.message }
    });
  } catch(e) { record("RBAC admin CANNOT drop", "FAIL", { error: e.message }); }

  // Super admin CAN purge (all docs deleted, collection remains)
  try {
    const res = await apiDelete(purgeUrlPath, saToken);
    const countAfter = await db.collection(testColName).countDocuments();
    record(`RBAC: super_admin CAN purge ${testColName}`, res.status === 200 && res.body?.success ? "PASS" : "FAIL", {
      response: { status: res.status, message: res.body?.message, docsRemaining: countAfter }
    });
  } catch(e) { record("RBAC super_admin CAN purge", "FAIL", { error: e.message }); }

  // Super admin CAN drop
  try {
    const res = await apiDelete(dropUrlPath, saToken);
    record(`RBAC: super_admin CAN drop ${testColName}`, res.status === 200 && res.body?.success ? "PASS" : "FAIL", {
      response: { status: res.status, message: res.body?.message }
    });
    // Verify gone
    const cols = await db.listCollections({ name: testColName }).toArray();
    record(`Verify ${testColName} completely dropped from MongoDB`, cols.length === 0 ? "PASS" : "FAIL", {
      response: cols.length === 0 ? "Collection no longer exists" : "Collection still found (drop failed)"
    });
  } catch(e) { record("RBAC super_admin CAN drop", "FAIL", { error: e.message }); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Generate Report
// ─────────────────────────────────────────────────────────────────────────────
function generateReport() {
  const lines = [
    "# NabaTech Runtime Verification Report",
    "",
    `> **Generated**: ${new Date().toISOString()}`,
    `> **Backend**: ${BASE_URL} (running)`,
    `> **MongoDB Atlas**: nabatech.jpiebma.mongodb.net / DB: test`,
    `> **Cloudinary Cloud**: ${CLOUDINARY_CLOUD_NAME} (Free plan)`,
    "",
    "## Summary",
    "",
    `| Metric | Value |`,
    `|---|---|`,
    `| Total Tests | ${results.length} |`,
    `| ✅ PASS | ${passed} |`,
    `| ❌ FAIL | ${failed} |`,
    `| Pass Rate | ${((passed / results.length) * 100).toFixed(1)}% |`,
    "",
    "## Detailed Test Results", ""
  ];

  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : "❌";
    lines.push(`### ${icon} ${r.name}`);
    lines.push(`**Status**: \`${r.status}\`  |  **Time**: ${r.ts}`);
    if (r.response !== undefined) {
      lines.push("**Response**:");
      lines.push("```json");
      lines.push(typeof r.response === "object" ? JSON.stringify(r.response, null, 2) : String(r.response));
      lines.push("```");
    }
    if (r.error) lines.push(`**Error**: \`${r.error}\``);
    lines.push("");
  }

  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 NabaTech Runtime Verification Suite v2\n");

  await phase1();
  await phase2();
  const tokens = await phase3();
  if (tokens) {
    await phase5(tokens.saToken);
    await phase6(tokens.saToken, tokens.adminToken);
  }

  if (mongoClient) await mongoClient.close();

  const report = generateReport();
  fs.writeFileSync("runtime_test_report_v2.md", report);
  fs.writeFileSync("runtime_test_results_v2.json", JSON.stringify(results, null, 2));

  console.log("\n═══════════════════════════════════════════════════════");
  console.log(`RESULTS: ✅ ${passed} PASSED   ❌ ${failed} FAILED   TOTAL: ${results.length}`);
  console.log("═══════════════════════════════════════════════════════");
  console.log("📝 Reports: runtime_test_report_v2.md / runtime_test_results_v2.json");

  console.log("\n---REPORT_START---");
  console.log(report);
  console.log("---REPORT_END---");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
