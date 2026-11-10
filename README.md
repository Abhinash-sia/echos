# ECHOES — Digital Memory Vault & Personal Time Capsule

> **Computer Science & Engineering Minor Project**

ECHOES is a modern, web-based digital memory preservation platform and personal time capsule. It enables users to record life experiences, curate photograph-supported memories in chronological order, and compose reflective letters to their future selves. The platform's distinctive capability is its cryptographic/date-locked time capsule mechanism that securely seals letters and memories until a specified future release date.

---

## 1. Project Overview

- **Title**: ECHOES: Digital Memory Vault and Personal Time Capsule
- **Type**: CSE Minor Project
- **Architecture**: Unified Full-Stack Next.js (App Router) with Next.js Route Handlers for REST APIs and MongoDB for document persistence.
- **Current Milestone**: **Phase 2 Completed** (Memory Journal CRUD, Cloudinary Private Photo Management, Search, Filtering, and Compensating Rollbacks).

---

## 2. Technology Stack

| Layer                   | Technology                         | Purpose                                                                  |
| :---------------------- | :--------------------------------- | :----------------------------------------------------------------------- |
| **Framework**           | Next.js 16 (App Router, Turbopack) | Server-rendered pages & backend Route Handlers                           |
| **Language**            | TypeScript (Strict mode)           | Type safety across client and server                                     |
| **Database**            | MongoDB Community Server (Local)   | Document database for memories, capsules, and users                      |
| **ODM**                 | Mongoose 9                         | Schema definitions, validation, and object modeling                      |
| **Data Validation**     | Zod                                | Runtime schema validation for requests and environment                   |
| **Authentication**      | `jose` (JWT) & `bcrypt`            | Stateless token authentication, session revocation, and password hashing |
| **Email Service**       | Nodemailer                         | Transactional email delivery (welcome, reset, confirmation)              |
| **Media Storage**       | Cloudinary                         | Secure authenticated storage and signed time-limited photo delivery      |
| **Test Framework**      | Vitest                             | High-speed unit and integration test runner                              |
| **In-Memory DB**        | MongoDB Memory Server              | Isolated, zero-dependency database for automated tests                   |
| **Integration Testing** | Supertest                          | HTTP assertion library for API endpoints                                 |
| **Styling & Motion**    | Tailwind CSS, Framer Motion, GSAP  | Visual interface and interactive animations _(Phase 4)_                  |

---

## 3. Repository Structure

```
echos/
├── .env.example              # Environment variables template
├── .gitignore                # Version control exclusions
├── .prettierrc               # Code formatting rules
├── .prettierignore           # Prettier ignore patterns
├── eslint.config.mjs         # Flat ESLint configuration
├── next.config.ts            # Next.js runtime configuration
├── package.json              # Dependency manifests and script definitions
├── tsconfig.json             # TypeScript compiler settings
├── vitest.config.mts         # Vitest runner configuration
├── README.md                 # Project guide & technical overview
├── docs/                     # Technical documentation & academic reports
│   ├── architecture.md       # High-level architecture and subsystem design
│   ├── database-design.md    # Schema models, indexing, and relations
│   ├── api-documentation.md  # REST API specification & route contracts
│   ├── decisions.md          # Architectural Decision Records (ADRs 001–016)
│   └── report/               # CSE Minor Project Academic Documentation
│       ├── PROJECT_REPORT.md # Formal academic minor project report
│       ├── PROGRESS.md       # Phase-by-phase implementation progress
│       └── TEST_REPORT.md    # Verification and automated test reports
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── register/route.ts        # POST /api/auth/register
│   │   │   │   ├── login/route.ts           # POST /api/auth/login
│   │   │   │   ├── logout/route.ts          # POST /api/auth/logout
│   │   │   │   ├── me/route.ts              # GET /api/auth/me
│   │   │   │   ├── forgot-password/route.ts # POST /api/auth/forgot-password
│   │   │   │   ├── reset-password/route.ts  # POST /api/auth/reset-password
│   │   │   │   └── change-password/route.ts # PATCH /api/auth/change-password
│   │   │   ├── memories/
│   │   │   │   ├── route.ts                 # POST, GET /api/memories
│   │   │   │   ├── [id]/
│   │   │   │   │   ├── route.ts             # GET, PATCH, DELETE /api/memories/:id
│   │   │   │   │   └── photos/
│   │   │   │   │       ├── route.ts         # POST, GET /api/memories/:id/photos
│   │   │   │   │       └── [photoId]/
│   │   │   │   │           └── route.ts     # DELETE, PATCH /api/memories/:id/photos/:photoId
│   │   │   └── health/
│   │   │       └── route.ts                 # GET /api/health
│   │   ├── globals.css       # Core styling & design tokens
│   │   ├── layout.tsx        # Root HTML layout shell
│   │   └── page.tsx          # Initial entry page
│   ├── lib/
│   │   ├── auth/             # Authentication & session utilities
│   │   │   ├── cookies.ts    # HTTP-only cookie handlers
│   │   │   ├── guard.ts      # Route handler authentication guard & CSRF
│   │   │   ├── jwt.ts        # jose JWT signing and verification
│   │   │   └── password.ts   # bcrypt hashing & crypto tokens
│   │   ├── db.ts             # Mongoose connection pooling & HMR cache
│   │   ├── email/            # Nodemailer email subsystem
│   │   │   ├── mailer.ts     # Transporter configuration & mock support
│   │   │   ├── service.ts    # Domain email dispatchers
│   │   │   └── templates.ts  # Reusable HTML email templates
│   │   ├── env.ts            # Zod-validated environment config
│   │   ├── media/            # Cloudinary private media integration
│   │   │   ├── cloudinary.ts # Upload streams, magic bytes, signed URLs
│   │   │   └── index.ts
│   │   └── security/
│   │       └── rate-limit.ts # Sliding window IP rate limiter (native net.isIP)
│   ├── models/               # Mongoose schema definitions
│   │   ├── Memory.ts         # Memory entries & timeline schema
│   │   ├── Photo.ts          # Cloudinary media assets schema
│   │   ├── TimeCapsule.ts    # Time-locked capsule schema
│   │   ├── User.ts           # User accounts & auth schema
│   │   └── index.ts          # Models registry
│   ├── types/                # Shared TypeScript type definitions
│   │   └── index.ts
│   └── validations/          # Zod request validation schemas
│       ├── auth.ts           # Registration, login, password schemas
│       ├── memory.ts         # Memory creation, update, move photo schemas
│       └── index.ts
└── tests/
    ├── setup.ts              # Global Vitest configuration & environment setup
    ├── helpers/
    │   └── db-handler.ts     # MongoDB Memory Server lifecycle helper
    ├── integration/          # API route integration tests
    │   ├── auth.test.ts      # Register, login, logout, me, session revocation
    │   ├── memory.test.ts    # Memory CRUD, search, filter, pagination
    │   ├── password.test.ts  # Forgot password, reset password, change password
    │   └── photo.test.ts     # Cloudinary mock upload, delete, move, rollbacks
    └── unit/                 # Unit test suites
        ├── db.test.ts        # Database caching & connection tests
        ├── email.test.ts     # Templates & Nodemailer transport tests
        ├── env.test.ts       # Environment variable validation tests
        ├── health.test.ts    # Health check route handler unit tests
        ├── media.test.ts     # Buffer validation & magic bytes tests
        ├── models.test.ts    # Mongoose models validation & lifecycle hooks
        └── rate-limit.test.ts# Rate limit sliding-window & IP tests
```

---

## 4. Getting Started

### Prerequisites

- **Node.js**: `v20.x` or later (tested on `v26.11.1`)
- **npm**: `v10.x` or later
- **MongoDB Community Server**: Running locally at `mongodb://127.0.0.1:27017/echoes`

### Setup Instructions

1. **Clone the repository and enter directory**:

   ```bash
   cd /home/abhi/Projects/echos
   ```

2. **Configure Environment Variables**:

   ```bash
   cp .env.example .env.local
   ```

   _Edit `.env.local` to customize variables if required._

3. **Install Dependencies**:

   ```bash
   npm install
   ```

4. **Verify Build & Lint**:

   ```bash
   npm run lint
   npm run build
   ```

5. **Run Automated Test Suite**:

   ```bash
   npm run test
   ```

6. **Start Local Development Server**:
   ```bash
   npm run dev
   ```

---

### AI Features & LLM Configuration (Ollama / Google Gemini / Groq)

ECHOES includes three AI-powered features—**Timeline Chapter Summaries** (`/timeline`), **Then vs. Now Capsule Insights** (`/capsules/[id]`), and the **AI Curated Bulletin Board** (`/board`)—plus a live connection badge (`GET /api/ai/status`) in the UI.

If no AI variables are set in `.env.local`, ECHOES runs in **local heuristic mode** automatically. To activate a live LLM, choose **one** of the options below in `.env.local` and restart `npm run dev`:

#### Option A: Local LLM via Ollama (Free, Private, No API Key)

1. Install [Ollama](https://ollama.com/) and pull a local model:
   ```bash
   ollama pull llama3.2:3b
   ```
2. Make sure the Ollama server is running:
   ```bash
   ollama serve
   ```
3. Add to `.env.local`:
   ```env
   AI_BASE_URL=http://127.0.0.1:11434/v1
   AI_API_KEY=
   AI_MODEL=llama3.2:3b
   ```

#### Option B: Google AI Studio (Gemini API Key)

Google AI Studio keys work directly through Gemini's OpenAI-compatible endpoint:

1. Create an API key in [Google AI Studio](https://aistudio.google.com/apikey).
2. Add to `.env.local`:
   ```env
   AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
   AI_API_KEY=your_google_gemini_api_key
   AI_MODEL=gemini-2.5-flash
   ```

#### Option C: Groq API Key (Fast Cloud Inference)

1. Create an API key in the [Groq Console](https://console.groq.com/keys).
2. Add to `.env.local`:
   ```env
   AI_BASE_URL=https://api.groq.com/openai/v1
   AI_API_KEY=your_groq_api_key
   AI_MODEL=llama-3.3-70b-versatile
   ```

#### Option D: OpenAI API Key

```env
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=your_openai_api_key
AI_MODEL=gpt-4o-mini
```

> **Verify Connection:** After restarting `npm run dev`, open `/board` or `/timeline`—the status pill at the top will turn **green** (`Local LLM Connected` or `AI Connected`) once the endpoint and model are verified.

---

## 5. Implemented API Endpoints (Phase 1 & AI Extensions)

| Method  | Endpoint                    | Access                 | Description                                                              |
| :------ | :-------------------------- | :--------------------- | :----------------------------------------------------------------------- |
| `GET`   | `/api/health`               | Public                 | System status and service health check                                   |
| `POST`  | `/api/auth/register`        | Public                 | Register user, hash password, set HTTP-only cookie, send welcome email   |
| `POST`  | `/api/auth/login`           | Public                 | Authenticate credentials, return JWT & set HTTP-only cookie              |
| `POST`  | `/api/auth/logout`          | Authenticated / Public | Invalidate token (`tokenVersion++`) and clear HTTP-only cookie           |
| `GET`   | `/api/auth/me`              | Authenticated          | Retrieve current authenticated user profile                              |
| `POST`  | `/api/auth/forgot-password` | Public                 | Generate crypto token hash and dispatch password reset email             |
| `POST`  | `/api/auth/reset-password`  | Public                 | Reset password using valid unexpired token and invalidate prior sessions |
| `PATCH`  | `/api/auth/change-password`     | Authenticated          | Verify current password, save new hash, invalidate other active sessions  |
| `GET`    | `/api/ai/status`                | Authenticated          | Check live connectivity & model availability for configured LLM           |
| `POST`   | `/api/ai/timeline-summary`      | Authenticated          | Summarize a Month/Year timeline chapter (excludes locked capsule content) |
| `POST`   | `/api/ai/capsules/:id/insight`  | Authenticated          | Generate "Then vs. Now" comparison for an unlocked capsule                |
| `GET`    | `/api/ai/board`                 | Authenticated          | List all saved AI bulletin boards hydrated with live items & signed URLs  |
| `POST`   | `/api/ai/board`                 | Authenticated          | Generate an unsaved AI bulletin board draft preview (supports focus query)|
| `PUT`    | `/api/ai/board`                 | Authenticated          | Save a generated board draft as a new or updated board                    |
| `DELETE` | `/api/ai/board/:id`             | Authenticated          | Delete a saved AI bulletin board                                          |

---

## 6. Development Scripts

- `npm run dev`: Launch Next.js local development server with Turbopack.
- `npm run build`: Compile and type-check the Next.js production build.
- `npm run start`: Launch the compiled Next.js production server.
- `npm run lint`: Execute ESLint checks across TypeScript, Next.js, and Vitest files.
- `npm run format`: Automatically format source code with Prettier.
- `npm run format:check`: Validate source code formatting with Prettier without modification.
- `npm run test`: Run the Vitest automated test suite once.
- `npm run test:watch`: Run the Vitest automated test suite in interactive watch mode.
- `npm run test:coverage`: Run Vitest and output code coverage reports via V8.

---

## 7. Academic Documentation References

- [Architecture Design](docs/architecture.md)
- [Database Schema Design](docs/database-design.md)
- [REST API Documentation](docs/api-documentation.md)
- [Architectural Decision Records (ADRs)](docs/decisions.md)
- [Academic Project Report](docs/report/PROJECT_REPORT.md)
- [Phase Progress Tracker](docs/report/PROGRESS.md)
- [Test Report](docs/report/TEST_REPORT.md)
