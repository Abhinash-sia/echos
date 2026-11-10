# ECHOES — 8-Slide Deck Outline (4-Person Team)

> Split into 8 focused, clean slides without increasing content. Designed to pair with [presentation_script.md](file:///home/xandev/Programming/Projects/echos/presentation/presentation_script.md).

---

### Slide 1: Title & Team Introduction
*Speaker 1: [Member 1]*
- **Title**: ECHOES — Digital Memory Vault & Personal Time Capsule
- **Subtitle**: Computer Science & Engineering B.Tech Minor Project
- **Team Members**: [Member 1], [Member 2], [Member 3], [Member 4]
- **Faculty Guide / Supervisor**: [Guide Name]
- **Department**: Department of Computer Science & Engineering
- **Visual**: Ambient vault graphic (`/public/images/hero/hero-vault-ambient.webp`)

---

### Slide 2: The Problem: Ephemeral Digital Feeds
*Speaker 1: [Member 1]*
- **The Broadcast Dilemma**: Modern social feeds are engineered for real-time engagement and rapid scrolling, not deep personal reflection.
- **Fragmented Life Records**: Photos, thoughts, and milestones are scattered across chat apps and raw cloud drives with zero narrative context.
- **Missing Temporal Dimension**: No digital platform provides a trusted mechanism to seal letters today for delivery to our future selves.

---

### Slide 3: The Solution: ECHOES Dual-Pillar Concept
*Speaker 1: [Member 1]*
- **A Private Retrospective Sanctuary**:
  1. **Pillar 1 — Personal Memory Vault**:
     - Chronological journaling with rich text narratives.
     - Multikey semantic tagging and search.
     - Authenticated, private photo galleries.
  2. **Pillar 2 — Date-Locked Time Capsule**:
     - Letters composed for future milestones or self-reflection.
     - Enforced temporal locks until the exact target maturity date.

---

### Slide 4: System Architecture & Data Layer
*Speaker 2: [Member 2]*
- **Framework**: Unified full-stack Next.js 16 App Router in TypeScript.
- **Native Route Handlers**: REST API built directly into Next.js routes (eliminates separate Express backend and CORS complexities).
- **Request Validation**: Declarative Zod schemas validating all incoming requests.
- **Database & Pooling**: MongoDB Community Server with Mongoose 9 ODM, featuring hot-reload connection caching (`db.ts`) to prevent leaks.

---

### Slide 5: Authentication & Secure Media Pipeline
*Speaker 2: [Member 2]*
- **Stateless Authentication**: HMAC-SHA256 JWT tokens (`jose`) stored in secure, HTTP-only, SameSite cookies.
- **Instant Session Revocation**: Database-backed `tokenVersion` counter on every user; password changes increment this version to invalidate old sessions immediately.
- **Private Cloudinary Media**:
  - Image buffers validated against binary magic bytes on upload.
  - Stored in Cloudinary's authenticated tier (no public URLs).
  - Delivered via 15-minute cryptographically signed URLs.

---

### Slide 6: Live System Demonstration
*Speaker 3: [Member 3]*
*(Screen switch to live application at `http://localhost:3000`)*
- **Demo Walkthrough Roadmap**:
  1. **Vault Dashboard**: Real-time stats (memories, photos, locked vs. unlocked capsules).
  2. **Memory Journaling**: Add entry with photo upload and inspect accessible lightbox.
  3. **Time Capsule Sealing**: Wax seal ceremony and strict server-side lock enforcement.
  4. **Matured Unsealing**: Unsealing matured capsule to reveal locked content.
  5. **Unified Timeline**: Chronological stream with cursor-based infinite pagination.

---

### Slide 7: Security Invariants & Automated Test Rigor
*Speaker 4: [Member 4]*
- **Strict Multi-Tenancy**: All queries scoped by `userId`; unauthorized cross-user access returns an unconditional HTTP 404 (zero existence leakage).
- **Server-Side Temporal Invariant**: Sealed capsules return HTTP 403 Forbidden with sensitive fields (`message`, `photos`) fully suppressed on the backend prior to maturity.
- **Compensating Rollbacks**: Automatic destruction of orphaned Cloudinary media if subsequent database writes fail.
- **Testing Rigor**: **255 automated Vitest unit & integration tests** executing in < 5 seconds with 100% pass rate.

---

### Slide 8: Future Roadmap & Project Conclusion
*Speaker 4: [Member 4]*
- **Future Enhancements**:
  - **Scheduled Notifications**: Background Nodemailer delivery when capsules unlock.
  - **Collaborative Vaults**: Shared memory collections for families or teams.
  - **Offline PWA**: Progressive Web App with IndexedDB sync for traveling.
- **Project Summary**: Production-grade, highly tested full-stack platform uniting modern web engineering with meaningful personal retrospection.
- **Closing**: *"Thank you — Questions & Discussion"*
