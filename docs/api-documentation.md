# REST API Specification & Endpoint Documentation

## ECHOES — Digital Memory Vault & Personal Time Capsule

---

## 1. Overview & Protocol Conventions

All backend endpoints are built using **Next.js App Router Route Handlers** (`src/app/api/**/route.ts`). All requests and responses use standard JSON (`application/json`).

- **Base URL**: `/api`
- **Authentication**: Stateless Bearer tokens (JSON Web Token signed with HMAC-SHA256 via `jose`) and HTTP-only cookies (`echoes_token`).
- **Data Validation**: Request payloads are strictly validated against declarative Zod schemas before domain logic executes.

---

## 2. Standard Response Envelope

All API endpoints conform to a predictable envelope structure.

### 2.1 Success Response (`ApiResponse<T>`)

```json
{
  "success": true,
  "data": {/* payload object or array */},
  "message": "Optional human-readable success description"
}
```

### 2.2 Error Response (`ApiErrorResponse`)

```json
{
  "success": false,
  "error": "Human-readable summary of the error",
  "details": [/* Optional validation errors or diagnostics */]
}
```

---

## 3. Implemented Endpoints (Phase 0 & Phase 1)

### 3.1 System Health Check

- **Route**: `GET /api/health`
- **Access**: Public
- **Description**: Verifies that the Next.js Route Handler subsystem is operational.
- **Response**: `200 OK`
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-31T09:30:00.000Z",
    "service": "echoes-api"
  }
  ```

---

### 3.2 User Registration

- **Route**: `POST /api/auth/register`
- **Access**: Public (Rate limit: 5 requests / hour / IP)
- **Description**: Creates a new user account, hashes password via bcrypt, issues JWT, sets HTTP-only cookie, and asynchronously triggers a welcome email.
- **Request Body**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `201 Created`: Account created. Sets `echoes_token` cookie.
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "user": {
          "_id": "67236d...",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "tokenVersion": 0,
          "createdAt": "2026-10-31T...",
          "updatedAt": "2026-10-31T..."
        },
        "token": "eyJhbGciOiJIUzI1Ni..."
      }
    }
    ```
  - `400 Bad Request`: Payload validation failure (weak password, invalid email syntax).
  - `409 Conflict`: Email address already registered.
  - `429 Too Many Requests`: Rate limit exceeded.

---

### 3.3 User Login

- **Route**: `POST /api/auth/login`
- **Access**: Public (Rate limit: 5 attempts / 15 mins / IP)
- **Description**: Authenticates user credentials, issues a signed JWT, and sets an HTTP-only cookie.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Responses**:
  - `200 OK`: Successful authentication. Sets `echoes_token` cookie.
    ```json
    {
      "success": true,
      "message": "Logged in successfully",
      "data": {
        "user": {
          "_id": "67236d...",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "tokenVersion": 0
        },
        "token": "eyJhbGciOiJIUzI1Ni..."
      }
    }
    ```
  - `401 Unauthorized`: Invalid email or incorrect password.
  - `429 Too Many Requests`: Rate limit exceeded.

---

### 3.4 User Logout

- **Route**: `POST /api/auth/logout`
- **Access**: Public / Authenticated
- **Description**: Invalidates the active session by incrementing `tokenVersion` in the database (ensuring old JWTs can never be reused) and clears the `echoes_token` cookie (`maxAge: 0`).
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Logged out successfully"
    }
    ```

---

### 3.5 Current User Profile

- **Route**: `GET /api/auth/me`
- **Access**: Authenticated (Requires valid Bearer token or `echoes_token` cookie)
- **Description**: Validates JWT, verifies tokenVersion against database record, and returns safe user profile.
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "user": {
          "_id": "67236d...",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "tokenVersion": 0
        }
      }
    }
    ```
  - `401 Unauthorized`: Missing token, expired session, or session revoked via tokenVersion mismatch.

---

### 3.6 Forgot Password

- **Route**: `POST /api/auth/forgot-password`
- **Access**: Public (Rate limit: 5 requests / hour / IP)
- **Description**: Accepts an email address. If user exists, generates a cryptographically secure token, hashes it with SHA-256 for database storage with 1-hour expiration, and sends a reset link via Nodemailer. Returns a generic response to prevent account enumeration.
- **Request Body**:
  ```json
  {
    "email": "jane@example.com"
  }
  ```
- **Responses**:
  - `200 OK` (Returned uniformly whether user exists or not):
    ```json
    {
      "success": true,
      "message": "If an account with that email address exists, a password reset link has been sent."
    }
    ```
  - `429 Too Many Requests`: Rate limit exceeded.

---

### 3.7 Reset Password

- **Route**: `POST /api/auth/reset-password`
- **Access**: Public (Rate limit: 5 attempts / hour / IP)
- **Description**: Validates raw reset token by computing SHA-256 hash and looking up unexpired record. Hashes new password, clears reset token, increments `tokenVersion` (revoking other active sessions), and sends confirmation email.
- **Request Body**:
  ```json
  {
    "token": "7a3f89e2...",
    "newPassword": "NewSecurePassword456!"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Password has been reset successfully. Please log in with your new password."
    }
    ```
  - `400 Bad Request`: Token invalid, expired, or previously used.
  - `429 Too Many Requests`: Rate limit exceeded.

---

### 3.8 Change Password

- **Route**: `PATCH /api/auth/change-password`
- **Access**: Authenticated (Bearer token or cookie)
- **Description**: Verifies current password against stored hash, saves new password hash, increments `tokenVersion` to invalidate any other sessions, issues a fresh token for current session, and sends confirmation email.
- **Request Body**:
  ```json
  {
    "currentPassword": "SecurePassword123!",
    "newPassword": "NewSecurePassword456!"
  }
  ```
- **Responses**:
  - `200 OK`: Returns new active session token and sets refreshed cookie.
    ```json
    {
      "success": true,
      "message": "Password changed successfully.",
      "data": {
        "token": "eyJhbGciOiJIUzI1Ni..."
      }
    }
    ```
  - `400 Bad Request`: Incorrect current password or new password equals current password.
  - `401 Unauthorized`: Unauthenticated request.

---

## 4. Implemented Memory Journal & Photo Endpoints (Phase 2)

### 4.1 Create Memory

- **Route**: `POST /api/memories`
- **Access**: Private (Authenticated)
- **Description**: Creates a new memory journal record. Ownership is derived strictly from the session token.
- **Request Body**:
  ```json
  {
    "title": "Graduation Ceremony",
    "content": "Received my Bachelor of Engineering degree with honors.",
    "memoryDate": "2025-06-15T10:00:00.000Z",
    "tags": ["college", "engineering"]
  }
  ```
- **Responses**:
  - `201 Created`: Returns newly created memory object.
  - `400 Bad Request`: Validation failure.
  - `401 Unauthorized`: Unauthenticated request.

### 4.2 List Memories (Search, Filter, Pagination)

- **Route**: `GET /api/memories`
- **Access**: Private (Authenticated)
- **Description**: Returns memories belonging to the authenticated user with search, filtering, and pagination.
- **Query Parameters**:
  - `page` (optional, default `1`): Page number.
  - `limit` (optional, default `10`, max `50`): Page size limit.
  - `search` (optional): Case-insensitive keyword search on `title` and `content`.
  - `tags` (optional): Filter by tags (comma-separated or multiple parameters).
  - `startDate` (optional, ISO date): Filter memories on or after this date.
  - `endDate` (optional, ISO date): Filter memories on or before this date.
  - `sortOrder` (optional, `asc` or `desc`, default `desc`): Chronological ordering.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6724...",
        "title": "Graduation Ceremony",
        "content": "...",
        "memoryDate": "2025-06-15T10:00:00.000Z",
        "tags": ["college", "engineering"],
        "photos": [
          {
            "_id": "6725...",
            "url": "https://res.cloudinary.com/...",
            "signedUrl": "https://res.cloudinary.com/.../authenticated/s--signed--/...",
            "publicId": "echoes/users/.../photo1",
            "format": "jpg",
            "width": 1920,
            "height": 1080,
            "bytes": 204800
          }
        ],
        "createdAt": "2026-10-31T...",
        "updatedAt": "2026-10-31T..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

### 4.3 Get Individual Memory

- **Route**: `GET /api/memories/:id`
- **Access**: Private (Authenticated Owner Only)
- **Description**: Retrieves a single memory populated with signed photo URLs. Returns 404 if not found or owned by another user.
- **Response**: `200 OK`

### 4.4 Update Memory

- **Route**: `PATCH /api/memories/:id`
- **Access**: Private (Authenticated Owner Only)
- **Description**: Partially updates memory fields (`title`, `content`, `memoryDate`, `tags`).
- **Response**: `200 OK`

### 4.5 Delete Memory

- **Route**: `DELETE /api/memories/:id`
- **Access**: Private (Authenticated Owner Only)
- **Description**: Deletes a memory and automatically purges all its associated photographs from Cloudinary storage and MongoDB.
- **Response**: `200 OK`

### 4.6 Upload & Attach Photo

- **Route**: `POST /api/memories/:id/photos`
- **Access**: Private (Authenticated Owner Only)
- **Content-Type**: `multipart/form-data`
- **Description**: Uploads a photo to Cloudinary (`type: 'authenticated'` for privacy) and attaches it to the memory. Implements compensating rollback to delete the Cloudinary asset if DB persistence fails.
- **Form Field**: `file` (JPEG, PNG, WebP, GIF, AVIF, max 10MB).
- **Response**: `201 Created` with signed delivery URL.

### 4.7 Retrieve Photos for Memory

- **Route**: `GET /api/memories/:id/photos`
- **Access**: Private (Authenticated Owner Only)
- **Description**: Retrieves all photos belonging to the memory with signed delivery URLs.
- **Response**: `200 OK`

### 4.8 Delete Photo

- **Route**: `DELETE /api/memories/:id/photos/:photoId`
- **Access**: Private (Authenticated Owner Only)
- **Description**: Deletes photo from MongoDB, unlinks it from `Memory.photos`, and purges it from Cloudinary.
- **Response**: `200 OK`

### 4.9 Move Photo Between Memories

- **Route**: `PATCH /api/memories/:id/photos/:photoId`
- **Access**: Private (Authenticated Owner Only)
- **Description**: Moves photo to another memory (`targetMemoryId`) owned by the same user with compensating rollback.
- **Request Body**: `{ "targetMemoryId": "6724..." }`
- **Response**: `200 OK`

---

## 5. Time Capsule Subsystem Endpoints (Phase 3 - Completed)

### 5.1 Create & Seal Time Capsule

- **Route**: `POST /api/capsules`
- **Access**: Private (Authenticated User Only)
- **CSRF**: Enforced
- **Description**: Creates and seals a new time capsule with a strictly future unlock date. Server sets `userId`, `sealedAt`, `isOpened = false`. Client cannot supply lifecycle fields. Validates photo ownership and rejects arbitrary external URLs.
- **Request Body**:
  ```json
  {
    "title": "Letter to my 2030 Self",
    "message": "Remember where you started...",
    "unlockDate": "2030-01-01T00:00:00.000Z",
    "photos": ["6724ab..."],
    "photoUrls": ["https://res.cloudinary.com/..."]
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "success": true,
    "message": "Time capsule sealed successfully.",
    "data": {
      "_id": "6724...",
      "userId": "6724...",
      "title": "Letter to my 2030 Self",
      "unlockDate": "2030-01-01T00:00:00.000Z",
      "unlockAt": "2030-01-01T00:00:00.000Z",
      "sealedAt": "2026-11-01T05:00:00.000Z",
      "isOpened": false,
      "openedAt": null,
      "isLocked": true,
      "createdAt": "2026-11-01T05:00:00.000Z",
      "updatedAt": "2026-11-01T05:00:00.000Z"
    }
  }
  ```

### 5.2 List User Time Capsules

- **Route**: `GET /api/capsules`
- **Access**: Private (Authenticated User Only)
- **Description**: Returns all time capsules belonging to the user with pagination and chronological sorting. **Temporal Invariant**: For locked capsules (`now < unlockDate`), `message`, `photos`, and `photoUrls` are strictly redacted/omitted to prevent secret leakage. For unlocked capsules, permitted contents and signed photo URLs are returned.
- **Query Parameters**:
  - `page` (number, default: 1)
  - `limit` (number, default: 10, max: 50)
  - `sortOrder` (`asc` | `desc`, default: `asc` by `unlockDate`)
  - `status` (`locked` | `unlocked`, optional filter)
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "6724...",
        "userId": "6724...",
        "title": "Letter to my 2030 Self",
        "unlockDate": "2030-01-01T00:00:00.000Z",
        "unlockAt": "2030-01-01T00:00:00.000Z",
        "sealedAt": "2026-11-01T05:00:00.000Z",
        "isOpened": false,
        "openedAt": null,
        "isLocked": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
  ```

### 5.3 Retrieve Single Time Capsule

- **Route**: `GET /api/capsules/:id`
- **Access**: Private (Authenticated Owner Only)
- **Description**: Retrieves single capsule. Enforces strict ownership (404 for unowned or nonexistent). **Temporal Invariant**: Returns `403 Forbidden` if server time is earlier than `unlockDate` (`capsule.isLocked() === true`). Returns complete letter and signed photos only once unlocked.
- **Response (Locked)**: `403 Forbidden`
  ```json
  {
    "success": false,
    "error": "Time capsule is sealed and locked until 2030-01-01T00:00:00.000Z.",
    "unlockDate": "2030-01-01T00:00:00.000Z",
    "isLocked": true
  }
  ```
- **Response (Unlocked)**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "_id": "6724...",
      "userId": "6724...",
      "title": "Matured Milestone",
      "message": "Revealed letter content...",
      "unlockDate": "2026-10-31T00:00:00.000Z",
      "unlockAt": "2026-10-31T00:00:00.000Z",
      "sealedAt": "2025-10-31T00:00:00.000Z",
      "isOpened": true,
      "openedAt": "2026-11-01T05:00:00.000Z",
      "photos": [{ "signedUrl": "https://..." }],
      "photoUrls": ["https://res.cloudinary.com/..."],
      "isLocked": false
    }
  }
  ```

### 5.4 Open / Unseal Time Capsule

- **Route**: `POST /api/capsules/:id/open`
- **Access**: Private (Authenticated Owner Only)
- **CSRF**: Enforced
- **Description**: Unseals an unlocked capsule. Returns `403 Forbidden` if server time is earlier than `unlockDate`. When milestone is reached (`server_time >= unlockDate`), transitions `isOpened = true`, sets `openedAt = server_time`, and returns the revealed memory letter. Operation is idempotent and safe to repeat without altering the original `openedAt`.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Time capsule unsealed successfully.",
    "data": {
      "_id": "6724...",
      "userId": "6724...",
      "title": "Milestone Capsule",
      "message": "Congratulations on reaching your goal!",
      "isOpened": true,
      "openedAt": "2026-11-01T05:00:00.000Z",
      "isLocked": false
    }
  }
  ```

### 5.5 Delete Time Capsule

- **Route**: `DELETE /api/capsules/:id`
- **Access**: Private (Authenticated Owner Only)
- **CSRF**: Enforced
- **Description**: Deletes a capsule and cleans up attached resources safely. Exclusively attached photos (`memoryId == null`) are purged from Cloudinary and MongoDB. Photos shared with a memory are preserved. Returns 404 for unowned capsules.
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "message": "Time capsule and associated resources deleted successfully."
  }
  ```

---

---

## 6. Timeline Subsystem Endpoints (Phase 4)

### 6.1 Unified Chronological Timeline

- **Route**: `GET /api/timeline`
- **Access**: Private (Authenticated User Only)
- **Description**: Combines personal journal memories and time capsules into a single chronological timeline feed.
- **Date Semantics**:
  - **Memory Entries**: The normalized `date` field represents `memoryDate` (the historical moment when the memory occurred).
  - **Capsule Entries**: The normalized `date` field represents `unlockDate` (the temporal maturity milestone when the capsule is scheduled to be unsealed or was unsealed). Capsule entries also provide `sealedAt` (origination date) and `unlockDate` for complete context.
- **Critical Capsule Privacy**:
  - For sealed/locked capsules (`now < unlockDate`), `content`, `message`, `photos`, `photoUrls`, and private Cloudinary IDs are strictly redacted from the response body and raw JSON output.
  - For unlocked capsules (`now >= unlockDate`), `content` and `photos` (with secure signed Cloudinary URLs) are revealed.
- **Query Parameters**:
  - `type` (`all` | `memory` | `capsule`, default: `all`)
  - `startDate` (ISO 8601 string, optional start boundary)
  - `endDate` (ISO 8601 string, optional end boundary, must be `>= startDate`)
  - `page` (positive integer, default: 1)
  - `limit` (integer 1..100, default: 10)
  - `sortOrder` (`asc` | `desc`, default: `asc` chronological; `desc` for reverse-chronological)
  - `cursor` (base64url deterministic cursor for high-performance pagination)
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6724ab1...",
        "_id": "6724ab1...",
        "type": "memory",
        "title": "Summer Roadtrip",
        "date": "2025-06-15T12:00:00.000Z",
        "content": "Driving along the coastal highway at sunset.",
        "tags": ["travel", "summer"],
        "photos": [
          {
            "id": "6724ab2...",
            "_id": "6724ab2...",
            "url": "https://res.cloudinary.com/...",
            "signedUrl": "https://res.cloudinary.com/.../v1/...?__cld_token__=...",
            "format": "jpg",
            "width": 1920,
            "height": 1080,
            "bytes": 204800,
            "createdAt": "2025-06-15T12:05:00.000Z"
          }
        ],
        "createdAt": "2025-06-15T12:00:00.000Z",
        "updatedAt": "2025-06-15T12:00:00.000Z"
      },
      {
        "id": "6724ab3...",
        "_id": "6724ab3...",
        "type": "capsule",
        "title": "Letter to Future Self",
        "date": "2028-01-01T00:00:00.000Z",
        "unlockDate": "2028-01-01T00:00:00.000Z",
        "sealedAt": "2026-11-01T05:00:00.000Z",
        "isLocked": true,
        "isOpened": false,
        "openedAt": null,
        "createdAt": "2026-11-01T05:00:00.000Z",
        "updatedAt": "2026-11-01T05:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 10,
      "page": 1,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPrevPage": false,
      "nextCursor": "eyJkYXRlIjoiMjAyOC0wMS0wMVQwMDowMDowMC4wMDBaIiwiaWQiOiI2NzI0YWIzLi4uIn0",
      "prevCursor": "eyJkYXRlIjoiMjAyNS0wNi0xNVQxMjowMDowMC4wMDBaIiwiaWQiOiI2NzI0YWIxLi4uIn0"
    }
  }
  ```

---

## 7. HTTP Status Code Conventions

- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure (malformed JSON, invalid query params, manipulated cursor).
- `401 Unauthorized`: Missing, expired, or invalid JWT / invalid credentials.
- `403 Forbidden`: Request forbidden (e.g. attempting to read a sealed time capsule before unlock date).
- `404 Not Found`: Requested resource does not exist.
- `409 Conflict`: Conflict with existing record (e.g. duplicate email).
- `429 Too Many Requests`: Rate limit exceeded on sensitive security endpoints.
- `500 Internal Server Error`: Unhandled server exception.
