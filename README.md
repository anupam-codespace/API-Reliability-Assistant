# API Reliability Assistant

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg?logo=express)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini-2.4_%2F_3.x-8E75B2.svg?logo=google-gemini)](https://ai.google.dev/)
[![OWASP API Security](https://img.shields.io/badge/OWASP-API_Top_10_Aligned-red.svg)](https://owasp.org/www-project-api-security/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Empowering engineering teams, QA specialists, and product creators to design, audit, and bulletproof REST APIs before shipping to production.**

---

## 📖 Table of Contents

- [What is API Reliability Assistant?](#-what-is-api-reliability-assistant)
  - [The Problem: Why APIs Break in Production](#the-problem-why-apis-break-in-production)
  - [The Solution: How This Assistant Helps You](#the-solution-how-this-assistant-helps-you)
- [✨ Key Features](#-key-features)
- [🔬 The 7 Pillars of API Reliability (Test Taxonomy)](#-the-7-pillars-of-api-reliability-test-taxonomy)
- [⚙️ How It Works: Dual-Engine Architecture](#️-how-it-works-dual-engine-architecture)
- [🖥️ User Guide: Using the Assistant](#️-user-guide-using-the-assistant)
  - [1. Specifying an API](#1-specifying-an-api)
  - [2. Importing via cURL](#2-importing-via-curl)
  - [3. Pre-Configured Templates](#3-pre-configured-templates)
  - [4. Inspecting Results & Copy-Pasting cURL](#4-inspecting-results--copy-pasting-curl)
  - [5. Exporting Test Suites](#5-exporting-test-suites)
- [🛠️ Developer Core: Tech Stack & Architecture](#️-developer-core-tech-stack--architecture)
  - [Directory Structure](#directory-structure)
  - [Backend API Endpoints](#backend-api-endpoints)
  - [Dual-Engine Implementation Details](#dual-engine-implementation-details)
- [🚀 Quickstart & Local Setup](#-quickstart--local-setup)
  - [Prerequisites](#prerequisites)
  - [Installation Steps](#installation-steps)
  - [Environment Configuration](#environment-configuration)
  - [Running the Application](#running-the-application)
- [🔒 Security & Privacy Guarantees](#-security--privacy-guarantees)
- [🤝 Contributing & Support](#-contributing--support)

---

## 💡 What is API Reliability Assistant?

### For Everyone (Plain English)

An **API** (Application Programming Interface) is the digital plumbing of modern software: it lets your phone app talk to a server, your web shop process credit card payments, or your delivery app fetch live GPS coordinates. 

When an API fails or behaves unpredictably:
- Customers see error messages or blank screens.
- Duplicate charges or corrupted customer profiles happen.
- Malicious attackers exploit loopholes to access other people's private data.

**API Reliability Assistant** is an intelligent assistant designed to examine any API endpoint and tell you **every single way it could fail, behave unexpectedly, or be exploited** — long before real users ever touch it. 

You provide your API's URL, parameters, and sample request (or simply paste a raw `cURL` command). In seconds, the assistant analyzes the contract and produces:
1. **A Complete QA Test Plan**: Positive tests, boundary limits, negative tests, and error scenarios.
2. **Security & Vulnerability Audits**: Tests for unauthorized tenant access (BOLA/IDOR), injection attacks, and rate limits.
3. **HTTP Status Code Mapping**: Precise RFC 9110 codes (200, 201, 400, 401, 403, 404, 409, 422, 429, 500) and why they occur.
4. **Copy-Paste cURL Snippets**: Instant commands ready to run in your terminal or Postman.
5. **Architectural Reliability Observations**: Concrete engineering advice on idempotency keys, retry safety, and error transparency.

---

### The Problem: Why APIs Break in Production

Most software teams only write tests for the "happy path" (e.g., *"Does the user get created when they fill out the form perfectly?"*). 

However, production failures occur in the edge cases:
- What happens if a user submits a 10,000-character name?
- What happens if an attacker replaces their `orderId` with someone else's?
- What happens when a network drop causes a mobile phone to retry a payment request 3 times?
- What if non-English characters or emojis are sent in database fields?
- What happens when someone bombards the login route with 500 requests a second?

---

### The Solution: How This Assistant Helps You

| Stakeholder | How API Reliability Assistant Helps |
| :--- | :--- |
| **Product Managers & Founders** | Understand the reliability risks and security posture of features before release without needing to read lines of code. |
| **QA & Test Engineers** | Eliminate hours of manual test case writing; automatically generate hundreds of edge cases, status code matrices, and boundary tests. |
| **Backend & Full-Stack Developers** | Get an instant pre-flight audit for missing input validation, unhandled exceptions, non-idempotent operations, and OWASP API security holes. |
| **Security Auditors** | Rapidly probe for Broken Object Level Authorization (IDOR/BOLA), mass assignment vulnerabilities, and rate-limit defenses. |

---

## ✨ Key Features

- ⚡ **Instant Test Generation**: Generates 20+ comprehensive test scenarios across 7 distinct categories in seconds.
- 🤖 **Dual-Engine Pipeline**:
  - **Google Gemini AI Engine**: Context-aware deep semantic reasoning using Google's Gemini models.
  - **Offline Deterministic Rule Engine**: Zero-network fallback engine guaranteeing sub-second analysis even when offline or without an API key.
- 📥 **1-Click cURL Importer**: Paste any `curl` command directly; the app automatically parses the HTTP method, headers, endpoint URL, query parameters, and JSON payload.
- 🗂️ **Pre-Built Enterprise Scenarios**: Instant 1-click presets for **User Registration** (POST), **Order Retrieval** (GET with IDOR check), and **Inventory Stock Update** (PUT with optimistic locking).
- 🏷️ **Field Validation & Regex Engine**: Define specific regex constraints (e.g., email RFC 5322 compliance) to generate targeted boundary test cases.
- 🔐 **OWASP API Security Alignment**: Tests against the OWASP API Security Top 10, including BOLA/IDOR, mass assignment, injection, and lack of rate limiting.
- 📊 **Reliability Health Score**: Comprehensive numerical rating (0–100) and qualitative risk level (Low, Medium, High).
- 📋 **Terminal-Ready cURL Generator**: One-click copying of safe, realistic test commands with placeholder tokens.
- 💾 **Export in Standard Formats**:
  - **JSON**: Export the full API contract definition.
  - **Markdown**: Export the entire QA test suite report formatted for documentation, GitHub PRs, or Jira tickets.
- ⌨️ **Keyboard Shortcut**: Press `Cmd + Enter` (Mac) or `Ctrl + Enter` (Windows/Linux) to immediately trigger analysis.

---

## 🔬 The 7 Pillars of API Reliability (Test Taxonomy)

Every analysis systematically generates test cases across seven mission-critical dimensions:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     API Reliability Assistant Suite                     │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ├── 1. Positive Tests (Happy path, minimal payloads, query combos)
         ├── 2. Negative Tests (Missing fields, malformed syntax, 405 verbs)
         ├── 3. Edge & Boundary Cases (10k buffer limits, unicode, max integers)
         ├── 4. Validation Checks (Regex formats, mass assignment, null types)
         ├── 5. Authentication Checks (Missing/expired tokens, malformed headers)
         ├── 6. Authorization Checks (BOLA / IDOR cross-tenant access, RBAC)
         └── 7. Security Checks (SQLi/XSS payloads, rate-limiting bursts, leaks)
```

1. **Positive Tests (Happy Path)**
   - Baseline successful invocation with all parameters.
   - Minimal schema compliance (only sending mandatory attributes and testing default values).
   - Query parameter filtering, sorting, and pagination combinations.
2. **Negative Tests (Error Handling)**
   - Missing mandatory fields and null constraints.
   - Type mismatches (e.g., passing a string where an integer is expected).
   - Malformed JSON syntax (unclosed brackets, invalid escape sequences).
   - Unsupported HTTP methods (e.g., calling `TRACE` or `OPTIONS` expecting `405 Method Not Allowed`).
3. **Edge & Boundary Conditions**
   - Extremely large payloads (10,000+ character strings, buffer exhaustion).
   - Multi-byte UTF-8 encodings, right-to-left (RTL) strings, and emoji handling.
   - Empty or whitespace-only inputs (`"   "`).
   - Numeric maximums (e.g., 64-bit integer limit `9223372036854775807`).
4. **Validation & Schema Integrity**
   - Regex validation (verifies custom patterns such as email or SKU structure).
   - Mass assignment prevention (ensuring fields like `role: "admin"` or `is_verified: true` are stripped).
   - Null handling in non-nullable database columns.
5. **Authentication Checks**
   - Missing `Authorization` header (`401 Unauthorized`).
   - Expired, revoked, or cryptographically invalid token signatures.
   - Incorrect authentication schemes (e.g., sending `Basic` when `Bearer` is expected).
6. **Authorization & Tenant Isolation**
   - **BOLA / IDOR (Broken Object Level Authorization)**: Authenticated User A attempting to inspect or alter User B's resources (`403 Forbidden`).
   - Vertical privilege escalation (standard user invoking administrative actions).
7. **Security & Vulnerability Defenses**
   - Defensive checks against SQL injection (`' OR '1'='1' --`) and NoSQL operators.
   - Cross-Site Scripting (XSS) script tag injection in text inputs.
   - Volumetric rate-limiting burst tests (100 rapid requests expecting `429 Too Many Requests`).
   - Sensitive data exposure audits (verifying password hashes or internal database stack traces are never returned).

---

## ⚙️ How It Works: Dual-Engine Architecture

API Reliability Assistant combines the semantic intelligence of LLMs with the reliability of a deterministic rule engine:

```
 [User Input / cURL] 
         │
         ▼
 [Input Sanitizer & cURL Parser]
         │
         ▼
 ┌────────────────────────────────────────────────────────┐
 │                   Analysis Controller                  │
 └────────────────────────────────────────────────────────┘
         │
         ├─── Has valid GEMINI_API_KEY?
         │         │
         │         ├─► [YES] ──► Google Gen AI (Gemini 3.1/3.8 Flash)
         │         │                 │ (Contextual reasoning & tailored tests)
         │         │                 │
         │         │                 ▼ (If timeout or quota limit)
         │         └─► [NO]  ──► Deterministic Rule Engine
         │                           │ (Sub-second, offline-ready, RFC 9110 rules)
         │                           ▼
         └──────────────────► [Synthesizer & Normalizer]
                                     │
                                     ▼
                   [Unified Reliability Analysis Report]
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
      [Interactive UI]       [Markdown Export]       [JSON Export]
```

1. **Intelligent Primary Engine (Google Gemini AI)**: When configured with `GEMINI_API_KEY`, the application uses the `@google/genai` SDK with strict JSON schema definitions to generate deep, tailored edge cases specifically reflecting the domain of your endpoint.
2. **Zero-Crash Failover (Deterministic Rule Engine)**: If no API key is provided, or if the AI service is unreachable or times out, the system automatically falls back to its built-in rule engine (`server/ruleEngine.ts`). This guarantees **100% uptime and immediate results** regardless of external network state.

---

## 🖥️ User Guide: Using the Assistant

### 1. Specifying an API

On the left-hand panel:
- **HTTP Method**: Choose `GET`, `POST`, `PUT`, `PATCH`, or `DELETE`.
- **Endpoint URL**: Enter your target URL (e.g., `https://api.example.com/api/users` or `https://api.example.com/api/orders/{orderId}`).
- **Path & Query Parameters**: Add keys, sample values, and toggle them on/off.
- **Headers**: Manage custom headers like `Content-Type`, `Accept`, or custom tracking IDs.
- **Authentication**: Choose `None`, `Bearer Token`, `API Key`, or `Basic Auth`.
- **Request Body**: Enter the JSON payload for creation/update endpoints (with syntax highlighting and validation).
- **Validation Rules**: Optionally define regex patterns for specific fields (e.g. email or phone formats).
- **Expected Behavior**: Describe what the endpoint should do in natural language.

Click **Run Reliability Analysis** (or press `Cmd + Enter` / `Ctrl + Enter`).

### 2. Importing via cURL

Already have a `curl` command from your terminal, browser DevTools, or documentation?
1. Click **Import cURL** in the header.
2. Paste the command into the modal.
3. The parser extracts the method, URL, headers, and request body automatically.

### 3. Pre-Configured Templates

Want to see how it works immediately? Use the **Examples** dropdown in the navigation bar:
- **User Registration**: `POST /api/users` with password policy, email uniqueness, and regex validation.
- **Order Retrieval**: `GET /api/orders/{orderId}` with strict tenant isolation, Bearer auth, and IDOR testing.
- **Inventory Stock Update**: `PUT /api/inventory/{productId}` with optimistic concurrency locks (`ETag`) and numeric boundary conditions.

### 4. Inspecting Results & Copy-Pasting cURL

Once analyzed, the right panel displays:
- **Executive Summary & Scorecard**: Reliability score (0–100), risk rating, and total test count.
- **Categorized Test Cards**: Filterable tabs for Positive, Negative, Edge, Validation, Auth, and Security tests.
- **HTTP Status Codes Matrix**: RFC 9110 status codes mapped to specific error scenarios.
- **Copyable cURL Commands**: Realistic terminal commands ready to execute against staging or test servers.
- **Architectural Observations**: Concrete remediation notes on idempotency, rate limits, and error leakage.

### 5. Exporting Test Suites

- **Export Suite (.md)**: Downloads a Markdown file formatted with tables, code blocks, and test IDs, ideal for team pull requests, QA documentation, or Jira tickets.
- **Save Contract (.json)**: Downloads the machine-readable API specification to back up or share your configuration.

---

## 🛠️ Developer Core: Tech Stack & Architecture

### Tech Stack

- **Frontend**:
  - [React 19](https://react.dev/) — Declarative UI with functional components and modern hooks.
  - [Tailwind CSS v4](https://tailwindcss.com/) — Modern utility-first styling with custom typography.
  - [Lucide React](https://lucide.dev/) — Consistent, accessible icon set.
  - [Motion](https://motion.dev/) — Smooth, hardware-accelerated animations.
  - [React Markdown](https://github.com/remarkjs/react-markdown) — Markdown rendering for test cases and notes.
- **Backend**:
  - [Node.js & Express](https://expressjs.com/) — Lightweight API server and middleware layer.
  - [Vite 6](https://vitejs.dev/) — Lightning-fast development server and production bundler.
  - [tsx](https://github.com/privatenumber/tsx) — Native TypeScript execution in development.
  - [esbuild](https://esbuild.github.io/) — Fast production bundling for the backend.
- **AI & Reliability**:
  - [@google/genai SDK](https://www.npmjs.com/package/@google/genai) — Official Google GenAI SDK powering Gemini 3.1/3.8 Flash models.
  - **Deterministic Rule Engine** — Built-in TypeScript heuristic engine ensuring zero-dependency test generation.

---

### Directory Structure

```
.
├── server.ts                    # Express server entry point & API route handlers
├── server/
│   ├── geminiService.ts         # Google GenAI integration, model fallback & JSON normalizer
│   └── ruleEngine.ts            # Deterministic, offline-capable test generation engine
├── src/
│   ├── App.tsx                  # Main application container & state orchestration
│   ├── main.tsx                 # React entry point
│   ├── types.ts                 # Shared TypeScript interfaces, types, and schemas
│   ├── index.css                # Tailwind CSS imports & global design tokens
│   ├── components/
│   │   ├── Header.tsx           # Application navigation, example picker & export actions
│   │   ├── ApiInputPanel.tsx    # Comprehensive API contract editor & validation rules
│   │   ├── ResultsPanel.tsx     # Reliability analysis dashboard, scorecard & test tabs
│   │   ├── TestCaseCard.tsx     # Individual test case card with severity badges & copy
│   │   ├── StatusCodesView.tsx  # RFC 9110 HTTP status code matrix view
│   │   ├── SampleRequestsView.tsx# Terminal-ready cURL command generator
│   │   ├── ObservationsView.tsx # Architectural recommendations & risk observations
│   │   ├── CurlImportModal.tsx  # Interactive cURL command parser dialog
│   │   ├── AnalysisLoading.tsx  # Loading animation and status indicator
│   │   └── EmptyState.tsx       # Welcoming starting state with quick-start actions
│   ├── data/
│   │   └── examples.ts          # Pre-configured enterprise API examples
│   └── utils/
│       ├── curlParser.ts        # Robust cURL argument tokenizer and parser
│       ├── exportUtils.ts       # Markdown and JSON file download handlers
│       └── clipboard.ts         # Safe clipboard copy utility with fallback
├── package.json                 # Dependency definitions and scripts
├── tsconfig.json                # TypeScript compiler configuration
└── vite.config.ts               # Vite configuration with Tailwind CSS plugin
```

---

### Backend API Endpoints

The server runs on port `3000` (binding to `0.0.0.0`) and exposes the following endpoints:

#### 1. `POST /api/analyze`
Generates a comprehensive reliability analysis for the submitted API contract.

- **Request Body**: `ApiDefinition` (JSON)
  ```json
  {
    "method": "POST",
    "endpoint": "https://api.example.com/api/users",
    "pathParams": [],
    "queryParams": [],
    "headers": [{ "id": "1", "key": "Content-Type", "value": "application/json", "enabled": true }],
    "auth": { "type": "none" },
    "requestBody": "{\"name\":\"Alice\",\"email\":\"alice@example.com\"}",
    "expectedBehaviour": "Creates user and returns 201."
  }
  ```
- **Response**: `ReliabilityAnalysis` (JSON) containing scores, 7 test categories, status code scenarios, sample requests, and observations.

#### 2. `POST /api/parse-curl`
Parses a raw cURL command string into structured `ApiDefinition` fields.

- **Request Body**:
  ```json
  {
    "curl": "curl -X POST https://api.example.com/api/users -H \"Content-Type: application/json\" -d '{\"name\":\"Alice\"}'"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "method": "POST",
      "endpoint": "https://api.example.com/api/users",
      "headers": [{ "key": "Content-Type", "value": "application/json", "enabled": true }],
      "requestBody": "{\"name\":\"Alice\"}"
    }
  }
  ```

#### 3. `GET /api/health`
Returns service health and Gemini API key status.

- **Response**:
  ```json
  {
    "status": "ok",
    "service": "API Reliability Assistant",
    "timestamp": "2026-09-15T10:30:00.000Z",
    "hasGeminiKey": true
  }
  ```

---

## 🚀 Quickstart & Local Setup

### Prerequisites

- **Node.js**: Version `20.x` or later (tested on Node.js 22+).
- **npm**, **bun**, or **pnpm**.

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/api-reliability-assistant.git
   cd api-reliability-assistant
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your Google Gemini API key:
   ```env
   # GEMINI_API_KEY: Optional but recommended for contextual AI test generation.
   # If left empty, the application automatically uses its built-in rule engine.
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```
   > 💡 *Note: You can get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/). If you don't provide a key, the application will operate using its offline Deterministic Rule Engine.*

---

### Running the Application

#### Development Mode
Starts the Express server with Vite middleware in development mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

#### Type Checking & Linting
Ensure type safety and code consistency:
```bash
npm run lint
```

#### Production Build & Start
Compile the React frontend with Vite and bundle the Express server with esbuild into `dist/server.cjs`:
```bash
npm run build
npm start
```
The production server will listen on port `3000`.

---

## 🔒 Security & Privacy Guarantees

- **Zero Client-Side Secret Leakage**: Your `GEMINI_API_KEY` is strictly managed server-side. It is never included in the browser bundle, local storage, or network responses sent to the client.
- **Safe cURL Generation**: All generated cURL snippets use sanitized placeholder tokens (such as `YOUR_ACCESS_TOKEN` or `YOUR_API_KEY`), ensuring sensitive credentials are never accidentally exposed.
- **No Unsolicited External Storage**: API contracts and test suites reside in browser memory during your active session. Nothing is persisted to external third-party cloud databases unless explicitly configured.
- **Defensive Input Parsing**: cURL commands and JSON payloads are parsed through strict tokenizer guards to prevent command injection and syntax crashes.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). Feel free to use, modify, and distribute it for personal, open-source, or commercial projects.

---

<p align="center">
  Crafted with care for developers and QA engineers who care about rock-solid, production-grade APIs.
</p>
