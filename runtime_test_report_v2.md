# NabaTech Runtime Verification Report

> **Generated**: 2026-06-23T08:31:42.758Z
> **Backend**: http://localhost:10000 (running)
> **MongoDB Atlas**: nabatech.jpiebma.mongodb.net / DB: test
> **Cloudinary Cloud**: dlgzjfjlb (Free plan)

## Summary

| Metric | Value |
|---|---|
| Total Tests | 53 |
| ✅ PASS | 53 |
| ❌ FAIL | 0 |
| Pass Rate | 100.0% |

## Detailed Test Results

### ✅ MongoDB Atlas connection
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:02.906Z
**Response**:
```json
Connected to cluster, DB: test
```

### ✅ db.stats() — real database metrics
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:03.056Z
**Response**:
```json
{
  "dataSize_bytes": 536283,
  "storageSize_bytes": 1994752,
  "collections": 100,
  "objects": 950,
  "indexes": 303
}
```

### ✅ listCollections() — enumerate all collections
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:03.333Z
**Response**:
```json
100 collections found: orders, refreshsessions, weatheralerts, planthealthlogs, homesections, homeanalytics, tasks, expertprofiles ...
```

### ✅ users collection document count
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:03.473Z
**Response**:
```json
59 users in database
```

### ✅ collStats(users) — size + indexes
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:03.924Z
**Response**:
```json
{
  "size_bytes": 20934,
  "count": 59,
  "nindexes": 6,
  "storageSize_bytes": 53248
}
```

### ✅ Verify super_admin user exists in DB
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:04.062Z
**Response**:
```json
{
  "email": "ahmed@gmail.com",
  "role": "super_admin"
}
```

### ✅ Insert test document into nabatech_test_runtime
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:04.200Z
**Response**:
```json
{
  "_id": "6a3a444813ce55de28a27f03",
  "collection": "nabatech_test_runtime"
}
```

### ✅ Read-back test document (verify write)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:04.339Z
**Response**:
```json
{
  "_marker": "RUNTIME_VERIFICATION",
  "_id": "6a3a444813ce55de28a27f03"
}
```

### ✅ Delete test document
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:04.478Z
**Response**:
```json
{
  "deletedCount": 1
}
```

### ✅ Verify test document permanently deleted
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:04.613Z
**Response**:
```json
Confirmed — document does not exist
```

### ✅ Cleanup simulation — delete 30-day-old notifications
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:04.892Z
**Response**:
```json
{
  "deleted": 1,
  "query": "{ createdAt: { $lt: 30 days ago } }"
}
```

### ✅ soft_deleted_users query (fixed: isDeleted:true)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:05.029Z
**Response**:
```json
{
  "count": 0,
  "note": "No deleted users currently — query is syntactically correct"
}
```

### ✅ GET Cloudinary /usage — real storage stats
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:05.717Z
**Response**:
```json
{
  "storage_used_bytes": 239440903,
  "storage_used_MB": "228.35",
  "bandwidth_bytes": 10292182,
  "total_assets": 225,
  "plan": "Free"
}
```

### ✅ GET /resources/image — list real assets
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:05.962Z
**Response**:
```json
{
  "returned": 5,
  "first_public_id": "diagnoses/l5hsncxldicemur5sdwx",
  "first_bytes": 11082,
  "has_more": true
}
```

### ✅ Upload test image to Cloudinary
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:07.309Z
**Response**:
```json
{
  "public_id": "nabatech_tests/runtime_test_1782203465962",
  "secure_url": "https://res.cloudinary.com/dlgzjfjlb/image/upload/v1782203467/nabatech_tests/runtime_test_1782203465962.svg",
  "bytes": 195,
  "format": "svg"
}
```

### ✅ Verify uploaded asset exists (GET by public_id)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:07.612Z
**Response**:
```json
{
  "public_id": "nabatech_tests/runtime_test_1782203465962",
  "bytes": 195,
  "created_at": "2026-06-23T08:31:07Z"
}
```

### ✅ Delete test image from Cloudinary
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:08.222Z
**Response**:
```json
{
  "deleted": {
    "nabatech_tests/runtime_test_1782203465962": "deleted"
  },
  "deleted_counts": {
    "nabatech_tests/runtime_test_1782203465962": {
      "original": 1,
      "derived": 0
    }
  },
  "partial": false
}
```

### ✅ Verify deletion — asset returns 404
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:08.431Z
**Response**:
```json
Confirmed 404 — permanently removed
```

### ✅ Cloudinary bandwidth usage reading
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:08.694Z
**Response**:
```json
{
  "bandwidth_used_bytes": 10292182,
  "bandwidth_used_MB": "9.82"
}
```

### ✅ Backend GET / — health check
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:08.936Z
**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Express + TypeScript is working"
  }
}
```

### ✅ Unauthenticated request → 401
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:08.946Z
**Response**:
```json
{
  "status": 401,
  "code": "AUTH_REQUIRED"
}
```

### ✅ GET /api/admin/database/stats
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:11.781Z
**Response**:
```json
{
  "totalDatabaseSize_bytes": 536283,
  "totalStorageSize_bytes": 1994752,
  "totalCollections": 100,
  "totalDocuments": 950,
  "indexesCount": 303,
  "largestCollections": [
    {
      "name": "diagnosishistories",
      "size": 172444
    },
    {
      "name": "messages",
      "size": 113415
    },
    {
      "name": "aicalllogs",
      "size": 85818
    }
  ]
}
```

### ✅ GET /api/admin/database/collections
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:14.652Z
**Response**:
```json
{
  "count": 100,
  "sample": [
    {
      "name": "orders",
      "count": 0,
      "size_bytes": 0,
      "indexes": 1
    },
    {
      "name": "refreshsessions",
      "count": 162,
      "size_bytes": 47042,
      "indexes": 6
    },
    {
      "name": "weatheralerts",
      "count": 0,
      "size_bytes": 0,
      "indexes": 2
    },
    {
      "name": "planthealthlogs",
      "count": 0,
      "size_bytes": 0,
      "indexes": 3
    },
    {
      "name": "homesections",
      "count": 0,
      "size_bytes": 0,
      "indexes": 2
    }
  ]
}
```

### ✅ GET /api/admin/database/collections/users?page=1&limit=3
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:15.515Z
**Response**:
```json
{
  "totalDocuments": 59,
  "totalPages": 20,
  "page": 1,
  "indexesCount": 6,
  "documentsReturned": 3,
  "firstDocId": "6a3a2d4d38fc517ede691954"
}
```

### ✅ GET /collections/users?page=2 — pagination
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:16.386Z
**Response**:
```json
{
  "page": 2,
  "documentsReturned": 3
}
```

### ✅ GET /api/admin/database/storage-analyzer
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:18.604Z
**Response**:
```json
{
  "topCollections": [
    {
      "name": "diagnosishistories",
      "size_bytes": 172444,
      "count": 53
    },
    {
      "name": "messages",
      "size_bytes": 113415,
      "count": 200
    },
    {
      "name": "aicalllogs",
      "size_bytes": 85818,
      "count": 190
    },
    {
      "name": "refreshsessions",
      "size_bytes": 47042,
      "count": 162
    },
    {
      "name": "outboxjobs",
      "size_bytes": 21496,
      "count": 33
    }
  ]
}
```

### ✅ POST /api/admin/database/cleanup (old_notifications)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:19.040Z
**Response**:
```json
{
  "type": "old_notifications",
  "deletedCount": 0,
  "message": "Successfully cleaned up 0 records."
}
```

### ✅ POST /api/admin/database/cleanup (old_diagnosis)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:19.318Z
**Response**:
```json
{
  "type": "old_diagnosis",
  "deletedCount": 0,
  "message": "Successfully cleaned up 0 records."
}
```

### ✅ POST /api/admin/database/cleanup (soft_deleted_users — fixed query)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:19.602Z
**Response**:
```json
{
  "type": "soft_deleted_users",
  "deletedCount": 0,
  "message": "Successfully cleaned up 0 records."
}
```

### ✅ POST /cleanup invalid type → 400
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:19.743Z
**Response**:
```json
{
  "status": 400,
  "error": "Invalid cleanup type"
}
```

### ✅ RBAC: admin role → DROP endpoint → 403
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:19.889Z
**Response**:
```json
{
  "status": 403,
  "message": "Access denied: Requires one of [super_admin]"
}
```

### ✅ RBAC: admin role → PURGE endpoint → 403
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:20.053Z
**Response**:
```json
{
  "status": 403,
  "message": "Access denied: Requires one of [super_admin]"
}
```

### ✅ RBAC: super_admin → DROP endpoint → passes RBAC (gets 500 not 403)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:20.334Z
**Response**:
```json
{
  "status": 200,
  "note": {
    "success": true,
    "message": "Collection nabatech_dummy_zzz_nonexistent dropped successfully."
  }
}
```

### ✅ GET /api/admin/cloudinary/stats
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:21.835Z
**Response**:
```json
{
  "totalStorageUsed_bytes": 239440903,
  "totalStorageUsed_MB": "228.35",
  "totalBandwidth_bytes": 10292182,
  "totalAssets": 225,
  "imagesCount": 0,
  "videosCount": 0,
  "documentsCount": 0
}
```

### ✅ GET /api/admin/cloudinary/assets
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:22.273Z
**Response**:
```json
{
  "assetsReturned": 10,
  "firstAsset": "diagnoses/l5hsncxldicemur5sdwx",
  "hasNextCursor": true
}
```

### ✅ GET /api/admin/cloudinary/assets (sort_by=bytes) — Storage Analyzer
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:22.838Z
**Response**:
```json
{
  "largestFiles": [
    {
      "public_id": "samples/elephants",
      "bytes": 38855178,
      "format": "mp4"
    },
    {
      "public_id": "samples/cld-sample-video",
      "bytes": 35988643,
      "format": "mp4"
    },
    {
      "public_id": "samples/sea-turtle",
      "bytes": 27932506,
      "format": "mp4"
    },
    {
      "public_id": "samples/dance-2",
      "bytes": 22373558,
      "format": "mp4"
    },
    {
      "public_id": "samples/landscapes/landscape-panorama",
      "bytes": 7858062,
      "format": "jpg"
    }
  ]
}
```

### ✅ GET /api/admin/cloudinary/assets — cursor pagination (page 2)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:23.667Z
**Response**:
```json
{
  "page2Assets": 5,
  "firstAsset": "diagnoses/pnhhjwvpvxl2l6yvzr0o"
}
```

### ✅ GET /api/admin/cloudinary/folders
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:25.174Z
**Response**:
```json
{
  "folders": [
    {
      "folder": "assistant_images",
      "assetCount": 5,
      "storageUsed": 1190075
    },
    {
      "folder": "diagnoses",
      "assetCount": 51,
      "storageUsed": 5420134
    },
    {
      "folder": "my_plants",
      "assetCount": 1,
      "storageUsed": 326166
    },
    {
      "folder": "users",
      "assetCount": 5,
      "storageUsed": 5373103
    }
  ]
}
```

### ✅ GET /api/admin/cloudinary/orphans
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:27.106Z
**Response**:
```json
{
  "totalChecked": 50,
  "orphansFound": 7,
  "hasNextCursor": true
}
```

### ✅ RBAC: admin role → bulk-delete → 403
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:27.251Z
**Response**:
```json
{
  "status": 403,
  "message": "Access denied: Requires one of [super_admin]"
}
```

### ✅ RBAC: admin role → orphan cleanup → 403
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:27.393Z
**Response**:
```json
{
  "status": 403,
  "message": "Access denied: Requires one of [super_admin]"
}
```

### ✅ POST /assets/delete with no public_id → 400
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:27.539Z
**Response**:
```json
{
  "status": 400,
  "error": "Missing public_id"
}
```

### ✅ Orphan E2E: Upload unreferenced asset (no MongoDB reference)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:29.226Z
**Response**:
```json
{
  "public_id": "nabatech_tests/orphan_e2e_test_1782203487540",
  "secure_url": "https://res.cloudinary.com/dlgzjfjlb/image/upload/v1782203489/nabatech_tests/orphan_e2e_test_1782203487540.svg",
  "bytes": 195
}
```

### ✅ Orphan E2E: Confirm asset NOT in any MongoDB collection
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:30.739Z
**Response**:
```json
{
  "communityPosts": 0,
  "diagnosisHistory": 0,
  "note": "Asset is deliberately unreferenced"
}
```

### ✅ Orphan E2E: Orphan Detector finds the unreferenced asset
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:39.965Z
**Response**:
```json
{
  "totalAssetsChecked": 200,
  "orphansDetected": 148,
  "targetFound": true,
  "targetPublicId": "nabatech_tests/orphan_e2e_test_1782203487540"
}
```

### ✅ Orphan E2E: Cleanup orphan via /orphans/cleanup API
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:40.873Z
**Response**:
```json
{
  "status": 200,
  "message": "Successfully deleted 1 orphans.",
  "result": {
    "deleted": {
      "nabatech_tests/orphan_e2e_test_1782203487540": "deleted"
    },
    "deleted_counts": {
      "nabatech_tests/orphan_e2e_test_1782203487540": {
        "original": 1,
        "derived": 0
      }
    },
    "partial": false,
    "rate_limit_allowed": 500,
    "rate_limit_reset_at": "2026-06-23T09:00:00.000Z",
    "rate_limit_remaining": 453
  }
}
```

### ✅ Orphan E2E: Verify cleanup removed asset from Cloudinary (404)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:41.336Z
**Response**:
```json
Confirmed 404 — asset permanently deleted
```

### ✅ Create test collection for RBAC test
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:41.639Z
**Response**:
```json
{
  "collection": "nabatech_rbac_test_1782203501336"
}
```

### ✅ RBAC: admin CANNOT purge nabatech_rbac_test_1782203501336 (→ 403)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:41.783Z
**Response**:
```json
{
  "status": 403,
  "message": "Access denied: Requires one of [super_admin]"
}
```

### ✅ RBAC: admin CANNOT drop nabatech_rbac_test_1782203501336 (→ 403)
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:41.921Z
**Response**:
```json
{
  "status": 403,
  "message": "Access denied: Requires one of [super_admin]"
}
```

### ✅ RBAC: super_admin CAN purge nabatech_rbac_test_1782203501336
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:42.339Z
**Response**:
```json
{
  "status": 200,
  "message": "Purged 1 documents from nabatech_rbac_test_1782203501336.",
  "docsRemaining": 0
}
```

### ✅ RBAC: super_admin CAN drop nabatech_rbac_test_1782203501336
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:42.617Z
**Response**:
```json
{
  "status": 200,
  "message": "Collection nabatech_rbac_test_1782203501336 dropped successfully."
}
```

### ✅ Verify nabatech_rbac_test_1782203501336 completely dropped from MongoDB
**Status**: `PASS`  |  **Time**: 2026-06-23T08:31:42.752Z
**Response**:
```json
Collection no longer exists
```
