# API Documentation

## Project Details
* **Project Name**: AI Job Hunter (Apply-AI)
* **Document Version**: 1.0.0
* **Date**: August 2026

---

## Table of Contents
- [3.1 Base URL](#31-base-url)
- [3.2 Authentication Method](#32-authentication-method)
- [3.3 Standard Error Response Format](#33-standard-error-response-format)
- [3.4 Complete Endpoints List](#34-complete-endpoints-list)
  - [3.4.1 Jobs API](#341-jobs-api)
  - [3.4.2 Profiles API](#342-profiles-api)
  - [3.4.3 Matcher API](#343-matcher-api)

---

## 3.1 Base URL
* **Development**: `http://localhost:8000/api`
* **Production**: `https://api.jobhunter.ai/api`

## 3.2 Authentication Method
AI Job Hunter utilizes **JWT (JSON Web Token)** authentication issued by Supabase Auth.
* Protected endpoints require the HTTP `Authorization` header:
  ```http
  Authorization: Bearer <your_supabase_jwt_access_token>
  ```
* Unauthenticated endpoints: `GET /api/jobs/` and `GET /api/jobs/<id>/`.

## 3.3 Standard Error Response Format
All endpoint errors return a consistent JSON response structure:
```json
{
  "error": "Error title or code",
  "detail": "Detailed message describing the failure condition",
  "code": 400
}
```

---

## 3.4 Complete Endpoints List

### 3.4.1 Jobs API

#### 1. List Jobs
* **Endpoint URL**: `/api/jobs/`
* **HTTP Method**: `GET`
* **Description**: Retrieves a paginated/filtered list of active job postings.
* **Authentication**: Optional (Public)
* **Request Headers**:
  ```http
  Content-Type: application/json
  ```
* **Query Parameters**:
  * `search` (string, optional): Keyword search in title/description.
  * `location` (string, optional): Location filter.
  * `job_type` (string, optional): `full-time`, `part-time`, `remote`, `freelance`.
  * `country` (string, optional): Filter by country name.
  * `is_remote` (boolean, optional): `true` or `false`.
* **Request Body**: None (GET)
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 101,
      "title": "Senior Python Django Developer",
      "company": "Tech Innovations Inc.",
      "location": "Remote",
      "country": "United States",
      "job_type": "full-time",
      "salary_min": 120000,
      "salary_max": 150000,
      "currency": "USD",
      "source": "greenhouse",
      "source_url": "https://boards.greenhouse.io/techinnovations/jobs/101",
      "is_remote": true,
      "date_posted": "2026-08-01"
    }
  ]
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "error": "Invalid Parameters",
    "detail": "Invalid filter argument for job_type parameter."
  }
  ```
* **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `500 Internal Server Error`.

---

#### 2. Get Job Detail
* **Endpoint URL**: `/api/jobs/<id>/`
* **HTTP Method**: `GET`
* **Description**: Retrieves detailed information for a specific job listing by primary key ID.
* **Authentication**: Optional (Public)
* **Request Headers**:
  ```http
  Content-Type: application/json
  ```
* **Request Body**: None (GET)
* **Success Response (200 OK)**:
  ```json
  {
    "id": 101,
    "title": "Senior Python Django Developer",
    "company": "Tech Innovations Inc.",
    "location": "Remote",
    "country": "United States",
    "job_type": "full-time",
    "description": "We are looking for a Senior Django backend engineer...",
    "requirements": "5+ years of experience with Python, REST framework, and PostgreSQL.",
    "salary_min": 120000,
    "salary_max": 150000,
    "currency": "USD",
    "source": "greenhouse",
    "source_url": "https://boards.greenhouse.io/techinnovations/jobs/101",
    "source_id": "101",
    "is_remote": true,
    "date_posted": "2026-08-01",
    "is_active": true
  }
  ```
* **Error Response (404 Not Found)**:
  ```json
  {
    "error": "Not Found",
    "detail": "Job with ID 9999 does not exist."
  }
  ```
* **HTTP Status Codes**: `200 OK`, `404 Not Found`.

---

#### 3. Fetch Fresh Jobs (Trigger Scraper)
* **Endpoint URL**: `/api/jobs/fetch/`
* **HTTP Method**: `POST`
* **Description**: Executes background job scrapers across configured external portals and saves new records.
* **Authentication**: Required (`Bearer <token>`)
* **Request Headers**:
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
* **Request Body**:
  ```json
  {}
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "scrapers": {
      "greenhouse": 15,
      "ashby": 10,
      "remoteok": 20,
      "arbeitnow": 12
    },
    "total_fetched": 57,
    "database": {
      "new": 18,
      "skipped": 39,
      "total": 57
    }
  }
  ```
* **Error Response (401 Unauthorized)**:
  ```json
  {
    "error": "Unauthorized",
    "detail": "Authentication credentials were not provided."
  }
  ```
* **HTTP Status Codes**: `200 OK`, `401 Unauthorized`, `500 Internal Server Error`.

---

#### 4. Analyze Job Text (AI)
* **Endpoint URL**: `/api/jobs/analyze/`
* **HTTP Method**: `POST`
* **Description**: Uses Groq LLM to extract structured technical skills, experience requirements, and responsibilities from job description text.
* **Authentication**: Required (`Bearer <token>`)
* **Request Headers**:
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
* **Request Body Schema**:
  ```json
  {
    "job_description": "string (required)"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "job_title": "Full Stack Engineer",
    "company": "SaaS Platform Inc.",
    "required_skills": ["React", "Python", "Django", "PostgreSQL"],
    "preferred_skills": ["Docker", "Redis", "AWS"],
    "experience_level": "Mid Level (3+ years)",
    "key_responsibilities": [
      "Develop responsive UI in React",
      "Build scalable REST APIs using DRF"
    ]
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "error": "Bad Request",
    "detail": "Field 'job_description' is required."
  }
  ```
* **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`.

---

#### 5. Analyze Job Image / OCR (AI Vision)
* **Endpoint URL**: `/api/jobs/analyze-image/`
* **HTTP Method**: `POST`
* **Description**: Extracts structured job skills and details from an uploaded screenshot using Llama Vision LLM.
* **Authentication**: Required (`Bearer <token>`)
* **Request Headers**:
  ```http
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  ```
* **Request Body**: Multipart form data with file field `file` (image/png or image/jpeg).
* **Success Response (200 OK)**:
  ```json
  {
    "job_title": "Senior DevOps Engineer",
    "company": "CloudTech",
    "required_skills": ["Kubernetes", "Terraform", "AWS", "CI/CD"],
    "preferred_skills": ["Go", "Prometheus"],
    "experience_level": "Senior (5+ years)"
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "error": "Bad Request",
    "detail": "No image file provided."
  }
  ```
* **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`.

---

#### 6. Generate Tailored Resume
* **Endpoint URL**: `/api/jobs/generate-resume/`
* **HTTP Method**: `POST`
* **Description**: Generates an ATS-tailored resume summary and bullet points based on candidate profile and target job.
* **Authentication**: Required (`Bearer <token>`)
* **Request Headers**:
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
* **Request Body Schema**:
  ```json
  {
    "job_id": "integer (required)",
    "custom_instructions": "string (optional)"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "tailored_summary": "Results-driven Software Engineer with expertise in Python, Django, and React...",
    "tailored_skills": ["Python", "Django", "PostgreSQL", "REST APIs", "React"],
    "experience_bullets": [
      "Engineered high-throughput backend services using Django REST Framework.",
      "Optimized SQL query response time by 40% using PostgreSQL indexing."
    ]
  }
  ```
* **Error Response (404 Not Found)**:
  ```json
  {
    "error": "Not Found",
    "detail": "Target job ID does not exist."
  }
  ```
* **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`, `404 Not Found`.

---

#### 7. Generate Recruiter Cold Email
* **Endpoint URL**: `/api/jobs/generate-email/`
* **HTTP Method**: `POST`
* **Description**: Generates a personalized outreach email for contacting hiring managers.
* **Authentication**: Required (`Bearer <token>`)
* **Request Headers**:
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
* **Request Body Schema**:
  ```json
  {
    "job_id": "integer (required)",
    "recruiter_name": "string (optional)",
    "tone": "string (optional: professional / friendly / concise)"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "subject": "Application for Senior Python Developer - Alex Chen",
    "email_body": "Dear Hiring Manager,\n\nI recently came across the Senior Python Developer opening at Tech Innovations Inc..."
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "error": "Bad Request",
    "detail": "job_id is required."
  }
  ```
* **HTTP Status Codes**: `200 OK`, `400 Bad Request`, `401 Unauthorized`.

---

#### 8. Saved Jobs (List & Create)
* **Endpoint URL**: `/api/jobs/saved/`
* **HTTP Method**: `GET` / `POST`
* **Description**: `GET` lists all bookmarked jobs for the user; `POST` saves a job.
* **Authentication**: Required (`Bearer <token>`)
* **Request Headers**:
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
* **POST Request Body**:
  ```json
  {
    "job_id": 101,
    "note": "Applied via referral link on Aug 3"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "id": 15,
    "supabase_uid": "usr_abc123",
    "job": 101,
    "note": "Applied via referral link on Aug 3",
    "saved_at": "2026-08-03T12:00:00Z"
  }
  ```
* **HTTP Status Codes**: `200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`.

---

#### 9. Delete Saved Job
* **Endpoint URL**: `/api/jobs/saved/<job_id>/`
* **HTTP Method**: `DELETE`
* **Description**: Removes a saved job from the candidate's bookmarked list.
* **Authentication**: Required (`Bearer <token>`)
* **Success Response (204 No Content)**: Empty response.
* **HTTP Status Codes**: `204 No Content`, `401 Unauthorized`, `404 Not Found`.

---

### 3.4.2 Profiles API

#### 1. Get/Update User Profile
* **Endpoint URL**: `/api/profiles/`
* **HTTP Method**: `GET` / `POST` / `PUT`
* **Description**: Retrieves or updates candidate profile details.
* **Authentication**: Required (`Bearer <token>`)
* **Request Body**:
  ```json
  {
    "name": "Alex Chen",
    "email": "alex.chen@example.com",
    "skills": "Python, Django, React, PostgreSQL, REST APIs",
    "experience_level": "mid",
    "preferred_roles": "Backend Engineer, Full Stack Developer",
    "target_countries": "United States, Remote, Germany",
    "job_types_wanted": "full-time, remote",
    "min_salary": 90000.00
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "id": 5,
    "supabase_uid": "usr_abc123",
    "name": "Alex Chen",
    "email": "alex.chen@example.com",
    "skills": "Python, Django, React, PostgreSQL, REST APIs",
    "experience_level": "mid",
    "preferred_roles": "Backend Engineer, Full Stack Developer",
    "target_countries": "United States, Remote, Germany",
    "job_types_wanted": "full-time, remote",
    "min_salary": "90000.00",
    "created_at": "2026-08-01T08:00:00Z"
  }
  ```
* **HTTP Status Codes**: `200 OK`, `201 Created`, `401 Unauthorized`.

---

#### 2. Upload PDF CV
* **Endpoint URL**: `/api/profiles/cvs/upload/`
* **HTTP Method**: `POST`
* **Description**: Uploads PDF resume file and auto-extracts skills via PDF parser and LLM.
* **Authentication**: Required (`Bearer <token>`)
* **Request Headers**:
  ```http
  Authorization: Bearer <token>
  Content-Type: multipart/form-data
  ```
* **Request Form**: `label` (string), `is_default` (boolean), `file` (binary PDF).
* **Success Response (201 Created)**:
  ```json
  {
    "id": 12,
    "label": "FullStack_Resume_2026.pdf",
    "extracted_skills": "Python, Django, React, TypeScript, Docker, SQL",
    "is_default": true,
    "uploaded_at": "2026-08-03T10:30:00Z"
  }
  ```
* **HTTP Status Codes**: `201 Created`, `400 Bad Request`, `401 Unauthorized`.

---

### 3.4.3 Matcher API

#### 1. Compute Job Matches
* **Endpoint URL**: `/api/matcher/match/`
* **HTTP Method**: `POST`
* **Description**: Computes 0-100% match scores between user candidate profile/CV and active jobs.
* **Authentication**: Required (`Bearer <token>`)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "total_matched": 45,
    "top_match_score": 94.5
  }
  ```
* **HTTP Status Codes**: `200 OK`, `401 Unauthorized`.

---

#### 2. Get Matched Jobs List
* **Endpoint URL**: `/api/matcher/matches/`
* **HTTP Method**: `GET`
* **Description**: Returns top ranked job matches for authenticated user sorted by `match_score` descending.
* **Authentication**: Required (`Bearer <token>`)
* **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "match_score": 94.5,
      "job": {
        "id": 101,
        "title": "Senior Python Django Developer",
        "company": "Tech Innovations Inc.",
        "location": "Remote",
        "country": "United States",
        "job_type": "full-time"
      }
    }
  ]
  ```
* **HTTP Status Codes**: `200 OK`, `401 Unauthorized`.
