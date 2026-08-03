# Software Requirements Specification (SRS)

## Project Details
* **System Name**: AI Job Hunter System (Apply-AI)
* **Document Version**: 1.0.0
* **Date**: August 2026

---

## Table of Contents
- [2.1 Introduction & Scope](#21-introduction--scope)
- [2.2 System Architecture Overview](#22-system-architecture-overview)
- [2.3 Functional Requirements](#23-functional-requirements)
- [2.4 Non-Functional Requirements](#24-non-functional-requirements)
- [2.5 User Roles & Permissions](#25-user-roles--permissions)
- [2.6 System Use Cases](#26-system-use-cases)
- [2.7 External Interface Requirements](#27-external-interface-requirements)
- [2.8 System Constraints](#28-system-constraints)
- [2.9 Assumptions & Dependencies](#29-assumptions--dependencies)

---

## 2.1 Introduction & Scope
This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the **AI Job Hunter** application. The system provides automated job discovery across multiple job search providers, candidate profile management, PDF CV skill extraction, quantitative match scoring using LLMs, ATS resume tailoring, cold email generation, and application tracking.

## 2.2 System Architecture Overview
AI Job Hunter utilizes a modern decoupled client-server architecture consisting of three primary layers:

1. **Frontend Presentation Layer**: Built with React 19, Vite, and Tailwind CSS v4. Communicates with backend REST APIs using Axios and handles user authentication state via `@supabase/supabase-js`.
2. **Core Backend Application Layer**: Built with Python 3.11, Django 5.x, and Django REST Framework (DRF). Manages data models, user profiles, scraping orchestrators (using `python-jobspy` and custom scrapers), background job execution (`apscheduler`), and REST endpoints.
3. **AI & Microservice Layer**: Integrates Groq SDK (`llama-3.3-70b-versatile` & `llama-3.2-11b-vision-preview`) and FastAPI/LangChain pipelines for high-speed LLM processing, RAG matching, PDF text extraction (`pypdf`), resume tailoring, and email output structuring.
4. **Data Persistence Layer**: PostgreSQL database hosted on Supabase DB with SQLite fallback support for local offline development.

## 2.3 Functional Requirements

| Requirement ID | Module | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FR-001** | Auth | System shall authenticate users via Supabase JWT Bearer Tokens. | **High** |
| **FR-002** | Profile | User shall be able to create, view, and update candidate profile (skills, roles, min salary, preferred countries). | **High** |
| **FR-003** | CV Upload | User shall be able to upload PDF CV files up to 10MB; system extracts raw text and technical skills automatically. | **High** |
| **FR-004** | Job Aggregation | System shall trigger job scrapers across Greenhouse, Ashby, RemoteOK, ArbeitNow, JobSpy (LinkedIn/Indeed), Rozee, and store unique jobs. | **High** |
| **FR-005** | Job Filtering | User shall be able to filter jobs by title, company, location, country, job type (full-time, remote, contract), and source. | **High** |
| **FR-006** | Match Scoring | System shall compute quantitative 0-100% match score between user CV/profile and jobs based on skill overlap. | **High** |
| **FR-007** | Job AI Analysis | System shall parse raw job text or uploaded job image (OCR) to extract required skills, preferred skills, and experience level. | **Medium** |
| **FR-008** | Resume Generator | System shall generate customized ATS resume content tailored to a target job description. | **High** |
| **FR-009** | Email Generator | System shall generate personalized cold outreach emails/cover letters directed to hiring managers. | **High** |
| **FR-010** | Saved Jobs | User shall be able to bookmark target jobs, add notes, view saved list, and delete bookmarks. | **Medium** |

## 2.4 Non-Functional Requirements

### 2.4.1 Performance Requirements
* **API Response Time**: Standard REST API requests must return within < 300ms.
* **LLM Generation Time**: AI operations (resume tailoring, email drafting, match scoring) via Groq API must complete in < 3.0 seconds.
* **Scraper Concurrency**: Scraper engine must execute asynchronously without blocking main application threads.

### 2.4.2 Security Requirements
* **Authentication**: All protected endpoints require valid HTTP Authorization Bearer JWT header.
* **Data Transmission**: All network communication must operate over HTTPS/TLS 1.3.
* **File Upload Safety**: Uploaded files must be validated for MIME type (`application/pdf`) and size limits (<10MB).

### 2.4.3 Usability Requirements
* **Responsive UI**: Interface must adapt seamlessly across desktop, tablet, and mobile displays (Tailwind CSS v4).
* **Feedback & Loading States**: UI must display loading indicators and progress notifications during scraper and AI operations.

### 2.4.4 Reliability & Availability
* **System Uptime**: Core backend service must maintain 99.5% uptime.
* **Error Handling**: Standardized JSON error structures must be returned for all invalid API invocations (400, 401, 404, 500).

### 2.4.5 Scalability
* Database indices on `source`, `country`, `job_type`, `is_remote`, and `supabase_uid` to support millions of job records with sub-second query performance.

## 2.5 User Roles & Permissions

| Role Name | Description | Permissions |
| :--- | :--- | :--- |
| **Guest User** | Unauthenticated visitor | Can list public jobs (`GET /api/jobs/`) and view job details (`GET /api/jobs/<id>/`). |
| **Authenticated Candidate** | Standard logged-in user | Can manage profile, upload CVs, run match scoring, execute job scrapers, generate resumes/emails, bookmark jobs. |
| **System Administrator** | Admin user (Django Admin) | Access to `/admin/` interface to manage database records, user permissions, and scrapers logs. |

## 2.6 System Use Cases

### Use Case 1: UC-01 Upload and Parse CV
* **Actor**: Authenticated Candidate
* **Precondition**: User is logged in and possesses a valid PDF resume file.
* **Main Flow**:
  1. User navigates to Profile page and selects "Upload CV".
  2. User selects PDF file and submits form (`POST /api/profiles/cvs/upload/`).
  3. System parses PDF text using `pypdf`, extracts candidate skills via Groq LLM parser.
  4. System stores CV record in DB and returns parsed skills list.
* **Postcondition**: Parsed skills are attached to user CV record and set as available for job matching.

### Use Case 2: UC-02 Trigger Job Fetching Scrapers
* **Actor**: Authenticated Candidate / System Scheduler
* **Precondition**: System backend is running with active internet access.
* **Main Flow**:
  1. User clicks "Fetch Fresh Jobs" on Dashboard (`POST /api/jobs/fetch/`).
  2. System initiates scrapers for Greenhouse, Ashby, RemoteOK, ArbeitNow, JobSpy.
  3. Deduplication logic checks `(source, source_id)` against existing database entries.
  4. New jobs are saved to PostgreSQL database.
  5. System returns summary count of fetched, added, and skipped jobs.
* **Postcondition**: Database contains updated listing of active jobs.

### Use Case 3: UC-03 Compute Profile-Job Match Scores
* **Actor**: Authenticated Candidate
* **Precondition**: User profile and CV exist in system; jobs exist in database.
* **Main Flow**:
  1. User clicks "Run Job Matcher" (`POST /api/matcher/match/`).
  2. Backend compares profile skills and experience against active job requirements.
  3. Calculated scores (0.0 to 100.0) are saved to `matcher_matchedjob` table.
  4. Frontend retrieves ranked list of job matches (`GET /api/matcher/matches/`).
* **Postcondition**: User sees ordered feed of jobs sorted by match percentage.

### Use Case 4: UC-04 AI Job Screenshot Analysis
* **Actor**: Authenticated Candidate
* **Precondition**: User has screenshot image of job posting.
* **Main Flow**:
  1. User navigates to Job Analyzer and uploads image file (`POST /api/jobs/analyze-image/`).
  2. System sends image payload to Groq Llama-3.2 Vision model.
  3. Model performs OCR and extracts structured job title, company, required skills, preferred skills, and experience level.
  4. System returns structured JSON response to UI.
* **Postcondition**: Extracted job breakdown is rendered visually on UI.

### Use Case 5: UC-05 Generate Tailored ATS Resume & Recruiter Email
* **Actor**: Authenticated Candidate
* **Precondition**: Candidate profile and target job are selected.
* **Main Flow**:
  1. User selects target job and clicks "Generate Resume" or "Generate Email".
  2. Backend sends prompt payload (profile + target job description) to Groq LLM API.
  3. LLM returns formatted ATS resume section or custom outreach email.
  4. User copies generated text or saves draft for application.
* **Postcondition**: Customized application materials ready for submission.

## 2.7 External Interface Requirements
* **Supabase Authentication API**: Validates JWT Bearer Tokens for user session security.
* **Groq Cloud API**: Provides fast LLM completion (`llama-3.3-70b-versatile`) and multimodal vision (`llama-3.2-11b-vision-preview`).
* **External Job Boards**: HTTP scrapers for Greenhouse, Ashby, RemoteOK, ArbeitNow, Rozee, Mustakbil, etc.

## 2.8 System Constraints
* **LLM API Quota**: Groq API request limits per minute (RPM/TPM).
* **Database Size**: Media uploads (PDF CVs) stored in media root or cloud bucket; metadata in PostgreSQL.
* **Browser Compatibility**: Support modern evergreen browsers (Chrome, Firefox, Edge, Safari).

## 2.9 Assumptions & Dependencies
* Python 3.11+ environment for Django backend.
* Node.js 18+ and Vite 6/8 for frontend building.
* Active Supabase project credentials for auth and remote PostgreSQL database connection.
