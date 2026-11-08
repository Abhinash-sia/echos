# Architectural Decision Records (ADRs)

## ECHOES — Digital Memory Vault & Personal Time Capsule

---

## ADR 001: Next.js App Router Route Handlers over Separate Express Backend

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  The project requires a robust RESTful API layer for memory preservation, authentication, and time capsule management. A common architecture pairs a React single-page application with a standalone Express/Node.js server.
- **Decision**:
  Implement all REST APIs as Next.js Route Handlers (`src/app/api/**/route.ts`) within a unified repository rather than maintaining a separate Express backend.
- **Consequences**:
  - **Positive**: Single codebase, shared TypeScript types across client and server, unified deployment, no CORS configuration complexities during local development.
  - **Trade-off**: Route Handlers run in Next.js server runtime; long-lived persistent WebSocket connections or non-HTTP background daemons require specific scheduling patterns.

---

## ADR 002: MongoDB Community Server with Mongoose and Connection Caching

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  The application handles narrative journal entries, tags, and media attachment references. In Next.js development mode, Hot Module Replacement (HMR) triggers frequent server re-evaluations, which can instantiate redundant database connections and exhaust connection pools.
- **Decision**:
  Use MongoDB Community Server (local `mongodb://127.0.0.1:27017/echoes`) managed via Mongoose ODM. Implement a singleton connection cache on the Node.js `global` object (`src/lib/db.ts`).
- **Consequences**:
  - **Positive**: Zero external cloud cost during development, reliable offline development, prevention of connection leaks during hot reloading.
  - **Trade-off**: Requires local MongoDB Community Server installed on development machines.

---

## ADR 003: Vitest and MongoDB Memory Server for Automated Testing

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  Reliable automated testing requires testing database interactions without mutating local development data or depending on an active external database daemon. Traditional tools like Postman are manual and do not provide continuous integration capabilities.
- **Decision**:
  Adopt **Vitest** as the test runner coupled with **`mongodb-memory-server`** for isolated in-memory MongoDB instances.
- **Consequences**:
  - **Positive**: Tests run in milliseconds directly against TypeScript code without pre-compilation; in-memory database guarantees test isolation and zero side-effects on local databases.
  - **Trade-off**: First-time test execution incurs a one-time binary download for the in-memory MongoDB engine.

---

## ADR 004: Zod for Runtime Validation at System Boundaries

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  TypeScript provides compile-time type safety but is stripped at runtime. Incoming HTTP request bodies, route params, and environment variables can contain malformed or malicious data.
- **Decision**:
  Utilize **Zod** schemas for environment variable validation at startup and for all incoming API request payloads.
- **Consequences**:
  - **Positive**: Strict input validation, deterministic error messages formatted for client consumption, automatic TypeScript type inference from schemas (`z.infer<T>`).
  - **Trade-off**: Small runtime validation overhead, negligible for web workloads.

---

## ADR 005: Stateless Authentication with `jose` (JWT) and `bcrypt`

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  The application needs secure user authentication without introducing stateful session storage such as Redis.
- **Decision**:
  Use `bcrypt` for salted password hashing and `jose` for lightweight, standards-compliant JSON Web Token (JWT) signing and verification.
- **Consequences**:
  - **Positive**: No external session store required; stateless token validation works across serverless and server runtimes alike; `jose` is edge-compatible.
  - **Trade-off**: Token revocation before expiration requires token versioning or short expiration windows (`JWT_EXPIRES_IN=7d`).

---

## ADR 006: Code Quality Standards with ESLint and Prettier

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  Maintaining consistent code style, catching errors early, and enforcing academic project hygiene across pair programming and evaluations.
- **Decision**:
  Enforce ESLint (flat config) and Prettier with dedicated npm scripts (`npm run lint`, `npm run format`, `npm run format:check`).
- **Consequences**:
  - **Positive**: Enforces uniform code style and catches unused variables or syntax traps before commit.

---

## ADR 007: Token Versioning (`tokenVersion`) for Session Invalidation

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  Pure stateless JWTs cannot be revoked prior to expiration unless an explicit invalidation mechanism is introduced. Logging out or resetting passwords should immediately render previously issued tokens inoperable.
- **Decision**:
  Embed an integer `tokenVersion` inside each issued JWT and store the active `tokenVersion` on the `User` document. On logout, password reset, or password change, `tokenVersion` is incremented. The authentication guard verifies `payload.tokenVersion === user.tokenVersion`.
- **Consequences**:
  - **Positive**: Immediate, true server-side token revocation without requiring a distributed cache like Redis.
  - **Trade-off**: Authenticated requests perform a lightweight single-document primary key lookup, which aligns naturally with user profile retrieval.

---

## ADR 008: Cryptographic Token Hashing for Password Resets

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  Storing password reset tokens in plaintext exposes users to account takeover if the database is compromised.
- **Decision**:
  Generate a 32-byte cryptographically secure random token (`crypto.randomBytes(32).toString('hex')`). Deliver the raw unhashed token via email, but store only its SHA-256 hash (`passwordResetTokenHash`) in the database alongside a 1-hour expiration timestamp.
- **Consequences**:
  - **Positive**: Eliminates risk of token compromise from database read leaks; tokens are strictly single-use and invalidated upon successful reset.

---

## ADR 009: Decoupled Nodemailer Service with Transport Inversion

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  Transactional emails (welcome notifications, password resets, security alerts) are vital. However, tight coupling to an external SMTP server would cause test flakiness and offline development issues.
- **Decision**:
  Implement a dedicated email subsystem in `src/lib/email/` with dependency inversion: `setTestTransporter()` allows unit and integration tests to inject mock transports, while production uses environment-driven SMTP configuration.
- **Consequences**:
  - **Positive**: 100% offline, zero-network test execution; errors in SMTP delivery are caught gracefully and logged without blocking user registrations or password resets.

---

## ADR 010: In-Memory Sliding Window Rate Limiting for Security Endpoints

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  Authentication and password reset endpoints are vulnerable to credential stuffing, brute-force attacks, and email flooding.
- **Decision**:
  Implement a lightweight sliding-window rate limiter in `src/lib/security/rate-limit.ts` tracking IP addresses. Prioritize proxy headers (`cf-connecting-ip`, `x-real-ip`) over raw `x-forwarded-for` and validate IP format to prevent spoofing.
- **Consequences**:
  - **Positive**: Mitigates automated brute-force attacks without requiring external infrastructure.
  - **Limitation**: Memory store is process-local and applies to single-instance deployments.

---

## ADR 011: TimeCapsule Temporal Invariant (`unlockDate` Canonical, `sealedAt`, `isLocked()`)

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  Ambiguity can arise between `unlockDate` and `unlockAt`, and developers might mistakenly rely on `isOpened: boolean` to determine if a capsule is accessible.
- **Decision**:
  Standardize `unlockDate: Date` as the canonical schema field (matching `memoryDate`). Provide `unlockAt` as a virtual alias (getter and setter). Introduce `sealedAt: Date` (default: `Date.now`). Implement `isLocked(now?: Date): boolean` to strictly enforce that access is determined by date comparison (`now < unlockDate`), not by `isOpened`.
- **Consequences**:
  - **Positive**: Guarantees date-locking invariants cannot be bypassed by manipulating the `isOpened` flag.

---

## ADR 012: Bidirectional Lifecycle Integrity for Photo–Memory Relationships

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  Photos can be associated with memories. If a memory or photo is deleted without synchronizing both sides, orphaned references will accumulate.
- **Decision**:
  Implement pre-delete Mongoose hooks (`findOneAndDelete`):
  1. When a `Memory` is deleted, all referencing `Photo` documents have `memoryId` updated to `null`.
  2. When a `Photo` is deleted, its ID is pulled from any referencing `Memory.photos` array (`$pull`).
- **Consequences**:
  - **Positive**: Database references remain consistent and clean without requiring manual cascade logic in API handlers.

---

## ADR 013: Atomic Document Updates for Concurrency Safety in Password Reset

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  If a password reset endpoint reads the user document and writes it back in separate steps, two concurrent requests with the same token could both succeed.
- **Decision**:
  Execute the token lookup and password update atomically using `User.findOneAndUpdate` conditioned on `{ passwordResetTokenHash: hashedToken, passwordResetExpires: { $gt: new Date() } }`, setting the token fields to `null` and updating the password hash in a single atomic database operation.
- **Consequences**:
  - **Positive**: Concurrency-safe; race conditions and token double-spend attacks are mathematically impossible.

---

## ADR 014: CSRF Defense-in-Depth for Ambient Cookie Authentication

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  State-changing requests using ambient HTTP-only cookies could be vulnerable to cross-site request forgery if browser SameSite policies are relaxed or bypassed.
- **Decision**:
  In `src/lib/auth/guard.ts`, inspect state-changing requests (`POST`, `PATCH`, `PUT`, `DELETE`) authenticated via cookies:
  1. Reject requests if `Sec-Fetch-Site` is `cross-site`.
  2. Validate that the incoming `Origin` header matches the request `Host`.
- **Consequences**:
  - **Positive**: Complete defense against cross-site request forgery for cookie sessions; requests using explicit Bearer headers remain unaffected.

---

## ADR 015: Phase 1 Code Audit Hardening & Canonical Schema Decisions

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  During the Phase 1 final code audit, five areas were audited and hardened:
  1. TimeCapsule field naming (`unlockDate` vs `unlockAt`), `sealedAt`, and locking verification vs `isOpened`.
  2. Photo–Memory reference cleanup during document-level `doc.deleteOne()` vs query `findOneAndDelete`.
  3. Header spoofing in rate-limiting IP extraction (`X-Forwarded-For` leftmost vs rightmost candidate) and IPv6 validation.
  4. Missing rate limiting on `PATCH /api/auth/change-password`.
  5. CSRF defense for `POST /api/auth/logout`.
- **Decision**:
  1. **Canonical Schema**: Standardize `unlockDate` as the canonical database field for `TimeCapsule`, with `unlockAt` preserved as a virtual alias (getter/setter). Enforce `sealedAt: Date` (default: `Date.now`). Forbid using `isOpened` as a substitute for checking unlock time; enforce `isLocked(now?: Date): boolean` based strictly on `now < this.unlockDate`.
  2. **Bidirectional Relationship Cleanup**: Registered both `findOneAndDelete` and document `deleteOne` (`{ document: true, query: false }`) hooks on `Photo` and `Memory` schemas so that unlinking occurs regardless of the deletion method used.
  3. **Rightmost Proxy IP & Native Validation**: Extracted client IP by searching `x-forwarded-for` from right to left (retaining the IP appended by the trusted reverse proxy) and replaced regexes with Node's native RFC-compliant `net.isIP()`.
  4. **Password Change Throttle**: Applied 5 attempts per 15 minutes sliding-window rate limit on `PATCH /api/auth/change-password`.
  5. **Logout CSRF Protection**: Enforced `validateCsrf` on `POST /api/auth/logout` to prevent unauthorized cross-origin forced logout.
- **Consequences**:
  - **Positive**: Eliminates IP-spoofing bypass, prevents orphan references under all deletion patterns, secures session termination, and prevents brute-force password change attempts.

---

## ADR 016: Memory Journal Subsystem Architecture, Cloudinary Private Authenticated Delivery, and Compensating Rollbacks

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  Echoes is a private memory vault. Photographs uploaded by users must never be exposed via permanent, publicly accessible Cloudinary URLs. Furthermore, because local standalone MongoDB lacks replica set multi-document transactions, operations spanning Cloudinary and MongoDB (such as uploading photos, deleting memories, or moving photos) cannot use ACID 2-phase commits.
- **Decision**:
  1. **Cloudinary Authenticated Privacy Delivery**:
     - Upload photographs using Cloudinary delivery type `authenticated` (`type: 'authenticated'`). Normal public CDN URLs to these assets return HTTP 401/404.
     - On-demand URL signing: When an authenticated owner retrieves a memory or photo list, the server dynamically signs the delivery URL (`sign_url: true`, `type: 'authenticated'`, `expires_at: 1 hour`).
     - Cloudinary credentials (`API_KEY`, `API_SECRET`) remain exclusively on the server.
  2. **Compensating Rollbacks for Non-Transactional Integrity**:
     - Safe ordering: upload asset to Cloudinary -> persist `Photo` document in MongoDB -> update `Memory.photos`.
     - If database persistence fails after Cloudinary upload succeeds, immediately invoke `cloudinary.uploader.destroy(publicId)` to delete the orphaned asset before returning error 500.
     - When moving a photo between memories: pull from source memory -> push to target memory -> update `Photo.memoryId`. If the target update fails, immediately restore the photo reference in the source memory.
     - Memory deletion cascading: when `DELETE /api/memories/:id` is called, all associated photos are queried, destroyed in Cloudinary, and removed from MongoDB.
  3. **Strict User Scoping & Zero-Trust IDOR Prevention**:
     - Every query strictly binds `{ userId: auth.user._id }`.
     - Invalid IDs or attempts to access another user's memories return HTTP 404 (preventing resource existence enumeration).
- **Consequences**:
  - **Positive**: Zero public exposure of private photos, zero dangling assets across Cloudinary and MongoDB without needing replica sets, and complete IDOR defense.

---

## ADR 017: Phase 2 Code Hardening, Deletion Reliability, and Search Index Optimization

- **Status**: Accepted
- **Date**: 2026-10-31
- **Context**:
  During the Phase 2 final hardening audit, key reliability, privacy, and query concerns were audited:
  1. Signed URL lifetime of 1 hour is unnecessarily long for private viewing sessions.
  2. If Cloudinary destruction fails during photo or memory deletion, deleting MongoDB records prematurely permanently loses the `publicId`, preventing retry and creating unidentifiable orphaned assets.
  3. Photo relocation rollback only restored the source memory, leaving a dangling reference in the target memory if updating the photo pointer failed.
  4. Search query had no length boundary, and date range filters did not validate `startDate <= endDate` or malformed date strings.
  5. Missing multikey compound index `{ userId: 1, tags: 1 }` on `Memory` and compound index `{ userId: 1, memoryId: 1 }` on `Photo`.
- **Decision**:
  1. **Shortened Signed URL TTL**: Reduced default signed URL expiry from 3600s (1 hour) to 900s (15 minutes). Cloudinary validates the HMAC and rejects expired requests.
  2. **Reliable Deletion Workflow**: Attempt Cloudinary destruction first. If Cloudinary fails (e.g. 502/timeout), preserve the MongoDB document and return HTTP 502 Bad Gateway. Because `deleteCloudinaryPhoto` treats `not found` as success, retrying the operation will proceed idempotently without creating orphaned assets.
  3. **Robust Two-Way Relocation Rollback**: In `PATCH /api/memories/:id/photos/:photoId`, track mutation states (`pulledFromSource`, `addedToTarget`). If saving the photo pointer fails, pull from the target memory and restore to the source memory in reverse order.
  4. **Strict Query & Filter Validation**: Enforce maximum search length of 100 characters, validate ISO dates, and reject `startDate > endDate` with HTTP 400.
  5. **Query Indexes**: Added `{ userId: 1, tags: 1 }` multikey compound index to `Memory` and `{ userId: 1, memoryId: 1 }`, `{ publicId: 1 }` (unique) indexes to `Photo`. Documented that unanchored substring regex search intentionally uses `{ userId: 1, memoryDate: -1 }` to scope to user documents before regex matching.
  6. **Safe Logging**: Sanitized all Cloudinary error logging to log only `error.message`, ensuring secrets are never logged.
- **Consequences**:
  - **Positive**: Hardened privacy, guaranteed retryability on storage failures without orphaned assets, bidirectional reference consistency during failure rollbacks, and fast indexed tag querying.

---

## ADR 018: Time Capsule Temporal Inviolability, Sealed Content Redaction, and Resource Cleanup Safety

- **Status**: Accepted
- **Date**: 2026-11-01
- **Context**:
  Phase 3 introduces the digital Time Capsule subsystem for ECHOES. Unlike standard storage records, time capsules represent messages and photographs locked until an appointed future milestone. Key architectural challenges include:
  1. **Temporal Authority**: Client system clocks are untrustworthy and subject to user manipulation.
  2. **Zero Information Leakage**: Sealed letter contents and attached private photos must never be exposed via listing endpoints, single-item lookups, or error messages while locked.
  3. **Photo Ownership & External URL Injection**: Users must not attach photos belonging to other users or inject arbitrary external image URLs into capsules.
  4. **Lifecycle Immutability**: Capsule contents (`title`, `message`, `photos`, `unlockDate`) cannot be edited once sealed; client cannot manipulate `isOpened`, `openedAt`, `sealedAt`, or `userId`.
  5. **Deletion Resource Integrity**: Deleting a capsule must cleanly delete exclusively attached photo assets (`memoryId == null`) from Cloudinary and MongoDB, while preserving photos shared with memory journal entries.
- **Decision**:
  1. **Server as Sole Temporal Authority**:
     - All lock evaluations strictly compare server-side `new Date()` against `capsule.unlockDate`.
     - `capsule.isLocked(now?: Date)` instance method is the sole authority; `isOpened` is strictly treated as a user-interaction flag and never as an access authorization check.
     - `POST /api/capsules/:id/open` and `GET /api/capsules/:id` return `HTTP 403 Forbidden` if server time is earlier than `unlockDate`.
  2. **Strict Redaction in List & Retrieval**:
     - In `GET /api/capsules`, if `isLocked` evaluates to `true`, the `message`, `photos`, and `photoUrls` fields are completely omitted from the response, ensuring zero leakage of sealed letters or private photo references.
     - In `GET /api/capsules/:id`, accessing a locked capsule returns `HTTP 403 Forbidden` with the unlock date metadata, completely withholding sealed letter content.
  3. **Photo Ownership & External URL Prevention**:
     - In `POST /api/capsules`, all referenced photo IDs are cross-referenced with `Photo.find({ _id: { $in: ids }, userId: auth.user._id })`. Mismatched or non-owned IDs return `HTTP 400 Bad Request`.
     - Arbitrary external photo URLs are forbidden; URL references must resolve to existing `Photo` records owned by the authenticated user.
  4. **Strict Lifecycle Immutability**:
     - Zod schema explicitly forbids client tampering with `userId`, `isOpened`, `openedAt`, and `sealedAt` via `z.never()`.
     - The server initializes `sealedAt = now`, `isOpened = false`, and `userId = auth.user._id`.
     - No general update (`PATCH`/`PUT`) route is exposed for capsules.
  5. **Idempotent Milestone Unsealing**:
     - `POST /api/capsules/:id/open` allows safe, idempotent re-opening once the unlock date has passed. If already opened, `openedAt` is preserved and not overwritten.
  6. **Safe Associated Resource Cleanup**:
     - In `DELETE /api/capsules/:id`, only exclusive photos (`memoryId == null` and owned by `auth.user._id`) are destroyed from Cloudinary and removed from MongoDB. Shared photos are preserved.
- **Consequences**:
  - **Positive**: Guaranteed temporal privacy, inviolable date-locking with zero data leakage, complete IDOR prevention across photos and capsules, and clean asset lifecycle management without orphaned Cloudinary files.

---

## ADR 019: Unified Timeline Subsystem Architecture, Date Semantics, MongoDB $unionWith Aggregation, and Deterministic Cursor Pagination

- **Status**: Accepted
- **Date**: 2026-11-01
- **Context**:
  Phase 4 integrates the Memory Journal and Time Capsule subsystems into a single chronological timeline endpoint (`GET /api/timeline`). Key architectural decisions required:
  1. **Date Semantics & Continuum Interpretation**: Memories have a past occurrence timestamp (`memoryDate`). Time capsules have both an origination timestamp (`sealedAt`) and a future maturity milestone (`unlockDate`). The timeline needs a unified, intuitive, and consistent interpretation of `date`.
  2. **Database Performance & Memory Boundaries**: Loading all user memories and capsules into Node.js application memory to sort and paginate in JavaScript risks high memory consumption, unbounded queries, and N+1 database operations.
  3. **Strict Zero-Leakage Privacy Invariants**: The timeline must not create a backdoor around Phase 3 date-locking rules. Locked capsules must redact private letters, photo attachments, and Cloudinary IDs.
  4. **Pagination Strategy & Total Ordering**: Timelines require stable pagination that avoids skipping or duplicating items when new records are inserted concurrently. Secondary sorting must handle identical timestamps deterministically.
- **Decision**:
  1. **Unified Timeline Date Semantics**:
     - For **Memory Entries**: `date` represents `memoryDate` (the chronological moment when the event occurred).
     - For **Capsule Entries**: `date` represents `unlockDate` (the milestone arrival moment when the capsule is scheduled to be unsealed or was unsealed). Capsule entries also explicitly expose `sealedAt` (origination timestamp) and `unlockDate` so clients can render both dimensions.
     - Placing capsules at `unlockDate` accurately depicts the timeline as a life continuum: historical journal reflections in the past, and upcoming locked capsules positioned along the future horizon.
  2. **Database-Level `$unionWith` Aggregation**:
     - Executes a single MongoDB aggregation pipeline utilizing `$unionWith` to merge `memories` and `timecapsules` at the database engine level.
     - Uses index-backed `$match` filters (`{ userId: 1, memoryDate: ... }` and `{ userId: 1, unlockDate: ... }`) before projection.
     - Sorts and slices inside MongoDB (`$sort`, `$skip`, `$limit`), ensuring only the requested page of items (bounded by `limit <= 100`) is transferred over the wire.
  3. **Batch Photo Population (Zero N+1 Queries)**:
     - Collects photo ObjectIds only from the sliced page documents (strictly excluding locked capsules).
     - Executes a single batch query `Photo.find({ _id: { $in: photoIds }, userId: auth.user._id })`.
     - Hydrates items with signed Cloudinary delivery URLs in a single pass.
  4. **Dual Pagination (Deterministic Cursor & Offset)**:
     - **Deterministic Cursor**: Encodes `{ date: ISOString, id: ObjectIdString }` into a URL-safe base64 token. Uses composite boundary comparisons (`date` condition with deterministic secondary tie-breaking on `_id`). Cursors are validated against forgery/corruption; invalid cursors return `400 Bad Request`.
     - **Offset Pagination**: Supports `page` and `limit` for traditional pagination controls, while documenting potential item-shift limitations during concurrent inserts.
  5. **Absolute Privacy Preservation**:
     - Server determines lock status at runtime using `now.getTime() < item.unlockDate.getTime()`.
     - Locked capsules have `content`, `message`, `photos`, `photoUrls`, and private Cloudinary IDs completely omitted.
- **Consequences**:
  - **Positive**: Blazing fast database-level aggregation, zero memory bloat, zero N+1 queries, unbreakable temporal privacy, and stable pagination with deterministic tie-breaking.

---

## ADR 020: Phase 5A Frontend Design Foundation, Editorial Minimalism, and Native WebGL2 3D Architecture

- **Status**: Accepted
- **Date**: 2026-11-01
- **Context**:
  Echoes requires an award-winning, editorial frontend experience combining Japanese minimalism, independent photography monographs, and cinematic digital storytelling.
  Evaluation of 3D and animation toolchains revealed:
  1. Package manager security environment enforces `allow-remote = "none"`, preventing remote npm package downloading.
  2. Ecosystem compatibility: `@react-three/fiber` and `@react-three/drei` have documented peer dependency conflicts with `react@19.3.0` and Next.js 16 App Router.
  3. Performance and accessibility requirements mandate pausing rendering when offscreen, reduced-motion compliance, and mobile thermal protection.
- **Decision**:
  1. **Dual Visual Identity System (Editorial Light & Cinematic Dark)**:
     - Established design tokens in `src/styles/tokens.css` with CSS variables and Tailwind v4 inline theme mappings.
     - Editorial Light: Warm archival paper (`#FAF7F2`), cream canvas (`#F4EFEA`), deep sumi ink (`#1F1C18`), cinnabar terracotta (`#C05A3E`), and antique brass (`#B38642`).
     - Cinematic Dark: Obsidian base (`#0C0B0E`), smoked charcoal (`#141318`), warm luminous silk (`#F7F4EE`), and amber gilt (`#D4A359`).
  2. **Typography Scale**:
     - Paired display serif (Newsreader / Cormorant Garamond) for contemplative reflection with geometric sans (Plus Jakarta Sans / Inter) for UI clarity, and monospace for temporal timestamps.
  3. **Modular Reusable Primitives**:
     - Created accessible typography primitives (`Heading`, `Text`, `Kicker`, `Quote`), tactile buttons and links (`Button`, `EditorialLink`, `IconButton`), cards (`Card`, `MemoryCard`, `CapsuleTeaserCard`), image framing (`ImageFrame` with 35mm film borders and captions), form elements (`Input`, `Textarea`, `Toggle`), status stamps (`Badge`), loading skeletons (`Skeleton`), empty states (`EmptyState`), and dialogs (`Modal`).
  4. **Native WebGL2 3D Scene Architecture**:
     - Created isolated, reusable `WebGLCanvas` wrapper component with automatic WebGL2/WebGL1 context detection and graceful static fallback.
     - Integrated `IntersectionObserver` to pause `requestAnimationFrame` rendering when scrolled out of viewport.
     - Clamped device pixel ratio: `Math.min(window.devicePixelRatio, 2)` to protect mobile thermals and battery.
     - Handled `prefers-reduced-motion` to dampen or freeze animation loops.
     - Implemented custom GLSL ray-marching shader scene (`MemoryOrbScene`) rendering an ethereal, floating celestial memory orb with organic breathing pulsation, iridescent Fresnel rim lighting, warm specular highlights, and an orbiting stardust constellation with interactive pointer parallax tilt.
     - Structured renderer with clean `SceneRenderer` interface separating canvas lifecycle, GLSL compilation, and frame updates.
  5. **Showcase Development Route**:
     - Created interactive development showcase page at `/showcase` demonstrating typography, tokens, 3D WebGL scene, cards, image treatments, and modal dialogs.
- **Consequences**:
  - **Positive**: Distinctive cinematic editorial aesthetic; zero external heavy dependencies; zero React 19 peer-dependency conflicts; smooth hardware-accelerated WebGL2 3D graphics with DPR clamping; accessible with keyboard navigation, reduced motion, and responsive viewport support.
