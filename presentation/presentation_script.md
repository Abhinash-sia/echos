# ECHOES — 4-Person Presentation Script (7–10 Minutes Total)

> **Total Duration**: 8 Minutes Speaking + 2 Minutes Q&A Buffer  
> **Format**: 4 Team Members (~1.5 to 2 minutes each)  
> **Slide Count**: 8 Focused Slides  
> **Style**: Punchy, spoken English with natural transitions and slide cues  

---

## Team Speaker Breakdown

| Speaker | Name (Placeholder) | Topic Covered | Target Time | Slide(s) |
| :---: | :--- | :--- | :---: | :---: |
| **Speaker 1** | *[Member 1]* | Problem, Vision & Core Concept | 0:00 – 1:45 (1m 45s) | Slides 1, 2, 3 |
| **Speaker 2** | *[Member 2]* | Architecture, Tech Stack & Data Design | 1:45 – 3:30 (1m 45s) | Slides 4, 5 |
| **Speaker 3** | *[Member 3]* | Live System Demonstration | 3:30 – 6:15 (2m 45s) | Slide 6 + Live UI |
| **Speaker 4** | *[Member 4]* | Security Invariants, Test Rigor & Roadmap | 6:15 – 8:00 (1m 45s) | Slides 7, 8 |
| **All** | *Team* | Evaluator Q&A | 8:00 – 10:00 (2m 00s) | — |

---

## 🎙️ Spoken Script

### Speaker 1: Introduction, Problem & Vision (0:00 – 1:45)

**[SLIDE 1: Title Slide & Team Introduction]**

> *"Good morning, esteemed faculty and evaluators. We are excited to present **ECHOES**, a Digital Memory Vault and Personal Time Capsule platform developed as our B.Tech Minor Project.  
> Our team consists of [Member 1], [Member 2], [Member 3], and [Member 4]."*

**[SLIDE 2: Problem Statement: Ephemeral Digital Feeds]**

> *"In today's digital world, we create thousands of photos, notes, and messages. But almost all current platforms are built for **public broadcast and quick scrolling**—not for deep, personal retrospection.  
> 
> Our most important personal memories end up fragmented across chat apps and cloud folders with zero narrative context. Even worse, there is no digital tool designed to write a reflective letter today and **lock it securely for our future selves**."*

**[SLIDE 3: The Solution: ECHOES Dual-Pillar Concept]**

> *"To solve this, we built **ECHOES** around two core pillars:  
> 1. ***The Memory Vault**: A private journal for chronological life narratives with tagged entries and authenticated photo albums.  
> 2. ***The Date-Locked Time Capsule**: Letters sealed with a strict future date that cannot be viewed by anyone—even the owner—until that date arrives.  
> 
> I’ll now pass the floor to **[Speaker 2]**, who will walk you through our technical architecture."*

---

### Speaker 2: Architecture & Technical Stack (1:45 – 3:30)

**[SLIDE 4: System Architecture & Data Layer]**

> *"Thank you, [Speaker 1].  
> 
> To build ECHOES, we chose a **Unified Full-Stack Architecture** using **Next.js 16 App Router** with **TypeScript** end-to-end.  
> 
> Instead of managing a separate Express backend with CORS overhead, our REST API is built directly into native Next.js Route Handlers, protected by declarative **Zod schemas**.  
> For data storage, we use MongoDB Community Server with Mongoose ODM, utilizing connection pooling with global caching in `db.ts` to prevent connection leaks during hot reloading."*

**[SLIDE 5: Authentication & Secure Media Pipeline]**

> *"On the security and media front:  
> 
> First, authentication uses HMAC-SHA256 JWT tokens via `jose`, stored in HTTP-only, SameSite cookies. To eliminate stale token risks, every user record contains a `tokenVersion` counter—changing a password increments this version and immediately invalidates all active sessions across any device.  
> 
> Second, for media, photos are checked against binary magic bytes on upload, stored in Cloudinary’s authenticated tier, and delivered using **15-minute cryptographically signed URLs** so files cannot be scraped publicly.  
> 
> Now, **[Speaker 3]** will take over to show you the live platform in action."*

---

### Speaker 3: Live System Demonstration (3:30 – 6:15)

**[SLIDE 6: Live System Demonstration Roadmap]**

> *"Thank you, [Speaker 2]. Let's jump into the live application.*

*(Switch screen to live browser at `http://localhost:3000`)*

#### 1. Dashboard Overview (0:30)
> *(Action: Log in and show Dashboard)*  
> *"Upon logging in, the user sees their private **Vault Dashboard**, displaying real-time metrics: memories recorded, photos stored, active sealed capsules, and unlocked archives."*

#### 2. Creating a Memory (0:45)
> *(Action: Go to `/memories/new`, type title, select date, narrative, tag `#milestone`, attach photo, click Save)*  
> *"Let’s record a memory. I'll add a title, select a date, write a story, and attach a photo.  
> When I hit submit, the server validates the photo buffer, streams it securely to Cloudinary, and links it in MongoDB. Opening this memory displays our accessible lightbox using private signed URLs."*

#### 3. Creating & Sealing a Time Capsule (0:50)
> *(Action: Go to `/capsules/new`, write letter, pick future date, submit, show Wax Seal modal, then open the locked capsule)*  
> *"Now, the core feature: the **Time Capsule**. I’ll compose a letter to my future self and select a future unlock date.  
> When I submit, our digital wax seal ceremony animates.  
> Look at the capsule page: **it is strictly locked with a live countdown**. Even if someone inspects the network tab, the API returns `HTTP 403 Forbidden` with the text and photos completely redacted on the server."*

#### 4. Unsealing & Timeline (0:40)
> *(Action: Click into pre-matured capsule, click 'Unseal Capsule', then visit `/timeline`)*  
> *"Now look at this second capsule whose unlock date has already arrived. The 'Unseal' button is now enabled! Clicking it reveals the letter and photos permanently.  
> Finally, our **Unified Timeline** merges all memories and capsules into one seamless chronological feed with cursor pagination.  
> 
> I’ll now hand over to **[Speaker 4]** for our security verification and conclusion."*

---

### Speaker 4: Security Invariants, Test Rigor & Conclusion (6:15 – 8:00)

**[SLIDE 7: Security Invariants & Automated Testing]**

> *"Thank you, [Speaker 3].  
> 
> Behind this interface is an enterprise-grade security and verification harness:  
> 
> - ***Strict Multi-Tenant Isolation**: Every database query is scoped to the authenticated user's ID. If User B attempts to access or modify User A's memory or capsule, the API returns an unconditional `HTTP 404 Not Found` with zero existence leakage.  
> - ***Compensating Rollbacks**: If a photo is uploaded to Cloudinary but the subsequent database write fails, our rollback handler immediately destroys the orphaned cloud asset.  
> - ***255 Automated Tests**: We built a complete test harness with Vitest and MongoDB Memory Server. All **255 unit and integration tests** execute in under 5 seconds with a 100% pass rate."*

**[SLIDE 8: Roadmap & Project Conclusion]**

> *"For future work, we plan to implement:  
> 1. *Scheduled background email notifications when capsules unlock.  
> 2. *Collaborative group capsules for families and teams.  
> 3. *Offline Progressive Web App (PWA) support.  
> 
> In summary, ECHOES combines modern full-stack web engineering with strict temporal security to create a meaningful, private memory sanctuary.  
> 
> Thank you. Our team is now ready to take your questions."*

---

## 🛡️ Quick Q&A Reference (Who Answers What)

- **Speaker 1 handles**: Product vision, user flows, problem statement & competitor comparisons.
- **Speaker 2 handles**: Database modeling, Next.js Route Handlers vs Express, JWT & cookies, Cloudinary setup.
- **Speaker 3 handles**: UI implementation, GSAP/Lenis animations, frontend form validation, lightbox accessibility.
- **Speaker 4 handles**: Security invariants, 403 temporal lock logic, compensating rollbacks, and Vitest test suite.
