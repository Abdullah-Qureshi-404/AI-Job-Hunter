# API Documentation

Base URL: http://localhost:8000  
Authentication: All endpoints require Authorization: Bearer token except GET /api/jobs/ and GET /api/jobs/<id>/  
How to get token: Use Supabase sign in with email and password  

---

# Job Hunter API Endpoints

## Jobs

### 1. List Jobs
- **Method and URL**: GET `/api/jobs/`
- **Authentication**: No
- **Request Headers**:
```http
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
[
  {
    "id": 1,
    "title": "Senior Django Developer",
    "company": "Tech Solutions Inc.",
    "location": "San Francisco, CA",
    "job_type": "full-time",
    "source": "greenhouse",
    "date_posted": "2026-07-25",
    "is_remote": true
  },
  {
    "id": 2,
    "title": "Backend Python Engineer",
    "company": "DataWorks LLC",
    "location": "Remote",
    "job_type": "full-time",
    "source": "remoteok",
    "date_posted": "2026-07-24",
    "is_remote": true
  }
]
```
- **What it does**: Retrieves a list of active job listings with optional search, filtering, and ordering capabilities.

---

### 2. Job Detail
- **Method and URL**: GET `/api/jobs/<id>/`
- **Authentication**: No
- **Request Headers**:
```http
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
{
  "id": 1,
  "title": "Senior Django Developer",
  "company": "Tech Solutions Inc.",
  "location": "San Francisco, CA",
  "country": "United States",
  "job_type": "full-time",
  "description": "We are seeking a Senior Django Developer to build robust, scalable web applications and RESTful APIs using Python, Django, and PostgreSQL.",
  "requirements": "5+ years of experience with Python and Django, strong SQL knowledge, experience with REST APIs and Docker.",
  "salary_min": 120000,
  "salary_max": 150000,
  "currency": "USD",
  "source": "greenhouse",
  "source_url": "https://boards.greenhouse.io/techsolutions/jobs/12345",
  "source_id": "12345",
  "is_remote": true,
  "date_posted": "2026-07-25",
  "date_fetched": "2026-07-26T10:00:00Z",
  "is_active": true
}
```
- **What it does**: Retrieves complete detailed information for a single job listing by its unique identifier.

---

### 3. Fetch Jobs
- **Method and URL**: POST `/api/jobs/fetch/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
{
  "success": true,
  "scrapers": {
    "greenhouse": 12,
    "ashby": 8,
    "remoteok": 15,
    "arbeitnow": 10
  },
  "total_fetched": 45,
  "failed_sources": [],
  "database": {
    "new": 10,
    "skipped": 35,
    "total": 45
  }
}
```
- **What it does**: Triggers job fetching from all configured web scrapers and saves newly discovered listings to the database.

---

### 4. Analyze Job
- **Method and URL**: POST `/api/jobs/analyze/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "job_description": "We are looking for a Python Django backend developer with 2 years experience in REST APIs, PostgreSQL, and Celery."
}
```
- **Example Response**:
```json
{
  "job_title": "Python Django Backend Developer",
  "company": "Tech Solutions Inc.",
  "required_skills": [
    "Python",
    "Django",
    "REST APIs",
    "PostgreSQL"
  ],
  "preferred_skills": [
    "Celery",
    "Redis",
    "Docker"
  ],
  "experience_level": "Mid Level (2 years)",
  "key_responsibilities": [
    "Develop and maintain RESTful backend APIs",
    "Optimize database queries in PostgreSQL",
    "Implement asynchronous background tasks using Celery"
  ]
}
```
- **What it does**: Analyzes raw job description text via the ApplyAI service to extract structured skills, requirements, and responsibilities.

---

### 5. Analyze Job Image
- **Method and URL**: POST `/api/jobs/analyze-image/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: multipart/form-data
```
- **Request Body**:
```http
--boundary
Content-Disposition: form-data; name="file"; filename="job_screenshot.png"
Content-Type: image/png

<binary image data>
--boundary--
```
- **Example Response**:
```json
{
  "job_title": "Senior Frontend Engineer",
  "company": "Creative Labs",
  "required_skills": [
    "React",
    "TypeScript",
    "CSS3",
    "HTML5"
  ],
  "preferred_skills": [
    "Next.js",
    "Tailwind CSS"
  ],
  "experience_level": "Senior Level (5+ years)",
  "key_responsibilities": [
    "Build scalable UI components with React and TypeScript",
    "Collaborate with UX designers to implement responsive web interfaces"
  ]
}
```
- **What it does**: Analyzes an uploaded image or screenshot of a job posting using vision AI to extract structured job details.

---

### 6. Generate Resume
- **Method and URL**: POST `/api/jobs/generate-resume/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "job_description": "We are looking for a Python Django backend developer with 2 years experience in REST APIs and PostgreSQL."
}
```
- **Example Response**:
```json
{
  "job_analysis": {
    "job_title": "Python Django Backend Developer",
    "company": "TechCorp",
    "required_skills": [
      "Python",
      "Django",
      "REST APIs",
      "PostgreSQL"
    ],
    "preferred_skills": [
      "Docker",
      "Git"
    ],
    "experience_level": "Mid Level",
    "key_responsibilities": [
      "Build backend APIs",
      "Manage database schemas"
    ]
  },
  "resume_content": {
    "professional_summary": "Results-driven Backend Engineer with 2+ years of experience specializing in Python, Django, and RESTful API development...",
    "highlighted_skills": [
      "Python",
      "Django",
      "REST APIs",
      "PostgreSQL",
      "Git"
    ],
    "tailored_experiences": [
      {
        "role": "Software Engineer",
        "company": "Innovate Tech",
        "bullet_points": [
          "Designed and deployed Django REST APIs serving 50k daily active users.",
          "Optimized PostgreSQL queries, reducing API endpoint response times by 35%."
        ]
      }
    ]
  }
}
```
- **What it does**: Generates tailored resume content aligned with a target job description using the candidate's uploaded resume intelligence.

---

### 7. Generate Email
- **Method and URL**: POST `/api/jobs/generate-email/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "job_title": "Python Developer",
  "company_name": "TechCorp",
  "job_description": "We are looking for a Python Django backend developer with 2 years experience in REST APIs and PostgreSQL."
}
```
- **Example Response**:
```json
{
  "subject": "Application for Python Developer at TechCorp - John Doe",
  "body": "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Python Developer role at TechCorp. With over 2 years of hands-on experience building scalable REST APIs and managing PostgreSQL databases using Python and Django, I am confident in my ability to contribute effectively to your team.\n\nThank you for your time and consideration.\n\nBest regards,\nJohn Doe"
}
```
- **What it does**: Generates a personalized outreach application email based on job details and the candidate's experience profile.

---

## Matcher

### 8. Match Jobs
- **Method and URL**: POST `/api/matcher/match/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
[
  {
    "id": 1,
    "supabase_uid": "usr_987654321",
    "job": {
      "id": 1,
      "title": "Senior Django Developer",
      "company": "Tech Solutions Inc.",
      "location": "San Francisco, CA",
      "country": "United States",
      "job_type": "full-time",
      "description": "We are seeking a Senior Django Developer...",
      "requirements": "Python, Django, PostgreSQL",
      "salary_min": 120000,
      "salary_max": 150000,
      "currency": "USD",
      "source": "greenhouse",
      "source_url": "https://boards.greenhouse.io/techsolutions/jobs/12345",
      "source_id": "12345",
      "is_remote": true,
      "date_posted": "2026-07-25",
      "date_fetched": "2026-07-26T10:00:00Z",
      "is_active": true
    },
    "match_score": 88.5,
    "matched_at": "2026-07-29T18:00:00Z"
  }
]
```
- **What it does**: Calculates match scores between active job listings and the user's extracted profile skills, returning ranked job matches.

---

## Profiles

### 9. Get Profile
- **Method and URL**: GET `/api/profiles/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
[
  {
    "id": 1,
    "supabase_uid": "usr_987654321",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "skills": "Python, Django, PostgreSQL, REST APIs, React",
    "experience_level": "mid",
    "preferred_roles": "Backend Engineer, Full Stack Developer",
    "target_countries": "United States, Germany, Remote",
    "job_types_wanted": "full-time, remote",
    "min_salary": "95000.00",
    "created_at": "2026-07-20T14:30:00Z"
  }
]
```
- **What it does**: Retrieves the career profile details associated with the authenticated user.

---

### 10. Create Profile
- **Method and URL**: POST `/api/profiles/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "skills": "Python, Django, PostgreSQL, REST APIs, React",
  "experience_level": "mid",
  "preferred_roles": "Backend Engineer, Full Stack Developer",
  "target_countries": "United States, Germany, Remote",
  "job_types_wanted": "full-time, remote",
  "min_salary": "95000.00"
}
```
- **Example Response**:
```json
{
  "id": 1,
  "supabase_uid": "usr_987654321",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "skills": "Python, Django, PostgreSQL, REST APIs, React",
  "experience_level": "mid",
  "preferred_roles": "Backend Engineer, Full Stack Developer",
  "target_countries": "United States, Germany, Remote",
  "job_types_wanted": "full-time, remote",
  "min_salary": "95000.00",
  "created_at": "2026-07-29T18:15:00Z"
}
```
- **What it does**: Creates a new career profile storing candidate contact details, skills, and target job parameters.

---

### 11. List CVs
- **Method and URL**: GET `/api/profiles/cvs/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
[
  {
    "id": 1,
    "profile": 1,
    "label": "Backend Developer CV 2026",
    "file": "/media/cvs/john_doe_backend_cv.pdf",
    "extracted_skills": "Python, Django, PostgreSQL, Docker, Redis",
    "is_default": true,
    "uploaded_at": "2026-07-22T09:12:00Z"
  }
]
```
- **What it does**: Fetches uploaded CV files and extracted skills associated with user profiles.

---

### 12. Upload CV
- **Method and URL**: POST `/api/profiles/cvs/upload/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: multipart/form-data
```
- **Request Body**:
```http
--boundary
Content-Disposition: form-data; name="profile"

1
--boundary
Content-Disposition: form-data; name="label"

Backend Developer Resume
--boundary
Content-Disposition: form-data; name="file"; filename="john_doe_cv.pdf"
Content-Type: application/pdf

<binary PDF data>
--boundary--
```
- **Example Response**:
```json
{
  "id": 1,
  "profile": 1,
  "label": "Backend Developer Resume",
  "file": "/media/cvs/john_doe_cv.pdf",
  "extracted_skills": "John Doe\nSoftware Engineer\nSkills: Python, Django, PostgreSQL, REST APIs...\n",
  "is_default": false,
  "uploaded_at": "2026-07-29T18:20:00Z"
}
```
- **What it does**: Uploads a PDF CV file, extracts its text content automatically using PyPDF, and saves it to the profile.

---

### 13. Delete CV
- **Method and URL**: DELETE `/api/profiles/cvs/<id>/delete/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
{}
```
- **What it does**: Permanently deletes a CV record from the database and removes its stored PDF file from disk.

---

# ApplyAI FastAPI Endpoints

Base URL: http://localhost:8001  
Authentication: All endpoints require Authorization: Bearer token except GET /  

---

### 1. Health Check
- **Method and URL**: GET `/`
- **Authentication**: No
- **Request Headers**:
```http
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
{
  "status": "ApplyAI backend running"
}
```
- **What it does**: Checks backend microservice health status.

---

### 2. Upload Resume
- **Method and URL**: POST `/resumes/upload`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: multipart/form-data
```
- **Request Body**:
```http
--boundary
Content-Disposition: form-data; name="resume_type"

backend
--boundary
Content-Disposition: form-data; name="file"; filename="resume.pdf"
Content-Type: application/pdf

<binary PDF data>
--boundary--
```
- **Example Response**:
```json
{
  "resume_id": "res_123456",
  "file_name": "resume.pdf",
  "resume_type": "backend",
  "status": "uploaded_and_embedded"
}
```
- **What it does**: Uploads a PDF resume to Supabase storage and generates vector embeddings for retrieval.

---

### 3. Get Resumes
- **Method and URL**: GET `/resumes/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
[
  {
    "resume_id": "res_123456",
    "file_name": "resume.pdf",
    "resume_type": "backend",
    "uploaded_at": "2026-07-29T10:00:00Z",
    "is_embedded": true
  }
]
```
- **What it does**: Returns all stored resumes and embedding status for the authenticated user.

---

### 4. Delete Resume
- **Method and URL**: DELETE `/resumes/{resume_id}`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
{
  "message": "Resume res_123456 deleted successfully."
}
```
- **What it does**: Deletes a resume document and its associated embeddings from storage.

---

### 5. Analyze Job Description
- **Method and URL**: POST `/job/analyze`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "job_description": "We are looking for a Python Django backend developer with 2 years experience in REST APIs and PostgreSQL."
}
```
- **Example Response**:
```json
{
  "job_title": "Python Django Backend Developer",
  "company": "Tech Solutions Inc.",
  "required_skills": [
    "Python",
    "Django",
    "REST APIs",
    "PostgreSQL"
  ],
  "preferred_skills": [
    "Celery",
    "Docker"
  ],
  "experience_level": "Mid Level (2 years)",
  "key_responsibilities": [
    "Develop RESTful APIs",
    "Manage PostgreSQL databases"
  ]
}
```
- **What it does**: Parses job description text using LLM logic to extract key job requirements and skills.

---

### 6. Analyze Job Image
- **Method and URL**: POST `/job/analyze-image`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: multipart/form-data
```
- **Request Body**:
```http
--boundary
Content-Disposition: form-data; name="file"; filename="screenshot.png"
Content-Type: image/png

<binary image data>
--boundary--
```
- **Example Response**:
```json
{
  "job_title": "Senior Frontend Engineer",
  "company": "Creative Labs",
  "required_skills": [
    "React",
    "TypeScript"
  ],
  "preferred_skills": [
    "Next.js"
  ],
  "experience_level": "Senior Level",
  "key_responsibilities": [
    "Build React components"
  ]
}
```
- **What it does**: Processes an uploaded job post image file via Vision AI model to extract structured job details.

---

### 7. Generate Resume Content
- **Method and URL**: POST `/generate/resume`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "job_description": "We are looking for a Python Django backend developer with 2 years experience in REST APIs and PostgreSQL."
}
```
- **Example Response**:
```json
{
  "job_analysis": {
    "job_title": "Python Django Backend Developer",
    "company": "TechCorp",
    "required_skills": [
      "Python",
      "Django"
    ],
    "preferred_skills": [
      "PostgreSQL"
    ],
    "experience_level": "Mid Level",
    "key_responsibilities": [
      "API development"
    ]
  },
  "resume_content": {
    "professional_summary": "Experienced Python Backend Engineer...",
    "highlighted_skills": [
      "Python",
      "Django",
      "PostgreSQL"
    ]
  }
}
```
- **What it does**: Uses RAG retriever and LLM composer to generate tailored resume content matching the target job description.

---

### 8. Get User Intelligence Profile
- **Method and URL**: GET `/profile/`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{}
```
- **Example Response**:
```json
{
  "user_id": "usr_987654321",
  "skills": [
    "Python",
    "Django",
    "PostgreSQL",
    "REST APIs",
    "Docker"
  ],
  "experience": [
    "Backend Developer",
    "Software Engineer"
  ]
}
```
- **What it does**: Extracts comprehensive skill and experience profiles from all user uploaded resumes.

---

### 9. Generate Outreach Email
- **Method and URL**: POST `/email/generate`
- **Authentication**: Yes
- **Request Headers**:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
- **Request Body**:
```json
{
  "job_title": "Python Developer",
  "company_name": "TechCorp",
  "job_description": "We are looking for a Python Django backend developer with 2 years experience in REST APIs and PostgreSQL."
}
```
- **Example Response**:
```json
{
  "subject": "Application for Python Developer at TechCorp",
  "body": "Dear Hiring Manager,\n\nI am writing to express my interest in the Python Developer position..."
}
```
- **What it does**: Generates a tailored candidate application email utilizing candidate resume context.
