# Implementation Progress Tracker

## ECHOES — Digital Memory Vault & Personal Time Capsule

---

## Overall Phase Roadmap

|    Phase    | Description                                           |    Status     | Completion Target |
| :---------: | :---------------------------------------------------- | :-----------: | :---------------: |
| **Phase 0** | **Project Foundation & Engineering Setup**            | **COMPLETED** |  **2026-10-31**   |
| **Phase 1** | **Database, Authentication & Email System (Audited)** | **COMPLETED** |  **2026-10-31**   |
| **Phase 2** | **Memory Journal & Cloudinary Photo Subsystem**       | **COMPLETED** |  **2026-10-31**   |
| **Phase 3** | **Time Capsule Date-Locking Subsystem**               | **COMPLETED** |  **2026-11-01**   |
| **Phase 4** | **Unified Timeline & Backend Integration**            | **COMPLETED** |  **2026-11-01**   |
| **Phase 5** | **Frontend Development & UI (Stages 1–8)**            | **COMPLETED** |  **2026-11-04**   |
| **Phase 6** | **Security Audit, Final Polish & Defense Prep**       |   _Pending_   |        TBD        |

---

## Detailed Phase Breakdown

### Phase 0: Project Foundation (Completed)

- [x] **Project Initialization**: Next.js App Router bootstrapped with TypeScript, ESLint, and Turbopack.
- [x] **Directory Architecture**: Established modular `src/` layout (`app/api`, `lib`, `models`, `types`, `validations`).
- [x] **Dependencies Installation**: `mongoose`, `zod`, `jose`, `bcrypt`, `cloudinary`, `next`, `react`, `vitest`, `mongodb-memory-server`, `prettier`.
- [x] **Environment Configuration**: Created `.env.example` with local database URI `mongodb://127.0.0.1:27017/echoes`.
- [x] **Database Connection Pooling**: Built `src/lib/db.ts` with global caching to prevent connection leakage under Next.js HMR.
- [x] **Verified Local Database**: Successfully tested local connection to MongoDB Community Server on `mongodb://127.0.0.1:27017/echoes`.
- [x] **Automated Testing Setup**: Configured Vitest (`vitest.config.mts`) and MongoDB Memory Server helper (`tests/helpers/db-handler.ts`).
- [x] **Initial Documentation**: Created initial architecture, database design, API specification, decisions, and report files.

---

### Phase 1: Database, Authentication & Email System (Completed & Audited)

- [x] **Database Models & Lifecycle Integrity**:
  - [x] `User`: Email uniqueness, bcrypt password hash (`select: false`), `tokenVersion` for session revocation, reset token hash & expiration, safe JSON serialization.
  - [x] `Photo`: Cloudinary publicId, URL, dimensions, user reference, and pre-delete hook unlinking photos from memories.
  - [x] `Memory`: User reference, memoryDate, normalized tags, photo references, compound index `{ userId: 1, memoryDate: -1 }`, and pre-delete hook unlinking photos.
  - [x] `TimeCapsule`: User reference, title, message, canonical `unlockDate`, `unlockAt` virtual, `sealedAt` timestamp, `isOpened` user flag, `isLocked()` invariant check, compound index `{ userId: 1, unlockDate: 1 }`.
  - [x] Models registry in `src/models/index.ts`.
- [x] **Authentication Subsystem**:
  - [x] `POST /api/auth/register`: Validation with Zod, bcrypt hashing (rounds=10), JWT generation, HTTP-only cookie setting, welcome email trigger.
  - [x] `POST /api/auth/login`: Credential validation, bcrypt comparison, JWT generation, HTTP-only cookie setting.
  - [x] `POST /api/auth/logout`: Server-side session invalidation (`tokenVersion++`) and cookie clearing (`maxAge: 0`).
  - [x] `GET /api/auth/me`: Protected route returning sanitized user profile.
  - [x] Reusable authentication guard in `src/lib/auth/guard.ts`.
  - [x] CSRF defense-in-depth on cookie-authenticated state-changing requests (Origin & Sec-Fetch-Site validation).
- [x] **Password Management**:
  - [x] `POST /api/auth/forgot-password`: Generates cryptographically secure 32-byte token, stores SHA-256 hash with 1-hour expiration, sends reset link via Nodemailer, rolls back token on email failure, returns generic response.
  - [x] `POST /api/auth/reset-password`: Atomic `findOneAndUpdate` ensuring race-condition prevention during concurrent reset attempts, updates password hash, clears reset fields, increments `tokenVersion`, sends confirmation email.
  - [x] `PATCH /api/auth/change-password`: Verifies current password, hashes new password, increments `tokenVersion`, issues refreshed token, sends confirmation email.
- [x] **Nodemailer Email Subsystem**:
  - [x] Transporter setup in `src/lib/email/mailer.ts` with mock support (`setTestTransporter()`).
  - [x] HTML & text templates with XSS escaping (`src/lib/email/templates.ts`).
  - [x] Domain services (`src/lib/email/service.ts`) for welcome, reset, and password-change notifications.
  - [x] Graceful error handling and token rollback on failed delivery.
- [x] **Security Implementations**:
  - [x] In-memory sliding-window IP rate limiter hardened against IP header spoofing (`src/lib/security/rate-limit.ts`).
  - [x] SHA-256 token hashing in database (zero plaintext reset tokens stored).
  - [x] HTTP-only cookies with SameSite protection and production SSL enforcement.
  - [x] Generic responses on forgot-password preventing user enumeration.
- [x] **Automated Testing**:
  - [x] 67 unit and integration tests across 8 test suites.
  - [x] 100% test pass rate using isolated `mongodb-memory-server` and mocked mailers.
- [x] **Documentation & ADRs**: Updated README, architecture, database design, API docs, ADRs 001–015, progress, and reports.

---

### Phase 2: Memory Journal & Cloudinary Photo Subsystem (Completed & Hardened)

- [x] **Memory Journal CRUD Operations**:
  - [x] `POST /api/memories`: Create memory with Zod validation, normalized tags, session-derived ownership.
  - [x] `GET /api/memories`: List user memories with keyword search (length <= 100), ReDoS escaping, tag filtering, date range validation (`startDate <= endDate`), sort order, and pagination.
  - [x] `GET /api/memories/:id`: Retrieve single memory with populated signed photo URLs, strict user isolation.
  - [x] `PATCH /api/memories/:id`: Partial memory updates with field validation and ownership checks.
  - [x] `DELETE /api/memories/:id`: Cascade deletion of memory and associated photos from Cloudinary and MongoDB with safe retry preservation on Cloudinary failure.
- [x] **Cloudinary Media Subsystem & Privacy Enforcement**:
  - [x] Server-side integration in `src/lib/media/cloudinary.ts`.
  - [x] Authenticated private delivery (`type: 'authenticated'`) preventing unrestricted public CDN access.
  - [x] On-demand signed URL generation with hardened 15-minute expiration (900s).
  - [x] File validation: MIME type check, 10MB size limit, and binary magic bytes verification (JPEG, PNG, WebP, GIF, AVIF).
- [x] **Photo Management Endpoints**:
  - [x] `POST /api/memories/:id/photos`: Multipart upload, Cloudinary upload stream, MongoDB persistence, and compensating rollback on failure.
  - [x] `GET /api/memories/:id/photos`: List photos for memory with signed URLs.
  - [x] `DELETE /api/memories/:id/photos/:photoId`: Purge photo from Cloudinary first, preserve DB record on failure for retry, delete DB record and unlink from `Memory.photos` on success.
  - [x] `PATCH /api/memories/:id/photos/:photoId`: Move photo to another memory with two-way compensating rollback on failures.
- [x] **Database Indexes**:
  - [x] Multikey compound index `{ userId: 1, tags: 1 }` on `Memory` for fast tag queries.
  - [x] Compound index `{ userId: 1, memoryId: 1 }` and unique `{ publicId: 1 }` on `Photo`.
- [x] **Automated Testing**:
  - [x] 119 automated unit and integration tests across 11 test suites passing with 100% success rate.
  - [x] 83.75% statement coverage and 83.74% line coverage.
- [x] **Documentation & ADRs**: Created ADR 016 and ADR 017, updated API documentation, database design, architecture, and progress reports.

---

### Phase 3: Time Capsule Date-Locking Subsystem (Completed & Hardened)

- [x] **Zod Validation & Lifecycle Protection**:
  - [x] Created `src/validations/capsule.ts` with `createCapsuleSchema`.
  - [x] Enforced strict future date validation (`unlockDate > Date.now()`).
  - [x] Accepted virtual alias `unlockAt`.
  - [x] Explicitly rejected client tampering with lifecycle/security fields (`userId`, `isOpened`, `openedAt`, `sealedAt`).
- [x] **Time Capsule Route Handlers**:
  - [x] `POST /api/capsules`: Authenticated sealing, server time enforcement, photo ownership verification, and arbitrary external URL rejection.
  - [x] `GET /api/capsules`: User isolation, pagination, chronological sorting, and sealed content redaction (omits message, photos, photoUrls for locked capsules).
  - [x] `GET /api/capsules/:id`: Ownership check (404 for unowned), temporal guard returning `403 Forbidden` if `now < unlockDate`, and complete revealed contents once unlocked.
  - [x] `POST /api/capsules/:id/open`: Milestone unsealing returning `403 Forbidden` if locked, sets `isOpened = true` and `openedAt = server_time`, safe and idempotent for repeat calls.
  - [x] `DELETE /api/capsules/:id`: Ownership check, safe cleanup of exclusively attached photos (`memoryId == null` and not referenced by any other capsule) from Cloudinary and MongoDB while preserving photos shared with memories or other capsules.
- [x] **Database & Model Integrity**:
  - [x] Added `photos: [ObjectId]` reference array to `TimeCapsule` schema.
  - [x] Updated `Photo` pre-delete hooks to unlink deleted photos from `TimeCapsule.photos`.
- [x] **Automated Testing & Coverage**:
  - [x] Created 36 comprehensive integration tests in `tests/integration/capsule.test.ts`.
  - [x] Total automated test suite expanded to 155 tests across 12 suites passing with 100% success rate.
  - [x] Code coverage achieved: 84.39% statements, 84.37% lines, 83.33% functions, 72.65% branches.
- [x] **Documentation & ADRs**: Created ADR 018, updated API documentation, database design, and progress tracker.

---

### Phase 4: Unified Timeline & Backend Integration (Completed)

- [x] **Unified Timeline Endpoint (`GET /api/timeline`)**:
  - [x] Combined personal memories and time capsules into a single chronological feed.
  - [x] Documented timeline date semantics: `memoryDate` for memories, `unlockDate` for capsules (with `sealedAt` explicitly provided).
  - [x] Implemented dual pagination: deterministic cursor-based pagination with composite tie-breaking (`date`, `_id`) and offset-based pagination (`page`, `limit`).
  - [x] Implemented type filtering (`type=all|memory|capsule`) and ISO date range boundary filtering (`startDate`, `endDate`).
- [x] **Strict Privacy & Security Invariants**:
  - [x] Server-side runtime date verification (`now < unlockDate`).
  - [x] Zero-leakage temporal redaction: message content, photo IDs, Cloudinary public IDs, and signed URLs are completely omitted for locked capsules.
  - [x] Client tampering defense: rejection of client-supplied lock states and rejection of invalid/corrupted cursors with 400 Bad Request.
  - [x] Strict tenant isolation: User A cannot access or discover User B's entries.
- [x] **Database & Performance Optimization**:
  - [x] Implemented MongoDB `$unionWith` aggregation pipeline with database-level sorting and pagination.
  - [x] Eliminated N+1 queries by batch-populating photos for only the sliced page items.
  - [x] Added compound indexes for chronological ordering and tie-breaking: `{ userId: 1, memoryDate: 1, _id: 1 }` and `{ userId: 1, unlockDate: 1, _id: 1 }`.
- [x] **Validation & Schemas**:
  - [x] Created `src/validations/timeline.ts` with `timelineQuerySchema` and cursor encoding/decoding helpers.
- [x] **Automated Testing & Coverage**:
  - [x] Created 31 comprehensive integration tests in `tests/integration/timeline.test.ts`.
  - [x] Total automated test suite expanded to **186 tests across 13 suites** passing with 100% success rate.
  - [x] Code coverage achieved: **86.11% statements, 86.38% lines, 85.00% functions, 75.18% branches**.
- [x] **Documentation & ADRs**: Created ADR 019, updated API documentation, architecture documentation, database design, and reports.

---

### Phase 5: Frontend Development & UI — Playful Surrealism Redesign (In Progress)

#### Stage 1: Design Foundation & Visual Identity System (Completed)

- [x] **Audit & Palette Migration**:
  - [x] Audited existing UI components and replaced muted vintage palette with the locked 9-color system:
    - Electric Coral (`#FF684D`), Tangerine (`#FFB93F`), Dream Pink (`#F3A9D5`), Cobalt Blue (`#4F66E8`), Acid Lime (`#B7DB50`), Vibrant Teal (`#39BFAE`), Midnight (`#191A2B`), Warm Cream (`#F7F3EC`), Solar Yellow (`#F7D84B`).
  - [x] Implemented core tokens in `src/styles/tokens.css` and mapped into Tailwind v4 inline theme in `src/app/globals.css`.
  - [x] Preserved complete backwards compatibility aliases for legacy components and existing test suites.
- [x] **Hybrid Light/Dark Architecture**:
  - [x] Created `HybridSection.tsx` container supporting intentional alternating environments (`cream`, `midnight`, `coral`, `cobalt`, `teal`, `split`) with scoped contrast CSS variables.
  - [x] Guaranteed accessible contrast ratios (Midnight on Warm Cream > 12:1, Warm Cream on Midnight > 13:1).
- [x] **Playful Surrealism Visual Primitives**:
  - [x] `FloatingSticker.tsx`: Tactile stickers with drop shadows, tilt angles, and push-pin accents.
  - [x] `SurrealPhotoCard.tsx`: Layered asymmetric photo cards with vibrant offset backdrops, archival tags, and hover depth.
  - [x] `EditorialMarquee.tsx`: High-contrast typography ribbons and tickers for editorial cadence.
  - [x] `SurrealObjectFloat.tsx`: Floating 3D-inspired cutouts, wax seals, and botanical elements with gentle ambient animation.
  - [x] Expanded `Button.tsx` (`coral`, `cobalt`, `lime`, `teal`, `midnight`, `cream`, `sticker`) and `Badge.tsx` (`coral`, `cobalt`, `lime`, `teal`, `pink`, `yellow`, `tangerine`, `midnight`).
- [x] **Interactive Showcase Verification**:
  - [x] Built live interactive demonstration of Stage 1 tokens and primitives at `/showcase`.
  - [x] Captured genuine browser screenshots and WebP video recording demonstrating swatches, typography, and light/dark contrast.
- [x] **Automated Testing & Build**:
  - [x] Updated `tests/unit/design-foundation.test.ts` to assert all locked Playful Surrealism tokens.
  - [x] 192 tests passing across 14 suites (100% pass rate).
  - [x] `npm run lint`, `npm run format:check`, and `npm run build` exit code 0.

#### Stage 2: Application Shell & Authentication Infrastructure (Completed)

- [x] **Typed API Client & Structured Error Handling**:
  - [x] Implemented `src/lib/api/client.ts` enforcing `credentials: 'include'` on all calls so that the HTTP-only `echoes_token` cookie is transmitted automatically.
  - [x] Built `ApiClientError` encapsulating HTTP status, backend message, and field validation details (`isUnauthenticated`, `isForbidden`, `isRateLimited`, `isConflict`, `isServerError`).
  - [x] Implemented typed `authApi` in `src/lib/api/auth.ts` mapping directly to existing backend endpoints (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/change-password`).
- [x] **AuthProvider & Session Restoration**:
  - [x] Built `src/contexts/AuthContext.tsx` with reactive React context (`user`, `status`, `isLoading`, `isAuthenticated`, `error`, `login`, `register`, `logout`, `refresh`).
  - [x] **Zero localStorage/sessionStorage Token Storage**: Tokens are strictly handled via the HTTP-only `echoes_token` cookie and restored via `/api/auth/me`.
- [x] **Server-Side Route Boundary (Next.js 16 Proxy & Server Helpers)**:
  - [x] Created `src/proxy.ts` (Next.js 16 convention replacing deprecated middleware) running before route rendering.
  - [x] Validates JWT signature with `jose` and protects `/dashboard`, `/memories`, `/capsules`, `/timeline`, and `/settings`, redirecting unauthenticated users to `/login?from=...`.
  - [x] Redirects authenticated users from `/login` and `/register` directly to `/dashboard`.
  - [x] Created server-side auth helpers in `src/lib/auth/server-session.ts` (`getServerSession()`, `requireServerAuth()`).
- [x] **Authenticated Application Shell**:
  - [x] `AppHeader.tsx`: Brand logo, live workspace badge, user avatar initials/profile pill, sign out action with loading state, and theme toggle.
  - [x] `AppNavigation.tsx`: Navigation items for Dashboard, My Journal, Time Capsules, and Timeline with high-contrast active tab pill, and responsive slide-out mobile drawer.
  - [x] `AppShell.tsx`: Full authenticated workspace wrapper with loading skeleton and unauthenticated UX redirect fallback.
- [x] **Public Marketing Navigation & Authentication Pages**:
  - [x] Updated `EditorialHeader.tsx` to link to real routes (`/showcase`, `/login`, `/register`, and `/dashboard` when authenticated).
  - [x] Built `/login` with Playful Surrealism cards, structured error alert banner, and return redirection.
  - [x] Built `/register` with name, email, password complexity requirements checklist (8+ chars, upper, lower, number), duplicate email handling, and auto-login.
  - [x] Built `/dashboard` initial shell with honest API-derived metrics (`/api/memories`, `/api/capsules`) and quick actions.
  - [x] Corrected all time capsule descriptions to server-enforced date-based access control (zero claims of cryptographic encryption).
- [x] **Automated Testing & Build Verification**:
  - [x] Added `tests/unit/api-client.test.ts` (7 tests) and `tests/unit/auth-infrastructure.test.ts` (7 tests).
  - [x] Test suite expanded to **213 tests across 16 test suites** passing with 100% success rate.
  - [x] `npm run lint` passing with 0 errors and 0 warnings.
  - [x] `npm run format:check` passing with 100% compliance.
  - [x] Production build (`npm run build`) passing with Turbopack exit code 0.
  - [x] Live browser verified with desktop and mobile screenshots captured.

#### Stage 3 & Stage 4: Combined Dashboard, Journal, Memory Details & Photo Management (Completed)

- [x] **Visual Design System — Selective Neumorphism**:
  - [x] Implemented restrained, modern neumorphism primitives (`.neu-raised`, `.neu-inset`, `.neu-control`, `.neu-control-active`) in `src/app/globals.css`.
  - [x] Seamlessly integrated into existing Playful Surrealism aesthetic (warm parchment `#F7F3EC` in light mode, deep midnight `#191A2B` in dark mode).
  - [x] Strictly avoided generic grey-on-grey treatments; preserved strong color contrast, accessible focus rings, and experimental editorial typography.
  - [x] Applied selectively to dashboard metric cards, search/filter bars, sort toggles, tag filter chips, and photo upload dropzones.
- [x] **Authenticated Dashboard (`/dashboard`)**:
  - [x] Built real authenticated dashboard communicating with backend endpoints (`/api/memories`, `/api/capsules`).
  - [x] Personalized greeting using active user profile from `AuthContext`.
  - [x] Accurate memory count (`res.pagination.totalItems`).
  - [x] Photo count derived accurately from returned memory records with clear "In Recent Entries" labeling.
  - [x] Sealed time capsule count from `/api/capsules` with date-locking indicators.
  - [x] Upcoming unlock information displaying next unsealing date or "None Scheduled".
  - [x] Recent reflections list with direct links to detail views.
  - [x] New-user onboarding guide with 3 interactive action cards ("Document First Reflection", "Seal a Time Capsule", "Curate Your Timeline").
  - [x] Comprehensive empty, loading (skeleton pulse), and error states with retry capabilities.
- [x] **Memory Journal (`/memories`)**:
  - [x] Real memory archive listing connected to `GET /api/memories`.
  - [x] Search input with 300ms transition debouncing and first-page reset.
  - [x] Semantic tag filtering with dynamic tag collection and interactive toggle chips.
  - [x] Chronological sorting toggle (`Newest First` / `Oldest First`) with neumorphic pressed states.
  - [x] Real pagination controls (`Previous` / `Next`, page indicators).
  - [x] Rich memory preview cards with date tags, titles, prose snippets, and semantic tag badges.
  - [x] Empty state ("The archive holds no reflections yet") and error banner with retry.
- [x] **Memory Creation & Editing (`/memories/new`, `/memories/[id]/edit`)**:
  - [x] Title, reflection prose, memory date picker, and tag chip builder.
  - [x] Word count and character count indicators.
  - [x] Client-side validation adhering to existing Zod schemas.
  - [x] Integrated `POST /api/memories` and `PATCH /api/memories/:id`.
  - [x] Sequential photograph upload staging during creation flow.
  - [x] Pre-populated edit form editing actual saved backend data.
- [x] **Memory Detail View (`/memories/[id]`)**:
  - [x] Full prose reading experience with editorial typography and archival seal stamp.
  - [x] Formatted memory date and metadata.
  - [x] Attached 35mm photo gallery rendering Cloudinary authenticated signed URLs.
  - [x] Lightbox preview modal for high-resolution photo inspection.
  - [x] Edit navigation link and Delete Memory modal with confirmation and cascade removal.
- [x] **Photo Management Subsystem (`/api/memories/:id/photos`, `DELETE /api/memories/:id/photos/:photoId`)**:
  - [x] Drag-and-drop upload zone and native file picker.
  - [x] Instant client-side image previews with object URLs.
  - [x] Upload progress indicators and size/MIME validation (10MB limit; JPEG, PNG, WebP, GIF, AVIF).
  - [x] Photo deletion confirmation dialog with automatic memory data refresh.
  - [x] Cloudinary private authenticated delivery preserved with zero secret exposure.
- [x] **Verification & Quality Assurance**:
  - [x] Expanded test suite with `tests/unit/memories-api.test.ts` (6 tests). Total **219 tests across 17 test suites (100% pass rate)**.
  - [x] ESLint passing with 0 errors and 0 warnings.
  - [x] Prettier code style verified with 100% compliance across all workspace files.
  - [x] Production build (`npm run build`) passing with Next.js 16 Turbopack exit code 0.
  - [x] Live browser testing and screenshot captures across desktop and mobile.

#### Stage 5: Unified Timeline & Time Capsules (Completed)

- [x] **Personal Timeline Feed (`/timeline`)**:
  - [x] Direct integration with `GET /api/timeline` without client-side data synthesis.
  - [x] Distinct visual identities for memories (archival journal tags, reflections, photo preview strips) and capsules (date-locked vault containers, countdowns).
  - [x] Date grouping by month and year aligned along an unbroken vertical gradient spine.
  - [x] Date range boundary filters (`startDate`, `endDate`) and sort order toggle (`Chronological` / `Latest First`).
  - [x] Type filters (`All Entries`, `Memories`, `Capsules`) with selective neumorphic segmented controls.
  - [x] Deterministic cursor-based pagination with composite tie-breaking (`nextCursor`, `prevCursor`).
  - [x] Loading skeleton, empty state, and actionable error states.
- [x] **Time Capsule Collection (`/capsules`)**:
  - [x] Direct integration with `GET /api/capsules`.
  - [x] Filter tabs for `All Capsules`, `Sealed & Locked`, and `Unlocked & Ready`.
  - [x] Live `CountdownTimer` component calculating remaining days, hours, minutes, seconds.
  - [x] Status indicators, unlock targets, sealed timestamps, and pagination.
- [x] **Create and Seal a Capsule (`/capsules/new`)**:
  - [x] Atmospheric letter-writing sanctuary with editorial parchment aesthetics.
  - [x] Capsule title, personal message (up to 100,000 chars), and future unlock date picker.
  - [x] Quick preset helpers (`+1 Month`, `+6 Months`, `+1 Year`, `+5 Years`) and strict future date validation.
  - [x] Photo attachment selection from existing owned vault assets adhering strictly to backend contract.
  - [x] Atmospheric sealing ceremony animation (`SealingAnimationModal`) featuring letter folding, wax seal stamp impact, and smooth redirection to the detail view.
- [x] **Capsule Detail Page (`/capsules/[id]`)**:
  - [x] Integrated `GET /api/capsules/:id`, `POST /api/capsules/:id/open`, and `DELETE /api/capsules/:id`.
  - [x] **Locked state**: Handles HTTP 403 Forbidden with server-verified timestamps, displays live countdown clock, hides all protected letter contents and photos, and explains server date locking.
  - [x] **Unlocked state**: Explicit "Break Seal & Open Capsule" milestone action calling backend endpoint and revealing letter only upon successful HTTP 200 response.
  - [x] Unsealed letter reading view with full prose, archival stamps, photo gallery, and lightbox modal.
  - [x] Permanent capsule deletion modal with cascade cleanup confirmation.
- [x] **Security & Invariants**:
  - [x] Authoritative server-side date enforcement with zero client-side time simulation.
  - [x] Zero description of date locking as "encryption".
  - [x] Strict tenant isolation and boundary-time error handling.
- [x] **Automated Testing & Build Verification**:
  - [x] Created `tests/unit/timeline-api.test.ts` (4 tests) and `tests/unit/capsules-api.test.ts` (6 tests).
  - [x] Total test suite expanded to **229 tests across 19 suites (100% pass rate)**.
  - [x] ESLint passing with 0 errors and 0 warnings.
  - [x] Prettier verified with 100% compliance.
  - [x] Production build (`npm run build`) passing with Turbopack exit code 0 (28/28 routes).
  - [x] Automated browser verification across desktop and mobile with genuine screenshots captured.

#### Stage 6: Settings, Profile & Shared UI Components (Completed)

- [x] **Profile Dossier Experience (`/profile`)**:
  - [x] Authenticated identity dossier displaying user full name, email address, account creation date (`user.createdAt`), and active member status.
  - [x] Privacy by Design: Implementation-level diagnostics (tokenVersion, raw database ObjectIds, cookie implementation flags) intentionally removed from visible Profile UI.
  - [x] Live aggregated vault statistics via `Promise.allSettled` fetching from `memoriesApi`, `capsulesApi`, and `timelineApi` (total memories, enclosed photographs, sealed capsules, unlocked capsules, total timeline milestones).
  - [x] Archival preservation notice: Explains that personal records and time capsules are privately secured, with clear direction to Account Settings for password and session adjustments.
  - [x] Direct vault traversal links to Journal, Time Capsules, and Unified Timeline.
  - [x] Route protection via `src/proxy.ts` ensuring unauthenticated requests are safely redirected to `/login?from=/profile`.
- [x] **Account Settings Experience (`/settings`) & Password Recovery (`/login#recover`)**:
  - [x] Change password flow integrating `PATCH /api/auth/change-password` via `authApi.changePassword()`.
  - [x] Password complexity requirements matching backend Zod schema (min 8 chars, uppercase, lowercase, number, special character) with confirmation matching.
  - [x] Real-time error handling with rate-limit detection (429 Too Many Requests), invalid current password handling (401), and session re-authentication.
  - [x] Theme preference controls: "Editorial Light", "Cinematic Dark", and "System Sync" synchronized in real-time across the application with `useSyncExternalStore` and `ThemeInitializer`.
  - [x] Anti-flash inline script in `<head>` ensures zero theme flashing on initial page loads.
  - [x] Full OS theme change handling via `media.addEventListener('change')` dynamically updating system-synchronized theme.
  - [x] Sign-out action integrated with accessible `ConfirmationDialog`.
  - [x] Password recovery interface: `/login#recover` opens the emergency password recovery flow calling `/api/auth/forgot-password` with email input and dispatch confirmations.
  - [x] Archival retention & account deletion restriction notice explaining cryptographic permanence and immutability.
- [x] **Shared UI Component Audit, Consolidation & Accessibility**:
  - [x] Audited and consolidated all reusable frontend primitives in `src/components/ui/`:
    - `Button.tsx`: Accessible hit targets (expanded 44x44px touch targets on icon buttons), visible focus states (`focus-visible:ring-2 focus-visible:ring-[#FF684D]`).
    - `Modal.tsx`: Accessible dialog with focus trap (Tab/Shift-Tab cycle), previous element focus restoration on unmount, Escape-key dismissal, and ARIA labels.
    - `Toast.tsx` & `ToastContext.tsx`: Screen-reader live region (`role="region"`, `aria-label="Notifications"`, `aria-live="polite"`), touch-friendly dismiss action, auto-dismiss.
    - `Input.tsx`, `Textarea.tsx`, `Select.tsx`, `DatePicker.tsx`, `ConfirmationDialog.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Tooltip.tsx`.
    - `index.ts`: Clean barrel export consolidating all shared UI primitives.
  - [x] Reduced-motion behaviour verified via `@media (prefers-reduced-motion: reduce)` in global styles.
- [x] **Global Feedback System (`ToastContext.tsx`)**:
  - [x] Implemented React context-based notification system (`useToast()`) mounted at root layout (`src/app/layout.tsx`).
  - [x] Accessible floating viewport (`role="region"`, `aria-live="polite"`), auto-dismissal with timer cleanup, and manual close action.
  - [x] Integrated across all core vault workflows:
    - Memory creation (`/memories/new`) & updates (`/memories/[id]/edit`).
    - Memory deletion & photograph uploads/deletions (`/memories/[id]`).
    - Capsule sealing (`/capsules/new`), opening, and deletion (`/capsules/[id]`).
    - Authentication events, password updates, network failures, and rate-limiting across `/login`, `/register`, and `/settings`.
- [x] **Application Navigation Integrity**:
  - [x] Consolidated navigation links across Dashboard, Journal, Timeline, Time Capsules, Profile, and Settings.
  - [x] Updated desktop sub-header and mobile drawer in `src/components/layout/AppNavigation.tsx` with active indicator states.
  - [x] Added Profile avatar link and quick Settings icon button in `src/components/layout/AppHeader.tsx`.
- [x] **Testing, Code Quality & Build Verification**:
  - [x] Created `tests/unit/stage6-components.test.ts` (13 tests) verifying password validation schemas, API client methods, password recovery client integration, toast data structures, and UI component exports.
  - [x] **Total Test Suite**: **242 tests across 20 test suites** passing with **100% success rate**.
  - [x] **ESLint**: `npm run lint` passing with **0 errors and 0 warnings**.
  - [x] **Prettier**: `npm run format:check` passing with **100% compliance**.
  - [x] **Production Build**: `npm run build` compiled all 30 Next.js 16 App Router routes with Turbopack with **exit code 0**.
  - [x] Genuine browser screenshots captured across desktop and mobile viewports (`public/images/report/stage6_*`).

#### Stage 7: Motion Design, Responsive Polish & Accessibility Refinement (Completed)

- [x] **Motion Design System**:
  - [x] Implemented hardware-accelerated CSS keyframe transitions in `globals.css` (`fadeIn`, `fadeInUp`, `fadeInScale`, `slideDown`, `spinSlow`) operating purely on `transform` and `opacity`.
  - [x] Page entrance transition in `<AppShell>` keyed by pathname, eliminating navigation delays and layout shifts.
  - [x] Created zero-dependency, lightweight `ScrollReveal` component using `IntersectionObserver` with immediate reduced-motion fallback.
  - [x] Applied scroll storytelling across Landing Page (hero monograph, photo collage, philosophy quote, three subsystem cards, monograph contact sheet) and Dashboard (welcome banner, 4 metrics widgets, recent memories).
  - [x] Tactile micro-interactions: card elevation on hover (`hover:-translate-y-1 hover:shadow-lg`), button depression (`active:scale-95`), wax stamp hover scaling on `ArchivalStamp`, icon rotation on `ThemeToggle`, and responsive tactile theme selectors.
- [x] **Accessible Mobile Navigation Drawer (`MobileNavDrawer`)**:
  - [x] Replaced abrupt menu with slide-down animated modal drawer in `AppNavigation.tsx`.
  - [x] Added WAI-ARIA attributes (`role="dialog"`, `aria-modal="true"`, `aria-label="Navigation Menu"`).
  - [x] Implemented strict keyboard focus trapping cycling `Tab` / `Shift+Tab`.
  - [x] Added `Escape`-key dismissal listener and body scroll lock while open.
  - [x] 44×44px touch targets on close button and navigation links.
- [x] **Standardized Accessible Photo Lightbox (`PhotoLightbox`)**:
  - [x] Unified photo preview modal across Memory Details (`/memories/[id]`) and Capsule Details (`/capsules/[id]`).
  - [x] Keyboard arrow navigation (`ArrowLeft` / `ArrowRight`), `Escape`-key dismissal, focus trapping, and body scroll locking.
  - [x] Minimum 44×44px touch targets on next/previous and close buttons.
- [x] **Accessible Sealing Animation Modal (`SealingAnimationModal`)**:
  - [x] Escape-key dismissal listener and body scroll locking.
  - [x] Fast-forwarded timer (500ms) when `prefers-reduced-motion` is active.
- [x] **Responsive Design Audit Across 6 Viewports**:
  - [x] Small mobile (320 × 700): Resolved stats grid overflow in Profile (`p-3.5 sm:p-5`), adjusted detail card padding (`p-4 sm:p-12`), wrapped breadcrumb bars, aligned timeline spine with 40px marker.
  - [x] Mobile (375 × 812): Single-column cards, hamburger drawer, zero horizontal overflow.
  - [x] Large mobile (430 × 932): Fluid scaling and generous touch targets.
  - [x] Tablet (768 × 1024): 2-column cards grid, 2×2 metrics grid, desktop navigation bar.
  - [x] Laptop (1366 × 768): 3-column memory grid, 4-column metrics grid.
  - [x] Desktop (1920 × 1080): Full editorial typography, photo collage, sun disk atmosphere.
- [x] **Accessibility & Reduced-Motion**:
  - [x] Comprehensive `@media (prefers-reduced-motion: reduce)` in `globals.css` disabling continuous loops (`animate-float`, `animate-pulse-glow`, `animate-spin-slow`) and removing scroll animation delays.
  - [x] Visible focus rings (`focus-visible:ring-2 focus-visible:ring-[#FF684D]`) maintained across all interactive elements.
- [x] **Automated Verification & Genuine Screenshot Capture**:
  - [x] Automated tests: **242/242 passing across 20 test files (100%)**.
  - [x] ESLint: **0 errors, 0 warnings**.
  - [x] Prettier: **100% compliant**.
  - [x] Production build: **exit code 0 (30/30 routes)**.
  - [x] 17 genuine screenshots captured via CDP headless Chrome in `public/images/report/`.

#### Stage 8: Complete Frontend QA, Integration Verification & Release Readiness (Completed)

- [x] **Complete Route Inventory & Route Guards Audit**:
  - [x] Audited all 16 page routes and 16 backend API endpoints for functional correctness, authentication guards, empty states, error boundaries, and loading indicators.
  - [x] Verified route protection in Next.js middleware (`src/proxy.ts`), correctly redirecting unauthenticated requests to `/login?from=...` and returning users to their intended route after authentication.
- [x] **End-to-End Functional Workflows Verified**:
  - [x] Authentication & Session Lifecycle: Registration, login, logout, password recovery (`/login#recover`), password change with session revocation.
  - [x] Memory Journal: Creation, listing with ReDoS-safe search, tag filtering, editing, cascade deletion, Cloudinary photo uploads, and accessible `PhotoLightbox`.
  - [x] Time Capsules: Future date validation, wax sealing ceremony, locked state temporal redaction (server returns 403), matured capsule unsealing (200), and deletion.
  - [x] Unified Timeline: Chronological aggregation of memories and capsules with cursor pagination and type filtering.
  - [x] Profile & Settings: Dossier display with live stats, privacy-by-design (zero technical token/cookie leakage), theme persistence across tabs, and OS theme sync.
- [x] **Security, Privacy & Multi-Tenant Data Isolation Audit**:
  - [x] Created comprehensive integration test suite `tests/integration/stage8-qa.test.ts` (13 tests) verifying cross-tenant access denial (HTTP 404/403) across memories, capsules, and timeline endpoints.
  - [x] Verified zero content leakage for sealed capsules prior to unlock date (HTTP 403 with message/photos redacted).
  - [x] Verified immediate session token invalidation upon password update via `tokenVersion` increment.
  - [x] Verified resilience against malformed ObjectIDs and corrupted timeline pagination cursors.
- [x] **Responsive Layouts Verified Across 6 Viewports**:
  - [x] Small mobile (320 × 700), standard mobile (375 × 812), large mobile (430 × 932), tablet (768 × 1024), laptop (1366 × 768), and desktop (1920 × 1080) confirmed stable with zero horizontal overflow.
- [x] **Accessibility & Reduced-Motion Verified**:
  - [x] Prominent focus rings, modal and drawer focus traps, Escape-key dismissal, screen reader notifications live region, and immediate animation bypassing under `prefers-reduced-motion`.
- [x] **Verification Pipeline**:
  - [x] Automated Tests: **255/255 tests passing across 21 test suites (100% pass rate)**.
  - [x] ESLint: **0 errors, 0 warnings**.
  - [x] Prettier: **100% compliant**.
  - [x] Production Build: **Exit code 0 (30/30 routes compiled cleanly via Turbopack)**.
  - [x] Generated `docs/report/STAGE_8_REPORT.md`.

#### Stage 9: Public Landing Page Reinvention & Cinematic Motion (Completed)

- [x] **Stage 9A: Creative Research, Landing Page Audit & Art Direction**:
  - [x] Formulated editorial narrative and visual identity: Playful Surrealism, Experimental Editorial, Hybrid light/dark sections.
  - [x] Documented in `docs/report/STAGE_9A_ART_DIRECTION.md`.
- [x] **Stage 9B: Visual Asset Planning, Production & Genuine Screenshots**:
  - [x] Authored asset manifest `docs/report/STAGE_9B_ASSET_MANIFEST.md` covering all 8 moments.
  - [x] Generated and integrated `hero_celestial_sanctuary.webp`, mobile portrait variant `hero_celestial_sanctuary_mobile.webp`.
  - [x] Generated cutout assets: `cutout_fountain_pen_nib.webp`, `cutout_hourglass_dust.webp`, `cutout_wax_seal_hot.webp`.
  - [x] Created vector assets: `dial_temporal_astrolabe.svg`, `spine_chronology_connector.svg` (with corrected `#191A2B` gradient).
  - [x] Captured authentic application screenshots: `product_memory_journal.webp`, `product_sealed_capsule.webp`, `product_timeline.webp`.
  - [x] Verified zero regressions across authenticated pages.
- [x] **Stage 9C: Complete Landing Page Implementation**:
  - [x] Built all eight narrative moments across modular components in `src/components/landing/`.
  - [x] Integrated `AmbientDustCanvas`, deckle-edge torn SVG transitions, 35mm contact sheet with darkroom loupe, memory archive tag filtering, time capsule sealing chamber with kinetic needle, serpentine chronology spine, authentic product showcase, and epilogue.
  - [x] Documented in `docs/report/STAGE_9C_LANDING_PAGE_IMPLEMENTATION.md`.
- [x] **Stage 9D: Cinematic Motion & Interaction Implementation**:
  - [x] Centralized GSAP 3 & ScrollTrigger architecture with SSR and context cleanup safety (`src/lib/motion/index.ts`).
  - [x] Synchronized Lenis smooth scrolling with GSAP ticker (`src/components/landing/SmoothScrollProvider.tsx`).
  - [x] Hero cinematic entrance sequence, floating object physics (pen nib, hourglass), and cursor deflection parallax.
  - [x] ScrollTrigger animations: manifesto quote reveals, botanical fern parallax, 35mm frame sequence reveals, darkroom loupe inspection, floating stamp oscillation, kinetic astrolabe needle calibration (`back.out(1.4)`), live horizon countdown, authentic molten wax squash/stretch drop physics with shockwave flare, scrubbed serpentine timeline spine reveal (`clipPath`), desktop 3D perspective card tilt, and wax seal hover aura.
  - [x] Desktop-only pinning guardrails (`window.innerWidth >= 1024px`) to protect mobile touch ergonomics.
  - [x] Complete `prefers-reduced-motion` bypass across Lenis, GSAP, and Canvas.
  - [x] Captured 8 genuine verification screenshots via Chrome CDP (`public/images/report/stage9d_*.webp`).
  - [x] Vitest: **255/255 passing (100%)**, ESLint: **0 errors, 0 warnings**, Prettier: **100% compliant**, Next.js build: **successful**.
  - [x] Documented in `docs/report/STAGE_9D_MOTION_IMPLEMENTATION.md`.
- [x] **Stage 9F: Final Visual Redesign, Dual-Theme Architecture & Release Readiness**:
  - [x] Purged all interface clutter: coordinate bars, telemetry ribbons, repetitive moment badges, and status pills.
  - [x] Completely redesigned all 8 sections into an integrated, museum-grade experimental editorial experience.
  - [x] Dual-theme architecture: full native Warm Cream Light and Midnight Dark support across all 8 sections.
  - [x] Removed disruptive desktop pinning to restore natural Lenis momentum scrolling.
  - [x] Fixed empty timeline whitespace with alternating archival photographic plates and artifact previews.
  - [x] Tested and verified across 8 viewport widths (320px, 375px, 390px, 430px, 768px, 1024px, 1440px, 1920px).
  - [x] Automated QA: Vitest **255/255 tests passed (100%)**, ESLint **0 errors, 0 warnings**, Prettier **100% compliant**, Turbopack build **successful (802ms)**.
  - [x] Captured 28 genuine verification screenshots in `screenshots/` and `public/images/report/`.
  - [x] Documented in `docs/report/STAGE_9F_FINAL_RELEASE_REPORT.md`.

---

### Phase 6: Final Polish, Security Review & Academic Defense (Pending)

- [ ] End-to-end integration test validation.
- [ ] Comprehensive security audit: rate limiting, sanitization, token expiration.
- [ ] Final compilation of academic project report and slide deck.
