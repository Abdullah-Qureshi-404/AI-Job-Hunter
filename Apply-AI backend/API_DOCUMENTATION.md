# ApplyAI FastAPI Service — Complete API Testing Documentation

**Base URL**: `http://localhost:8001`  
**Authentication**: Supabase Bearer Token (`Authorization: Bearer <token>`)

---

## Overview

This document provides complete integration and testing specifications for all API endpoints exposed by the **ApplyAI FastAPI microservice** (`http://localhost:8001`). All JSON request bodies and responses are formatted for immediate copy-pasting into Postman, Swagger UI, Insomnia, or frontend test suites.

---

--------------------------------
API Name: Health Check  
Method: GET  
Endpoint: `/`  

Purpose:  
Verifies that the ApplyAI FastAPI backend microservice is active, healthy, and accessible.

Authentication:  
None (Public)

Path Parameters:  
None

Query Parameters:  
None

Request Body:  
None

Example Request:
```json
{}
```

Expected Success Response (200 OK):
```json
{
  "status": "ApplyAI backend running"
}
```

Possible Error Responses:
```json
{
  "detail": "Internal server error"
}
```

Required Headers:
```http
Content-Type: application/json
```

--------------------------------
API Name: Upload Resume PDF  
Method: POST  
Endpoint: `/resumes/upload`  

Purpose:  
Uploads a candidate PDF resume file to Supabase storage, parses text, and generates vector embeddings for AI RAG retrieval.

Authentication:  
Required (`Authorization: Bearer <your_supabase_token>`)

Path Parameters:  
None

Query Parameters:  
None

Request Body:  
Multipart Form-Data containing:
- `file`: PDF binary document file
- `resume_type`: string category (e.g. `"backend"`, `"frontend"`, `"general"`)

Example Request:
```json
{
  "resume_type": "backend",
  "file": "sample_resume.pdf"
}
```

Expected Success Response (200 OK / 201 Created):
```json
{
  "resume_id": "res_123456",
  "file_name": "sample_resume.pdf",
  "resume_type": "backend",
  "status": "uploaded_and_embedded"
}
```

Possible Error Responses:
```json
{
  "detail": "Invalid file type. Only PDF files are accepted."
}
```
```json
{
  "detail": "Could not validate credentials"
}
```

Required Headers:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: multipart/form-data
```

--------------------------------
API Name: Get Resumes  
Method: GET  
Endpoint: `/resumes/`  

Purpose:  
Retrieves metadata for all uploaded resumes and vector embedding statuses associated with the authenticated user.

Authentication:  
Required (`Authorization: Bearer <your_supabase_token>`)

Path Parameters:  
None

Query Parameters:  
None

Request Body:  
None

Example Request:
```json
{}
```

Expected Success Response (200 OK):
```json
[
  {
    "resume_id": "res_123456",
    "file_name": "sample_resume.pdf",
    "resume_type": "backend",
    "uploaded_at": "2026-07-29T10:00:00Z",
    "is_embedded": true
  },
  {
    "resume_id": "res_789012",
    "file_name": "fullstack_cv.pdf",
    "resume_type": "fullstack",
    "uploaded_at": "2026-07-28T14:20:00Z",
    "is_embedded": true
  }
]
```

Possible Error Responses:
```json
{
  "detail": "Invalid token or expired session"
}
```

Required Headers:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```

--------------------------------
API Name: Delete Resume  
Method: DELETE  
Endpoint: `/resumes/{resume_id}`  

Purpose:  
Permanently deletes a resume file from storage and removes its vector embeddings from the vector database.

Authentication:  
Required (`Authorization: Bearer <your_supabase_token>`)

Path Parameters:  
- `resume_id` (string, required): Unique identifier of the target resume (e.g. `res_123456`).

Query Parameters:  
None

Request Body:  
None

Example Request:
```json
{}
```

Expected Success Response (200 OK):
```json
{
  "message": "Resume res_123456 deleted successfully."
}
```

Possible Error Responses:
```json
{
  "detail": "Resume res_123456 not found"
}
```
```json
{
  "detail": "Unauthorized access"
}
```

Required Headers:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```

--------------------------------
API Name: Analyze Job Description  
Method: POST  
Endpoint: `/job/analyze`  

Purpose:  
Parses raw job description text via LLM to extract structured required skills, preferred skills, experience level, and key responsibilities.

Authentication:  
Required (`Authorization: Bearer <your_supabase_token>`)

Path Parameters:  
None

Query Parameters:  
None

Request Body:  
JSON object with required string field `job_description`.

Example Request:
```json
{
  "job_description": "We are looking for a Python Django backend developer with 2 years experience in REST APIs, PostgreSQL, and Celery."
}
```

Expected Success Response (200 OK):
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

Possible Error Responses:
```json
{
  "detail": "job_description field is required"
}
```
```json
{
  "detail": "Could not validate credentials"
}
```

Required Headers:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```

--------------------------------
API Name: Analyze Job Image  
Method: POST  
Endpoint: `/job/analyze-image`  

Purpose:  
Processes an uploaded screenshot or image of a job description using Vision AI to extract structured job details.

Authentication:  
Required (`Authorization: Bearer <your_supabase_token>`)

Path Parameters:  
None

Query Parameters:  
None

Request Body:  
Multipart Form-Data containing:
- `file`: Image binary file (JPEG, PNG, or WEBP)

Example Request:
```json
{
  "file": "job_posting_screenshot.png"
}
```

Expected Success Response (200 OK):
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

Possible Error Responses:
```json
{
  "detail": "Invalid image format. Allowed formats: JPEG, PNG, WEBP."
}
```
```json
{
  "detail": "Authentication token missing or invalid"
}
```

Required Headers:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: multipart/form-data
```

--------------------------------
API Name: Generate Resume Content  
Method: POST  
Endpoint: `/generate/resume`  

Purpose:  
Retrieves candidate resume vector embeddings (RAG) and composes tailored resume bullet points and summary matching a target job description.

Authentication:  
Required (`Authorization: Bearer <your_supabase_token>`)

Path Parameters:  
None

Query Parameters:  
None

Request Body:  
JSON object with required string field `job_description`.

Example Request:
```json
{
  "job_description": "We are looking for a Python Django backend developer with 2 years experience in REST APIs and PostgreSQL."
}
```

Expected Success Response (200 OK):
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
    "summary": "Results-driven Backend Engineer with 2+ years of experience specializing in Python, Django, and RESTful API development...",
    "skills": [
      "Python",
      "Django",
      "REST APIs",
      "PostgreSQL",
      "Git"
    ],
    "experience": [
      {
        "title": "Software Engineer",
        "company": "Innovate Tech",
        "duration": "Jan 2023 - Present",
        "bullets": [
          "Designed and deployed Django REST APIs serving 50k daily active users.",
          "Optimized PostgreSQL queries, reducing API endpoint response times by 35%."
        ]
      }
    ],
    "projects": [
      {
        "name": "Job Matcher",
        "description": "Vector search over resume chunks to rank job postings.",
        "tech_stack": ["Python", "Pinecone", "FastAPI"]
      }
    ],
    "education": {
      "degree": "BSc Computer Science",
      "institution": "Example University",
      "year": "2022"
    }
  }
}
```

The shape above is enforced by `ResumeGenerationResponse`
(`schemas/generate_schema.py`). Every field has a default, so missing values
come back as `""` or `[]` rather than causing an error. `job_analysis`
follows `JobAnalysisResponse` (`schemas/job_schema.py`) with the same
defaulting behaviour.

Possible Error Responses:
```json
{
  "detail": "job_description field is required"
}
```
```json
{
  "detail": "Unauthorized"
}
```

Required Headers:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```

--------------------------------
API Name: Get User Intelligence Profile  
Method: GET  
Endpoint: `/profile/`  

Purpose:  
Extracts and aggregates user intelligence (detected technical skills and past experience roles) parsed across all uploaded resumes.

Authentication:  
Required (`Authorization: Bearer <your_supabase_token>`)

Path Parameters:  
None

Query Parameters:  
None

Request Body:  
None

Example Request:
```json
{}
```

Expected Success Response (200 OK):
```json
{
  "user_id": "usr_987654321",
  "skills": [
    "Python",
    "Django",
    "PostgreSQL",
    "REST APIs",
    "Docker",
    "React"
  ],
  "experience": [
    "Backend Developer",
    "Software Engineer"
  ]
}
```

Possible Error Responses:
```json
{
  "detail": "Could not validate token"
}
```
```json
{
  "detail": "No profile intelligence found. Upload a resume first."
}
```

Required Headers:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```

--------------------------------
API Name: Generate Outreach Email  
Method: POST  
Endpoint: `/email/generate`  

Purpose:  
Generates a personalized cold outreach cover letter / email based on target job parameters and candidate experience background.

Authentication:  
Required (`Authorization: Bearer <your_supabase_token>`)

Path Parameters:  
None

Query Parameters:  
None

Request Body:  
JSON object with required fields: `job_title`, `company_name`, `job_description`.

Example Request:
```json
{
  "job_title": "Python Developer",
  "company_name": "TechCorp",
  "job_description": "We are looking for a Python Django backend developer with 2 years experience in REST APIs and PostgreSQL."
}
```

Expected Success Response (200 OK):
```json
{
  "subject": "Application for Python Developer at TechCorp - John Doe",
  "body": "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Python Developer role at TechCorp. With over 2 years of hands-on experience building scalable REST APIs and managing PostgreSQL databases using Python and Django, I am confident in my ability to contribute effectively to your team.\n\nThank you for your time and consideration.\n\nBest regards,\nJohn Doe"
}
```

Possible Error Responses:
```json
{
  "detail": "Missing required fields: job_title, company_name, job_description"
}
```
```json
{
  "detail": "Invalid authorization token"
}
```

Required Headers:
```http
Authorization: Bearer <your_supabase_token>
Content-Type: application/json
```
