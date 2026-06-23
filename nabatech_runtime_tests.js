/**
 * NabaTech Runtime Verification Suite
 * Tests MongoDB Admin Center + Cloudinary Admin Center
 * against LIVE APIs with real credentials.
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// ─── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:10000";
const MONGO_URI =
  "mongodb+srv://ahmedsaeed2515_db_user:tdx7j8mKgH7Q7vMg@nabatech.jpiebma.mongodb.net/?appName=nabatech";
const CLOUDINARY_CLOUD_NAME = "dlgzjfjlb";
const CLOUDINARY_API_KEY = "756372299624643";
const CLOUDINARY_API_SECRET = "33EHbgBYYU_HWQrdzqQMLNmIjlA";

let adminToken = null;
let superAdminToken = null;

// ─── Test Result Tracker ────────────────────────────────────────────────────────
const results = [];
let passed = 0;
let failed = 0;

function record(name, status, details = {}) {
  const r = { name, status, ...details, timestamp: new Date().toISOString() };
  results.push(r);
  const icon = status === "PASS" ? "✅" : "❌";
  console.log(`${icon} [${status}] ${name}`);
  if (details.response) {
    const preview =
      typeof details.response === "object"
        ? JSON.stringify(details.response).substring(0, 200)
        : String(details.response).substring(0, 200);
    console.log(`       Response: ${preview}`);
  }
  if (details.error) console.log(`       Error: ${details.error}`);
  if (status === "PASS") passed++;
  else failed++;
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────
function request(method, url, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const lib = parsedUrl.protocol === "https:" ? https : http;
    const bodyStr = body ? JSON.stringify(body) : null;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });

    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function apiGet(path, token) {
  return request("GET", `${BASE_URL}${path}`, null, token ? { Authorization: `Bearer ${token}` } : {});
}

function apiPost(path, body, token) {
  return request("POST", `${BASE_URL}${path}`, body, token ? { Authorization: `Bearer ${token}` } : {});
}

function apiDelete(path, token) {
  return request("DELETE", `${BASE_URL}${path}`, null, token ? { Authorization: `Bearer ${token}` } : {});
}

// ─── Cloudinary Direct API ─────────────────────────────────────────────────────
function cloudinaryRequest(method, cloudinaryPath, body = null) {
  const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64");
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}${cloudinaryPath}`;
  return request(method, url, body, { Authorization: `Basic ${auth}` });
}

// ─── MongoDB Direct Connection ─────────────────────────────────────────────────
let mongoClient = null;
let db = null;

async function connectMongo() {
  try {
    const { MongoClient } = require("mongodb");
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    db = mongoClient.db("nabatech");
    console.log("🔌 MongoDB connected directly");
    return true;
  } catch (e) {
    console.error("MongoDB direct connect failed:", e.message);
    return false;
  }
}

async function disconnectMongo() {
  if (mongoClient) await mongoClient.close();
}

// ─── Login Helper ─────────────────────────────────────────────────────────────
async function login(email, password) {
  const res = await apiPost("/api/auth/admin/login", { email, password });
  return res.body?.data?.accessToken || res.body?.data?.token || null;
}

// ──────────────────────────────────────────────────────────────────────────────
// PHASE 1: MongoDB Live Tests (Direct Connection)
// ──────────────────────────────────────────────────────────────────────────────
async function phase1_mongoLive() {
  console.log("\n══════════════════════════════════════════════");
  console.log("PHASE 1 — MongoDB Live Tests (Direct)");
  console.log("══════════════════════════════════════════════");

  const connected = await connectMongo();
  if (!connected) {
    record("MongoDB Direct Connection", "FAIL", { error: "Cannot connect to MongoDB" });
    return;
  }
  record("MongoDB Direct Connection", "PASS", { response: "Connected to nabatech.jpiebma.mongodb.net" });

  // db.stats()
  try {
    const stats = await db.command({ dbStats: 1 });
    record("db.stats() execution", "PASS", {
      response: {
        dataSize: stats.dataSize,
        storageSize: stats.storageSize,
        collections: stats.collections,
        objects: stats.objects,
        indexes: stats.indexes,
      },
    });
  } catch (e) {
    record("db.stats() execution", "FAIL", { error: e.message });
  }

  // List collections
  try {
    const cols = await db.listCollections().toArray();
    record("listCollections()", "PASS", {
      response: `${cols.length} collections: ${cols
        .slice(0, 10)
        .map((c) => c.name)
        .join(", ")} ...`,
    });
  } catch (e) {
    record("listCollections()", "FAIL", { error: e.message });
  }

  // Collection count verification (users)
  try {
    const count = await db.collection("users").estimatedDocumentCount();
    record("Verify users collection count", "PASS", {
      response: `users collection has ${count} documents`,
    });
  } catch (e) {
    record("Verify users collection count", "FAIL", { error: e.message });
  }

  // collStats on users
  try {
    const cs = await db.command({ collStats: "users" });
    record("collStats on users collection", "PASS", {
      response: { size: cs.size, count: cs.count, nindexes: cs.nindexes },
    });
  } catch (e) {
    record("collStats on users collection", "FAIL", { error: e.message });
  }

  // Create test document
  let testDocId = null;
  try {
    const testDoc = {
      _testMarker: "NABATECH_RUNTIME_TEST",
      createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
      data: "runtime verification test document",
    };
    const insertResult = await db.collection("nabatech_test_runtime").insertOne(testDoc);
    testDocId = insertResult.insertedId;
    record("Create test document in MongoDB", "PASS", {
      response: { insertedId: testDocId.toString(), collection: "nabatech_test_runtime" },
    });
  } catch (e) {
    record("Create test document in MongoDB", "FAIL", { error: e.message });
  }

  // Verify test document exists
  if (testDocId) {
    try {
      const found = await db
        .collection("nabatech_test_runtime")
        .findOne({ _id: testDocId });
      record("Verify test document exists", found ? "PASS" : "FAIL", {
        response: found ? `Found: ${found._testMarker}` : "Not found",
      });
    } catch (e) {
      record("Verify test document exists", "FAIL", { error: e.message });
    }

    // Delete test document
    try {
      const delResult = await db
        .collection("nabatech_test_runtime")
        .deleteOne({ _id: testDocId });
      record("Delete test document from MongoDB", delResult.deletedCount === 1 ? "PASS" : "FAIL", {
        response: { deletedCount: delResult.deletedCount },
      });
    } catch (e) {
      record("Delete test document", "FAIL", { error: e.message });
    }

    // Verify deletion
    try {
      const afterDelete = await db
        .collection("nabatech_test_runtime")
        .findOne({ _id: testDocId });
      record("Verify test document deleted", !afterDelete ? "PASS" : "FAIL", {
        response: afterDelete ? "STILL EXISTS (deletion failed)" : "Confirmed deleted",
      });
    } catch (e) {
      record("Verify test document deletion", "FAIL", { error: e.message });
    }
  }

  // Test cleanup simulation — insert 30-day-old notification and verify deleteMany works
  try {
    const testNotif = {
      _testMarker: "NABATECH_CLEANUP_TEST",
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      message: "old test notification",
    };
    const ins = await db.collection("notifications").insertOne(testNotif);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const del = await db
      .collection("notifications")
      .deleteMany({ _testMarker: "NABATECH_CLEANUP_TEST", createdAt: { $lt: thirtyDaysAgo } });
    record("Cleanup simulation (old_notifications)", del.deletedCount >= 1 ? "PASS" : "FAIL", {
      response: { inserted: ins.insertedId.toString(), deleted: del.deletedCount },
    });
  } catch (e) {
    record("Cleanup simulation (old_notifications)", "FAIL", { error: e.message });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PHASE 2: Cloudinary Live Tests (Direct API)
// ──────────────────────────────────────────────────────────────────────────────
async function phase2_cloudinaryLive() {
  console.log("\n══════════════════════════════════════════════");
  console.log("PHASE 2 — Cloudinary Live Tests (Direct API)");
  console.log("══════════════════════════════════════════════");

  // Fetch usage stats
  let storageUsed = 0;
  try {
    const res = await cloudinaryRequest("GET", "/usage");
    if (res.status === 200 && res.body) {
      storageUsed = res.body.storage?.usage || 0;
      record("Cloudinary usage API", "PASS", {
        response: {
          storage_usage_bytes: res.body.storage?.usage,
          storage_limit_bytes: res.body.storage?.limit,
          bandwidth_usage_bytes: res.body.bandwidth?.usage,
          resources: res.body.resources,
          plan: res.body.plan,
        },
      });
    } else {
      record("Cloudinary usage API", "FAIL", { response: res.body, error: `HTTP ${res.status}` });
    }
  } catch (e) {
    record("Cloudinary usage API", "FAIL", { error: e.message });
  }

  // Fetch asset list
  let assetCount = 0;
  try {
    const res = await cloudinaryRequest("GET", "/resources/image?max_results=10");
    if (res.status === 200 && res.body?.resources) {
      assetCount = res.body.resources.length;
      record("Cloudinary list assets (GET /resources/image)", "PASS", {
        response: {
          assets_returned: assetCount,
          first_asset: res.body.resources[0]?.public_id || "none",
          next_cursor: res.body.next_cursor || "none",
        },
      });
    } else {
      record("Cloudinary list assets", "FAIL", { error: `HTTP ${res.status}`, response: res.raw?.substring(0, 200) });
    }
  } catch (e) {
    record("Cloudinary list assets", "FAIL", { error: e.message });
  }

  // Upload test image (upload via URL)
  let testPublicId = null;
  try {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64");
    
    // Use FormData-like approach via URL-encoded body for a simple test upload
    const boundary = "----NabatechTestBoundary";
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#22c55e"/><text x="50" y="55" font-size="12" text-anchor="middle" fill="white">NABATECH TEST</text></svg>`;
    
    const bodyParts = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"`,
      "",
      `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="public_id"`,
      "",
      "nabatech_runtime_test_image",
      `--${boundary}`,
      `Content-Disposition: form-data; name="folder"`,
      "",
      "nabatech_tests",
      `--${boundary}--`,
    ].join("\r\n");

    const uploadResult = await new Promise((resolve, reject) => {
      const req = https.request(
        uploadUrl,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": Buffer.byteLength(bodyParts),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
            catch { resolve({ status: res.statusCode, body: data }); }
          });
        }
      );
      req.on("error", reject);
      req.write(bodyParts);
      req.end();
    });

    if (uploadResult.status === 200 && uploadResult.body?.public_id) {
      testPublicId = uploadResult.body.public_id;
      record("Upload test image to Cloudinary", "PASS", {
        response: {
          public_id: uploadResult.body.public_id,
          secure_url: uploadResult.body.secure_url,
          bytes: uploadResult.body.bytes,
          format: uploadResult.body.format,
        },
      });
    } else {
      record("Upload test image to Cloudinary", "FAIL", {
        error: `HTTP ${uploadResult.status}`,
        response: typeof uploadResult.body === "string" ? uploadResult.body.substring(0, 300) : uploadResult.body,
      });
    }
  } catch (e) {
    record("Upload test image to Cloudinary", "FAIL", { error: e.message });
  }

  // Verify asset appears
  if (testPublicId) {
    try {
      const res = await cloudinaryRequest("GET", `/resources/image/upload/${encodeURIComponent(testPublicId)}`);
      record("Verify test image exists in Cloudinary", res.status === 200 ? "PASS" : "FAIL", {
        response: res.status === 200 
          ? { public_id: res.body.public_id, bytes: res.body.bytes, url: res.body.secure_url }
          : `HTTP ${res.status}: ${JSON.stringify(res.body)}`,
      });
    } catch (e) {
      record("Verify test image exists in Cloudinary", "FAIL", { error: e.message });
    }

    // Delete test image
    try {
      const res = await cloudinaryRequest("DELETE", `/resources/image/upload?public_ids[]=${encodeURIComponent(testPublicId)}`);
      const deleted = res.body?.deleted?.[testPublicId] === "deleted";
      record("Delete test image from Cloudinary", deleted ? "PASS" : "FAIL", {
        response: res.body,
      });

      // Verify deletion
      if (deleted) {
        try {
          const verify = await cloudinaryRequest("GET", `/resources/image/upload/${encodeURIComponent(testPublicId)}`);
          record("Verify test image removed from Cloudinary", verify.status === 404 ? "PASS" : "FAIL", {
            response: verify.status === 404 ? "Confirmed 404 - asset deleted" : `Still returns ${verify.status}`,
          });
        } catch (e) {
          record("Verify test image removed", "FAIL", { error: e.message });
        }
      }
    } catch (e) {
      record("Delete test image from Cloudinary", "FAIL", { error: e.message });
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PHASE 3: Admin API Live HTTP Tests
// ──────────────────────────────────────────────────────────────────────────────
async function phase3_adminApiTests() {
  console.log("\n══════════════════════════════════════════════");
  console.log("PHASE 3 — Admin API Live HTTP Tests");
  console.log("══════════════════════════════════════════════");

  // Test server is alive
  try {
    const res = await request("GET", `${BASE_URL}/`);
    record("Backend server health check GET /", res.status === 200 ? "PASS" : "FAIL", {
      response: res.body,
    });
  } catch (e) {
    record("Backend server health check GET /", "FAIL", { error: e.message });
    console.log("  ⚠️  Backend not reachable — skipping API tests");
    return;
  }

  // Auth: Unauthenticated request should return 401
  try {
    const res = await apiGet("/api/admin/database/stats");
    record("Unauthenticated GET /api/admin/database/stats → 401", res.status === 401 ? "PASS" : "FAIL", {
      response: { status: res.status, body: res.body },
    });
  } catch (e) {
    record("Unauthenticated request test", "FAIL", { error: e.message });
  }

  // Login as super_admin
  try {
    // Try to find a super_admin user in the DB
    const users = await db.collection("users").find({ role: "super_admin" }).limit(1).toArray();
    if (users.length === 0) {
      record("Login as super_admin", "FAIL", { error: "No super_admin user found in database" });
    } else {
      const sa = users[0];
      // Generate token manually since we know the JWT secret
      const jwt = require("jsonwebtoken");
      superAdminToken = jwt.sign(
        { id: sa._id.toString(), sub: sa._id.toString(), role: sa.role, tokenVersion: sa.tokenVersion || 0 },
        "b052986483b6d623b03047cef110569f84918bec6893822618c52c3e79c7f19e",
        { expiresIn: "1h" }
      );
      record("Generate super_admin JWT", "PASS", {
        response: { userId: sa._id.toString(), role: sa.role, email: sa.email },
      });
    }
  } catch (e) {
    record("Generate super_admin JWT", "FAIL", { error: e.message });
  }

  // Generate admin (non-super) token
  try {
    const admins = await db.collection("users").find({ role: "admin" }).limit(1).toArray();
    if (admins.length > 0) {
      const a = admins[0];
      const jwt = require("jsonwebtoken");
      adminToken = jwt.sign(
        { id: a._id.toString(), sub: a._id.toString(), role: a.role, tokenVersion: a.tokenVersion || 0 },
        "b052986483b6d623b03047cef110569f84918bec6893822618c52c3e79c7f19e",
        { expiresIn: "1h" }
      );
      record("Generate admin JWT", "PASS", {
        response: { userId: a._id.toString(), role: a.role, email: a.email },
      });
    } else {
      record("Generate admin JWT", "FAIL", { error: "No admin user found" });
    }
  } catch (e) {
    record("Generate admin JWT", "FAIL", { error: e.message });
  }

  if (!superAdminToken) {
    console.log("  ⚠️  No super_admin token — many tests will fail");
  }

  const token = superAdminToken;

  // ── MongoDB Admin Endpoints ───────────────────────────────────────────────
  // GET /api/admin/database/stats
  try {
    const res = await apiGet("/api/admin/database/stats", token);
    const ok = res.status === 200 && res.body?.success && res.body?.data?.totalCollections > 0;
    record("GET /api/admin/database/stats", ok ? "PASS" : "FAIL", {
      response: { status: res.status, data: res.body?.data },
    });
  } catch (e) {
    record("GET /api/admin/database/stats", "FAIL", { error: e.message });
  }

  // GET /api/admin/database/collections
  let collections = [];
  try {
    const res = await apiGet("/api/admin/database/collections", token);
    const ok = res.status === 200 && Array.isArray(res.body?.data) && res.body.data.length > 0;
    collections = res.body?.data || [];
    record("GET /api/admin/database/collections", ok ? "PASS" : "FAIL", {
      response: { status: res.status, count: collections.length, first: collections[0]?.name },
    });
  } catch (e) {
    record("GET /api/admin/database/collections", "FAIL", { error: e.message });
  }

  // GET /api/admin/database/collections/:name (users)
  try {
    const res = await apiGet("/api/admin/database/collections/users?page=1&limit=5", token);
    const ok = res.status === 200 && res.body?.data?.documents?.length >= 0;
    record("GET /api/admin/database/collections/users", ok ? "PASS" : "FAIL", {
      response: {
        status: res.status,
        totalDocuments: res.body?.data?.totalDocuments,
        page: res.body?.data?.page,
        totalPages: res.body?.data?.totalPages,
        indexesCount: res.body?.data?.indexesCount,
        docsReturned: res.body?.data?.documents?.length,
      },
    });
  } catch (e) {
    record("GET /api/admin/database/collections/users", "FAIL", { error: e.message });
  }

  // GET /api/admin/database/storage-analyzer
  try {
    const res = await apiGet("/api/admin/database/storage-analyzer", token);
    const ok = res.status === 200 && Array.isArray(res.body?.data?.largestCollections);
    record("GET /api/admin/database/storage-analyzer", ok ? "PASS" : "FAIL", {
      response: {
        status: res.status,
        largestCollections: res.body?.data?.largestCollections?.slice(0, 3),
      },
    });
  } catch (e) {
    record("GET /api/admin/database/storage-analyzer", "FAIL", { error: e.message });
  }

  // POST /api/admin/database/cleanup (old_notifications)
  try {
    const res = await apiPost("/api/admin/database/cleanup", { type: "old_notifications" }, token);
    const ok = res.status === 200 && res.body?.success;
    record("POST /api/admin/database/cleanup (old_notifications)", ok ? "PASS" : "FAIL", {
      response: { status: res.status, data: res.body?.data },
    });
  } catch (e) {
    record("POST /api/admin/database/cleanup (old_notifications)", "FAIL", { error: e.message });
  }

  // POST /api/admin/database/cleanup (invalid type → 400)
  try {
    const res = await apiPost("/api/admin/database/cleanup", { type: "invalid_type_xyz" }, token);
    record("POST /api/admin/database/cleanup (invalid type → 400)", res.status === 400 ? "PASS" : "FAIL", {
      response: { status: res.status, body: res.body },
    });
  } catch (e) {
    record("POST /api/admin/database/cleanup (invalid type)", "FAIL", { error: e.message });
  }

  // ── Super Admin RBAC: admin cannot DROP ──────────────────────────────────
  if (adminToken) {
    try {
      const res = await apiDelete("/api/admin/database/collections/nabatech_tests_dummy/drop", adminToken);
      record("Admin role CANNOT drop collection (→ 403)", res.status === 403 ? "PASS" : "FAIL", {
        response: { status: res.status, body: res.body },
      });
    } catch (e) {
      record("Admin role CANNOT drop collection (→ 403)", "FAIL", { error: e.message });
    }
  }

  // ── Super Admin CAN drop (test with non-existent collection — expects 500 not 403) ──
  if (superAdminToken) {
    try {
      const res = await apiDelete("/api/admin/database/collections/nabatech_dummy_nonexistent_col/drop", superAdminToken);
      // 500 means super_admin passed RBAC, but collection doesn't exist
      // 403 would mean RBAC denied — which would be a failure
      const rbacPassed = res.status !== 403;
      record("Super Admin CAN reach drop endpoint (RBAC passes)", rbacPassed ? "PASS" : "FAIL", {
        response: { status: res.status, note: res.status === 500 ? "RBAC passed, collection not found (expected)" : res.body },
      });
    } catch (e) {
      record("Super Admin drop endpoint RBAC", "FAIL", { error: e.message });
    }
  }

  // ── Cloudinary Admin Endpoints ────────────────────────────────────────────
  // GET /api/admin/cloudinary/stats
  try {
    const res = await apiGet("/api/admin/cloudinary/stats", token);
    const ok = res.status === 200 && res.body?.success;
    record("GET /api/admin/cloudinary/stats", ok ? "PASS" : "FAIL", {
      response: { status: res.status, data: res.body?.data },
    });
  } catch (e) {
    record("GET /api/admin/cloudinary/stats", "FAIL", { error: e.message });
  }

  // GET /api/admin/cloudinary/assets
  let firstAssetPublicId = null;
  try {
    const res = await apiGet("/api/admin/cloudinary/assets?max_results=10", token);
    const ok = res.status === 200 && Array.isArray(res.body?.data?.assets);
    firstAssetPublicId = res.body?.data?.assets?.[0]?.public_id;
    record("GET /api/admin/cloudinary/assets", ok ? "PASS" : "FAIL", {
      response: {
        status: res.status,
        assetCount: res.body?.data?.assets?.length,
        firstAsset: firstAssetPublicId || "none",
        hasNextCursor: !!res.body?.data?.next_cursor,
      },
    });
  } catch (e) {
    record("GET /api/admin/cloudinary/assets", "FAIL", { error: e.message });
  }

  // GET /api/admin/cloudinary/assets (sort by bytes for Storage Analyzer)
  try {
    const res = await apiGet("/api/admin/cloudinary/assets?sort_by=bytes&direction=desc&max_results=5", token);
    const ok = res.status === 200 && Array.isArray(res.body?.data?.assets);
    record("GET /api/admin/cloudinary/assets (sorted by bytes)", ok ? "PASS" : "FAIL", {
      response: {
        status: res.status,
        assets: res.body?.data?.assets?.map((a) => ({ public_id: a.public_id, bytes: a.bytes })),
      },
    });
  } catch (e) {
    record("GET /api/admin/cloudinary/assets (sorted by bytes)", "FAIL", { error: e.message });
  }

  // GET /api/admin/cloudinary/folders
  try {
    const res = await apiGet("/api/admin/cloudinary/folders", token);
    const ok = res.status === 200 && Array.isArray(res.body?.data);
    record("GET /api/admin/cloudinary/folders", ok ? "PASS" : "FAIL", {
      response: { status: res.status, folders: res.body?.data },
    });
  } catch (e) {
    record("GET /api/admin/cloudinary/folders", "FAIL", { error: e.message });
  }

  // GET /api/admin/cloudinary/orphans
  try {
    const res = await apiGet("/api/admin/cloudinary/orphans?max_results=50", token);
    const ok = res.status === 200 && res.body?.success;
    record("GET /api/admin/cloudinary/orphans", ok ? "PASS" : "FAIL", {
      response: {
        status: res.status,
        totalChecked: res.body?.data?.totalChecked,
        orphansFound: res.body?.data?.orphans?.length,
        hasNextCursor: !!res.body?.data?.next_cursor,
      },
    });
  } catch (e) {
    record("GET /api/admin/cloudinary/orphans", "FAIL", { error: e.message });
  }

  // Admin role cannot bulk-delete (403)
  if (adminToken) {
    try {
      const res = await apiPost("/api/admin/cloudinary/assets/bulk-delete", { public_ids: ["dummy"] }, adminToken);
      record("Admin role CANNOT bulk-delete (→ 403)", res.status === 403 ? "PASS" : "FAIL", {
        response: { status: res.status, body: res.body },
      });
    } catch (e) {
      record("Admin role CANNOT bulk-delete (→ 403)", "FAIL", { error: e.message });
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// PHASE 5: Orphan Detector End-to-End Test
// ──────────────────────────────────────────────────────────────────────────────
async function phase5_orphanTest() {
  console.log("\n══════════════════════════════════════════════");
  console.log("PHASE 5 — Orphan Detector End-to-End Test");
  console.log("══════════════════════════════════════════════");

  if (!superAdminToken) {
    record("Orphan E2E: Upload test orphan asset", "FAIL", { error: "No super_admin token available" });
    return;
  }

  // Upload a test image that has NO MongoDB reference
  let orphanPublicId = null;
  try {
    const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64");
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><circle cx="25" cy="25" r="25" fill="red"/></svg>`;
    const boundary = "----NabatechOrphanTest";
    const bodyParts = [
      `--${boundary}`,
      `Content-Disposition: form-data; name="file"`,
      "",
      `data:image/svg+xml;base64,${Buffer.from(svgContent).toString("base64")}`,
      `--${boundary}`,
      `Content-Disposition: form-data; name="public_id"`,
      "",
      "nabatech_tests/orphan_test_image_" + Date.now(),
      `--${boundary}--`,
    ].join("\r\n");

    const uploadResult = await new Promise((resolve, reject) => {
      const req = https.request(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
            "Content-Length": Buffer.byteLength(bodyParts),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => {
            try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
            catch { resolve({ status: res.statusCode, body: data }); }
          });
        }
      );
      req.on("error", reject);
      req.write(bodyParts);
      req.end();
    });

    if (uploadResult.status === 200 && uploadResult.body?.public_id) {
      orphanPublicId = uploadResult.body.public_id;
      record("Orphan E2E: Upload unreferenced asset to Cloudinary", "PASS", {
        response: { public_id: orphanPublicId, bytes: uploadResult.body.bytes },
      });
    } else {
      record("Orphan E2E: Upload unreferenced asset", "FAIL", {
        response: typeof uploadResult.body === "string" ? uploadResult.body.substring(0, 300) : uploadResult.body,
      });
    }
  } catch (e) {
    record("Orphan E2E: Upload unreferenced asset", "FAIL", { error: e.message });
  }

  if (!orphanPublicId) return;

  // Wait a moment for Cloudinary to index the upload
  await new Promise((r) => setTimeout(r, 3000));

  // Run orphan detector and check if it appears
  try {
    const res = await apiGet("/api/admin/cloudinary/orphans?max_results=200", superAdminToken);
    const orphans = res.body?.data?.orphans || [];
    const found = orphans.some((o) => o.public_id === orphanPublicId);
    record("Orphan E2E: Orphan detector finds unreferenced asset", found ? "PASS" : "FAIL", {
      response: {
        totalOrphansDetected: orphans.length,
        totalChecked: res.body?.data?.totalChecked,
        targetFound: found,
        targetPublicId: orphanPublicId,
      },
    });

    // Cleanup via API
    if (superAdminToken) {
      const cleanRes = await apiPost(
        "/api/admin/cloudinary/orphans/cleanup",
        { public_ids: [orphanPublicId] },
        superAdminToken
      );
      record("Orphan E2E: Cleanup orphan via API", cleanRes.status === 200 && cleanRes.body?.success ? "PASS" : "FAIL", {
        response: { status: cleanRes.status, data: cleanRes.body },
      });

      // Verify removal from Cloudinary
      const auth = Buffer.from(`${CLOUDINARY_API_KEY}:${CLOUDINARY_API_SECRET}`).toString("base64");
      const verifyRes = await cloudinaryRequest("GET", `/resources/image/upload/${encodeURIComponent(orphanPublicId)}`);
      record("Orphan E2E: Verify cleanup removed asset from Cloudinary", verifyRes.status === 404 ? "PASS" : "FAIL", {
        response: verifyRes.status === 404 ? "Confirmed 404 — asset deleted" : `Unexpected ${verifyRes.status}`,
      });
    }
  } catch (e) {
    record("Orphan E2E: Orphan detector run", "FAIL", { error: e.message });
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Generate Report
// ──────────────────────────────────────────────────────────────────────────────
async function generateReport() {
  const lines = [
    "# NabaTech Runtime Verification Report",
    "",
    `> **Generated**: ${new Date().toISOString()}`,
    `> **Backend**: ${BASE_URL}`,
    `> **MongoDB**: nabatech.jpiebma.mongodb.net`,
    `> **Cloudinary Cloud**: ${CLOUDINARY_CLOUD_NAME}`,
    "",
    `## Summary`,
    "",
    `| Metric | Value |`,
    `|---|---|`,
    `| Total Tests | ${results.length} |`,
    `| PASS | ${passed} |`,
    `| FAIL | ${failed} |`,
    `| Pass Rate | ${((passed / results.length) * 100).toFixed(1)}% |`,
    "",
    "## Test Results",
    "",
  ];

  for (const r of results) {
    const icon = r.status === "PASS" ? "✅" : "❌";
    lines.push(`### ${icon} ${r.name}`);
    lines.push(`**Status**: \`${r.status}\``);
    if (r.response) {
      lines.push("**Response**:");
      lines.push("```json");
      lines.push(typeof r.response === "object" ? JSON.stringify(r.response, null, 2) : r.response);
      lines.push("```");
    }
    if (r.error) lines.push(`**Error**: \`${r.error}\``);
    lines.push("");
  }

  const reportPath = path.join(__dirname, "runtime_test_results.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 JSON results saved to: ${reportPath}`);

  return lines.join("\n");
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🚀 NabaTech Runtime Verification Suite Starting...\n");

  await connectMongo();

  await phase1_mongoLive();
  await phase2_cloudinaryLive();
  await phase3_adminApiTests();
  await phase5_orphanTest();

  const report = await generateReport();

  console.log("\n══════════════════════════════════════════════");
  console.log(`✅ PASSED: ${passed}  ❌ FAILED: ${failed}  TOTAL: ${results.length}`);
  console.log("══════════════════════════════════════════════");

  await disconnectMongo();

  // Write markdown report
  const mdPath = path.join(__dirname, "runtime_test_report.md");
  fs.writeFileSync(mdPath, report);
  console.log(`\n📝 Markdown report saved to: ${mdPath}`);

  // Output full report to stdout for capture
  console.log("\n---BEGIN_REPORT---");
  console.log(report);
  console.log("---END_REPORT---");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
