# NabaTech Runtime Verification Report

> **Generated**: 2026-06-23T08:22:58.013Z
> **Backend**: http://localhost:10000
> **MongoDB**: nabatech.jpiebma.mongodb.net
> **Cloudinary Cloud**: dlgzjfjlb

## Summary

| Metric | Value |
|---|---|
| Total Tests | 32 |
| PASS | 18 |
| FAIL | 14 |
| Pass Rate | 56.3% |

## Test Results

### ✅ MongoDB Direct Connection
**Status**: `PASS`
**Response**:
```json
Connected to nabatech.jpiebma.mongodb.net
```

### ✅ db.stats() execution
**Status**: `PASS`
**Response**:
```json
{
  "dataSize": 0,
  "storageSize": 0,
  "collections": 0,
  "objects": 0,
  "indexes": 0
}
```

### ✅ listCollections()
**Status**: `PASS`
**Response**:
```json
0 collections:  ...
```

### ✅ Verify users collection count
**Status**: `PASS`
**Response**:
```json
users collection has 0 documents
```

### ✅ collStats on users collection
**Status**: `PASS`
**Response**:
```json
{
  "size": 0,
  "count": 0,
  "nindexes": 0
}
```

### ✅ Create test document in MongoDB
**Status**: `PASS`
**Response**:
```json
{
  "insertedId": "6a3a425c4d5e58515914cd05",
  "collection": "nabatech_test_runtime"
}
```

### ✅ Verify test document exists
**Status**: `PASS`
**Response**:
```json
Found: NABATECH_RUNTIME_TEST
```

### ✅ Delete test document from MongoDB
**Status**: `PASS`
**Response**:
```json
{
  "deletedCount": 1
}
```

### ✅ Verify test document deleted
**Status**: `PASS`
**Response**:
```json
Confirmed deleted
```

### ✅ Cleanup simulation (old_notifications)
**Status**: `PASS`
**Response**:
```json
{
  "inserted": "6a3a425d4d5e58515914cd06",
  "deleted": 1
}
```

### ✅ Cloudinary usage API
**Status**: `PASS`
**Response**:
```json
{
  "storage_usage_bytes": 239440903,
  "bandwidth_usage_bytes": 10292182,
  "resources": 225,
  "plan": "Free"
}
```

### ✅ Cloudinary list assets (GET /resources/image)
**Status**: `PASS`
**Response**:
```json
{
  "assets_returned": 10,
  "first_asset": "diagnoses/l5hsncxldicemur5sdwx",
  "next_cursor": "d8b6f8a907fd6aceefc999394b37f36a868a764fd30d889e84a8c4c80883cc4c"
}
```

### ✅ Upload test image to Cloudinary
**Status**: `PASS`
**Response**:
```json
{
  "public_id": "nabatech_tests/nabatech_runtime_test_image",
  "secure_url": "https://res.cloudinary.com/dlgzjfjlb/image/upload/v1782202976/nabatech_tests/nabatech_runtime_test_image.svg",
  "bytes": 207,
  "format": "svg"
}
```

### ✅ Verify test image exists in Cloudinary
**Status**: `PASS`
**Response**:
```json
{
  "public_id": "nabatech_tests/nabatech_runtime_test_image",
  "bytes": 207,
  "url": "https://res.cloudinary.com/dlgzjfjlb/image/upload/v1782202976/nabatech_tests/nabatech_runtime_test_image.svg"
}
```

### ✅ Delete test image from Cloudinary
**Status**: `PASS`
**Response**:
```json
{
  "deleted": {
    "nabatech_tests/nabatech_runtime_test_image": "deleted"
  },
  "deleted_counts": {
    "nabatech_tests/nabatech_runtime_test_image": {
      "original": 1,
      "derived": 0
    }
  },
  "partial": false
}
```

### ✅ Verify test image removed from Cloudinary
**Status**: `PASS`
**Response**:
```json
Confirmed 404 - asset deleted
```

### ✅ Backend server health check GET /
**Status**: `PASS`
**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Express + TypeScript is working"
  }
}
```

### ✅ Unauthenticated GET /api/admin/database/stats → 401
**Status**: `PASS`
**Response**:
```json
{
  "status": 401,
  "body": {
    "success": false,
    "error": {
      "code": "AUTH_REQUIRED",
      "status": 401,
      "message": "Not authorized, missing or invalid token format"
    },
    "requestId": "7f3b430a-b8f7-4f81-b2ac-ea428d5d89a6",
    "message": "Not authorized, missing or invalid token format"
  }
}
```

### ❌ Login as super_admin
**Status**: `FAIL`
**Error**: `No super_admin user found in database`

### ❌ Generate admin JWT
**Status**: `FAIL`
**Error**: `No admin user found`

### ❌ GET /api/admin/database/stats
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401
}
```

### ❌ GET /api/admin/database/collections
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401,
  "count": 0
}
```

### ❌ GET /api/admin/database/collections/users
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401
}
```

### ❌ GET /api/admin/database/storage-analyzer
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401
}
```

### ❌ POST /api/admin/database/cleanup (old_notifications)
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401
}
```

### ❌ POST /api/admin/database/cleanup (invalid type → 400)
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401,
  "body": {
    "success": false,
    "error": {
      "code": "AUTH_REQUIRED",
      "status": 401,
      "message": "Not authorized, missing or invalid token format"
    },
    "requestId": "2643ef2c-c119-41ec-8fa5-9c11762c39b1",
    "message": "Not authorized, missing or invalid token format"
  }
}
```

### ❌ GET /api/admin/cloudinary/stats
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401
}
```

### ❌ GET /api/admin/cloudinary/assets
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401,
  "firstAsset": "none",
  "hasNextCursor": false
}
```

### ❌ GET /api/admin/cloudinary/assets (sorted by bytes)
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401
}
```

### ❌ GET /api/admin/cloudinary/folders
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401
}
```

### ❌ GET /api/admin/cloudinary/orphans
**Status**: `FAIL`
**Response**:
```json
{
  "status": 401,
  "hasNextCursor": false
}
```

### ❌ Orphan E2E: Upload test orphan asset
**Status**: `FAIL`
**Error**: `No super_admin token available`
