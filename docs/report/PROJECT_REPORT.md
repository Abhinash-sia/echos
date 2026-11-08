# Academic Minor Project Report

## ECHOES: A Digital Memory Vault and Personal Time Capsule

**Department of Computer Science & Engineering**  
**Bachelor of Technology (B.Tech) Minor Project**

---

### Abstract

In the modern digital era, individuals generate substantial volumes of ephemeral digital content across social networks and communication channels. However, these platforms prioritize real-time broadcast and engagement metrics rather than intimate personal reflection, secure memory preservation, and longitudinal retrospection.

This project presents **ECHOES**, a web-based Digital Memory Vault and Personal Time Capsule platform engineered to provide a private, structured sanctuary for personal experiences, multimedia narratives, and future-oriented correspondence. A standout characteristic of the platform is its cryptographic and temporal time-capsule subsystem, which securely locks personal letters and multimedia artifacts until an explicitly specified future date.

The software architecture is engineered using a unified Next.js 16 (App Router) framework in TypeScript, with server-side Route Handlers fulfilling REST API responsibilities, Mongoose ODM orchestrating document persistence in local MongoDB Community Server, and Vitest alongside MongoDB Memory Server providing a continuous automated testing pipeline. This report documents the foundational engineering, architectural synthesis, design decisions, and implementation progression across Phase 0 (Foundation) and Phase 1 (Database, Authentication & Email Subsystem).

---

### 1. Introduction

Digital archiving of personal experiences has evolved from physical diaries to decentralized digital repositories. While cloud drives provide generic storage and social platforms promote public sharing, neither offers an introspective environment designed around chronological reflection and temporal commitment.

The **ECHOES** platform addresses this gap by synthesizing:

1. **A Personal Memory Vault**: Enabling users to document reflective life events, categorize experiences via semantic tags, and attach photographs.
2. **A Temporal Time Capsule**: Empowering users to write letters to their future selves, accompanied by attachments, sealed cryptographically and procedurally until a target date arrives.

This system is developed as an academic minor project under the Computer Science & Engineering curriculum, following modern software engineering practices, rigorous type systems, and automated test-driven development.

---

### 2. Problem Statement & Objectives

#### 2.1 Problem Statement

Conventional digital storage systems suffer from three primary limitations:

1. **Lack of Temporal Privacy**: Generic storage allows immediate read access, preventing authentic "time capsule" experiences where the creator is restricted from reading their past letters before an appointed milestone.
2. **Scattered Narratives**: Personal memories are fragmented across photo galleries, chat archives, and social media feeds lacking chronological coherence.
3. **Overcomplicated Infrastructure**: Many modern web projects introduce excessive infrastructure complexity (microservices, container engines, distributed caches) disproportionate to the requirements of personal preservation platforms.

#### 2.2 Project Objectives

- **Objective 1 (Architectural Foundation)**: Establish a clean, maintainable, single-codebase full-stack Next.js and TypeScript project with automated testing and database connection management. _(Completed - Phase 0)_
- **Objective 2 (Database Modeling & Authentication)**: Implement Mongoose schemas for User, Photo, Memory, and TimeCapsule, alongside stateless, secure authentication utilizing salted bcrypt hashing, JSON Web Tokens (`jose`), HTTP-only cookies, token versioning for session revocation, and Nodemailer email delivery. _(Completed - Phase 1)_
- **Objective 3 (Memory Vault Subsystem & Media Management)**: Build robust CRUD operations allowing users to preserve, tag, and search chronological memories alongside private, authenticated Cloudinary photo management and non-transactional compensating rollbacks. _(Completed - Phase 2)_
- **Objective 4 (Time Capsule Subsystem)**: Implement an inviolable time-capsule mechanism that enforces temporal access restrictions on sealed letters. _(Phase 3 - Pending)_
- **Objective 5 (Interactive Presentation)**: Construct a responsive, accessible user interface with smooth animations and timeline navigation. _(Phase 4 - Pending)_

---

### 3. Literature Review & Technology Stack Evaluation

| Technology                       | Role                 | Evaluation Rationale                                                                                                               |
| :------------------------------- | :------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| **Next.js 16 (App Router)**      | Full-Stack Framework | Combines React 19 server rendering and native REST Route Handlers in a single build pipeline, removing Express backend redundancy. |
| **TypeScript**                   | Programming Language | Enforces compile-time type validation, reducing runtime defects across API and model boundaries.                                   |
| **MongoDB & Mongoose 9**         | Database & ODM       | Schema-flexible document database ideal for variable memory lengths, photo metadata arrays, and time capsule documents.            |
| **Zod**                          | Schema Validation    | Provides declarative runtime validation of environment configurations and HTTP request payloads.                                   |
| **`jose` & `bcrypt`**            | Security & Auth      | Standards-compliant HMAC-SHA256 JWT operations and robust password hashing with zero heavy external dependencies.                  |
| **Nodemailer**                   | Email Subsystem      | Reliable SMTP mail transport with HTML templating and testable mock support.                                                       |
| **Vitest & Mongo Memory Server** | Testing Suite        | Executes tests with sub-second turnaround against isolated in-memory database instances, eliminating manual Postman testing.       |

---

### 4. System Architecture & Design

The system employs a multi-tiered monolithic architecture organized within the `src/` hierarchy:

- **Presentation Tier**: React Server Components & Client Components styled with Tailwind CSS _(Phase 4)_.
- **API Gateway & Route Handlers**: Standardized REST endpoints in `src/app/api/**/route.ts`.
- **Validation Tier**: Zod schemas validating incoming payloads at the network boundary.
- **Security Tier**: Sliding-window rate limiting on sensitive routes, bcrypt hashing, and `tokenVersion` verification.
- **Domain & Service Tier**: Business logic governing user management, memory sequencing, and capsule sealing.
- **Email Tier**: Nodemailer transport dispatching welcome, password-reset, and password-change notifications.
- **Persistence Tier**: Mongoose schemas interacting with MongoDB via an HMR-resilient cached connection pool (`src/lib/db.ts`).

---

### 5. Implementation Status

#### 5.1 Completed Implementation: Phase 0 (Foundation)

- Next.js App Router initialization with TypeScript, ESLint, Prettier, and Turbopack.
- Zod-enforced environment configuration (`src/lib/env.ts`).
- Connection pooling and connection caching on global object (`src/lib/db.ts`).
- Vitest testing framework and in-memory database lifecycle management (`tests/helpers/db-handler.ts`).
- Initial operational health check endpoint (`GET /api/health`).

#### 5.2 Completed Implementation: Phase 1 (Database, Authentication & Email)

- **Database Models**: Implemented `User`, `Photo`, `Memory`, and `TimeCapsule` schemas with field constraints, indexes, and custom JSON serialization.
- **Authentication**:
  - `POST /api/auth/register`: Account creation with bcrypt hashing, token issuance, HTTP-only cookie setting, and welcome email.
  - `POST /api/auth/login`: Credential validation, JWT generation, and cookie storage.
  - `POST /api/auth/logout`: Server-side session invalidation (`tokenVersion++`) and cookie clearing.
  - `GET /api/auth/me`: Protected profile endpoint utilizing reusable auth guard.
- **Password Management**:
  - `POST /api/auth/forgot-password`: Generates cryptographically secure 32-byte tokens, stores SHA-256 hash with 1-hour expiration, and sends reset email.
  - `POST /api/auth/reset-password`: Single-use token verification, password update, and session revocation.
  - `PATCH /api/auth/change-password`: Current password verification, new password hashing, session revocation, and email alert.
- **Nodemailer Email Subsystem**: Configured SMTP with mockable transport, HTML templates, and graceful failure handling.
- **Security**: Sliding window IP rate limiting, SHA-256 token hashing, HTTP-only cookies with SameSite protection.

#### 5.3 Completed Implementation: Phase 2 (Memory Journal & Photo Management)

- **Memory CRUD Route Handlers**:
  - `POST /api/memories`: Creates a memory strictly bound to authenticated `userId`, validates title/content/date with Zod, normalizes tags, and initializes photos array.
  - `GET /api/memories`: Query engine supporting regex search on title and content (with ReDoS escaping), tag filtering (`$in`), date range filtering (`startDate`, `endDate`), dynamic sorting by `memoryDate` (`asc` / `desc`), and paginated response envelope (`page`, `limit`, `total`, `totalPages`, `hasPrev`, `hasNext`). Populates photos with signed delivery URLs.
  - `GET /api/memories/:id`: Retrieves individual memory with signed photo URLs. Strict ownership check returns 404 for unowned resources.
  - `PATCH /api/memories/:id`: Partial memory updates (`title`, `content`, `memoryDate`, `tags`) with ownership enforcement.
  - `DELETE /api/memories/:id`: Cascading memory deletion: queries attached photos, purges each asset from Cloudinary via API destroy, removes `Photo` documents from MongoDB, and deletes the `Memory`.
- **Photo Management & Cloudinary Integration**:
  - `POST /api/memories/:id/photos`: Accepts multipart image uploads, validates binary magic bytes (JPEG, PNG, GIF, WebP, AVIF) and 10MB limits, uploads to Cloudinary with `type: 'authenticated'`, persists `Photo` document, and links to `Memory.photos`. Employs compensating rollbacks to destroy uploaded Cloudinary assets if MongoDB persistence fails.
  - `GET /api/memories/:id/photos`: Lists all photos for a memory with dynamic signed delivery URLs.
  - `DELETE /api/memories/:id/photos/:photoId`: Unlinks photo from memory, removes MongoDB document, and purges Cloudinary asset.
  - `PATCH /api/memories/:id/photos/:photoId`: Relocates photo to `targetMemoryId` owned by the same user with atomic link transfer and compensating rollback.
- **Privacy Architecture**: All photos use Cloudinary's `type: 'authenticated'` delivery mode, preventing direct public access. Time-limited signed delivery URLs (hardened 15-minute expiry) are generated dynamically for authenticated owners.

#### 5.4 Completed Implementation: Phase 3 (Time Capsule Date-Locking Subsystem)

- **Temporal Authority & Date-Locking**:
  - The server acts as the sole, inviolable authority for temporal locking based on server-side `now < unlockDate`.
  - `TimeCapsule.isLocked(now?: Date)` evaluates access strictly on date comparison; `isOpened` is forbidden from acting as a substitute for unlock date validation.
- **Time Capsule Route Handlers**:
  - `POST /api/capsules`: Creates and seals a new time capsule. Validates future unlock date, sets `userId` from authenticated session, initializes `sealedAt = now` and `isOpened = false`. Enforces photo ownership and rejects arbitrary external URLs. Lifecycle tampering is strictly prevented.
  - `GET /api/capsules`: Lists user's capsules with pagination and chronological sorting. Sealed content redaction ensures that for locked capsules (`isLocked === true`), the secret letter message and photo references are omitted completely.
  - `GET /api/capsules/:id`: Enforces user isolation (404 for unowned). Returns `403 Forbidden` if accessed before `unlockDate`. Unlocked capsules reveal full letters and photos with time-limited signed delivery URLs.
  - `POST /api/capsules/:id/open`: Milestone unsealing endpoint. Rejects with `403 Forbidden` if server time is earlier than `unlockDate`. Sets `isOpened = true` and `openedAt = server_time`. The operation is idempotent and safe to repeat without altering the original opening timestamp.
  - `DELETE /api/capsules/:id`: Allows authenticated owners to delete capsules. Safely purges exclusively attached photo assets (`memoryId == null`) from Cloudinary and MongoDB while preserving photos shared with memories.
- **Model Integrity**: Added `photos: [ObjectId]` reference array to `TimeCapsule` schema and updated `Photo` pre-delete hooks to cleanly unlink removed photos from capsules.

#### 5.5 Completed Implementation: Phase 4 (Unified Timeline & Backend Integration)

- **Unified Chronological Timeline (`GET /api/timeline`)**:
  - Combines personal journal memories and time capsules into a single coherent chronological stream.
  - **Date Semantics**: The primary `date` field represents `memoryDate` for memories (historical occurrence) and `unlockDate` for capsules (temporal milestone arrival). Capsule entries also expose `sealedAt` (origination date) and `unlockDate` for full transparency.
  - **Dual Pagination Architecture**: Supports deterministic cursor-based pagination using URL-safe base64 `{ date, id }` tokens with secondary tie-breaking on `_id` to prevent skipped or duplicate items during concurrent inserts, alongside traditional `page`/`limit` offset pagination.
  - **Filtering**: Supports type filtering (`type=all|memory|capsule`), chronological sorting (`sortOrder=asc|desc`), and ISO date range boundary filtering (`startDate`, `endDate`).
  - **Strict Zero-Leakage Privacy Invariants**: Evaluates lock status at runtime on the server; completely omits `content`, `message`, `photos`, `photoUrls`, and private Cloudinary IDs for locked capsules.
  - **Database & Query Performance**: Executes a single MongoDB aggregation pipeline with `$unionWith` merging memories and capsules at the database level. Eliminates N+1 queries by batch-populating photos for only the sliced page items.
  - **Database Indexing**: Added compound indexes `{ userId: 1, memoryDate: 1, _id: 1 }` and `{ userId: 1, unlockDate: 1, _id: 1 }` to support high-speed timeline sorting and deterministic tie-breaking.

#### 5.6 Pending Implementation (Future Phases)

- _Phase 5_: Frontend UI, Responsive Dashboard, Memory Vault UI, Timeline Visualization, and Time Capsule Animations. _(Status: Pending)_
- _Phase 6_: Final Polish, Security Audit, Academic Defense Preparation. _(Status: Pending)_

---

### 6. Testing Strategy & Results

The project adheres to automated testing principles. All verification is handled programmatically through Vitest without reliance on manual GUI tools like Postman.

#### 6.1 Phase 4 Test Execution Summary

- **Test Framework**: Vitest v5.0.5 with V8 code coverage provider.
- **In-Memory Database**: MongoDB Memory Server v11.3.0.
- **Cloudinary Isolation**: In-memory mocking harness (`setMockCloudinary`) intercepting upload, destroy, and URL generation with zero external network access.
- **Test Files Executed**: 13 (`db.test.ts`, `env.test.ts`, `health.test.ts`, `models.test.ts`, `email.test.ts`, `auth.test.ts`, `password.test.ts`, `rate-limit.test.ts`, `media.test.ts`, `memory.test.ts`, `photo.test.ts`, `capsule.test.ts`, `timeline.test.ts`).
- **Total Tests Passed**: 186 / 186 (100% pass rate across 13 test suites).
- **Code Coverage**: 86.11% statement coverage, 86.38% line coverage, 85.00% function coverage, and 75.18% branch coverage across application modules.
- **Production Build Status**: Next.js production build (`npm run build`) completed successfully with zero type or lint errors across 18 Route Handlers.

---

### 7. Conclusion & Next Steps

Phase 4 successfully delivers the complete backend integration and unified chronological timeline subsystem for ECHOES, uniting personal journal memories and temporal time capsules with database-level `$unionWith` efficiency, unbreakable privacy guarantees, and deterministic cursor pagination.

Upon formal review and approval of Phase 4, project execution will proceed to **Phase 5: Frontend Development & Timeline Visualization Interface**.
