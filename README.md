# AI Job Hunter (Apply-AI)

> **Autonomous AI-Powered Job Discovery, Intelligent Match Scoring, Tailored Resume Generation & Cold Outreach Automation.**

---

## Table of Contents
- [5.1 Overview / Description](#51-overview--description)
- [5.2 Key Features](#52-key-features)
- [5.3 Tech Stack](#53-tech-stack)
- [5.4 Architecture Overview](#54-architecture-overview)
- [5.5 Prerequisites](#55-prerequisites)
- [5.6 Installation Guide](#56-installation-guide)
- [5.7 Configuration Instructions (.env)](#57-configuration-instructions-env)
- [5.8 Usage Guide](#58-usage-guide)
- [5.9 API Reference](#59-api-reference)
- [5.10 Deployment Instructions](#510-deployment-instructions)
- [5.11 Contributing Guidelines](#511-contributing-guidelines)
- [5.12 License](#512-license)
- [5.13 Contact & Support](#513-contact--support)

---

## 5.1 Overview / Description
**AI Job Hunter** (Apply-AI) is an open-source, full-stack application designed to revolutionize the software job application process. It combines multi-platform web scraping (Greenhouse, Ashby, RemoteOK, JobSpy, Rozee, etc.), Groq-driven Large Language Model (LLM) processing (`llama-3.3-70b` & `llama-3.2-11b-vision`), PDF resume parsing, quantitative candidate-to-job match scoring, ATS resume tailoring, and automated recruiter cold email generation into a single unified workspace.

## 5.2 Key Features
* 🌐 **Multi-Source Job Aggregation**: Scrapes jobs from Greenhouse, Ashby, RemoteOK, ArbeitNow, Rozee, JobSpy (LinkedIn/Indeed), and custom feeds.
* 📄 **PDF CV Parsing & Skill Extraction**: Automatically parses uploaded PDF CVs to extract technical skills and experience level using `pypdf` and LLMs.
* 🎯 **AI Match Scoring (0-100%)**: Quantitative matching engine calculates candidate skill alignment against job posts.
* 📷 **Job Description OCR & Vision Analysis**: Analyzes job description text or uploaded job post screenshots using multimodal Vision LLMs.
* 📝 **ATS Resume Tailoring**: Generates customized resume summaries and achievement bullet points targeted to specific job descriptions.
* ✉️ **Cold Email Generator**: Drafts personalized outreach emails and cover letters addressed to hiring managers.
* 🔖 **Application Tracking & Bookmarks**: Save target jobs, add notes, and track application funnels.

## 5.3 Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React | 19.x | Component-based UI library |
| **Build Tool** | Vite | 6.x / 8.x | High-performance dev server & bundler |
| **Styling** | Tailwind CSS | v4.x | Utility-first responsive styling |
| **Icons & Animations** | Lucide React / Framer Motion | 1.x / 12.x | UI icons and motion transitions |
| **State & Auth** | Supabase JS SDK | 2.111.x | Client authentication & database access |
| **Backend Framework** | Django / Django REST Framework | 5.x / 3.15 | RESTful API backend server |
| **Microservice** | FastAPI | 0.110+ | Microservice for RAG & AI routines |
| **AI LLM Models** | Groq SDK / LangChain Groq | 0.9+ | Llama-3.3-70b & Llama-3.2-11b-vision API |
| **Database** | PostgreSQL / Supabase DB | 15+ | Relational data persistence |
| **Scraper Tools** | Python-JobSpy / BeautifulSoup4 | Latest | Multi-board web scrapers |

## 5.4 Architecture Overview
```text
  +--------------------+         +-----------------------+         +----------------------+
  | React 19 Frontend  |<------->| Django REST Backend   |<------->| PostgreSQL (Supabase)|
  | (Vite + Tailwind)  |         | (Python 3.11 / DRF)   |         +----------------------+
  +--------------------+         +-----------------------+                    ^
            |                                |                                |
            v                                v                                |
  +--------------------+         +-----------------------+                    |
  | Supabase Auth      |         | Groq LLM & Vision API |--------------------+
  | (JWT Tokens)       |         | (Llama-3.3 / Llama-3.2)|
  +--------------------+         +-----------------------+
```

## 5.5 Prerequisites
Before getting started, make sure you have the following software installed:
* **Node.js**: v18.0.0 or higher ([Download Node](https://nodejs.org/))
* **npm**: v9.0.0 or higher
* **Python**: v3.11.0 or higher ([Download Python](https://www.python.org/))
* **Git**: v2.30.0 or higher
* **Groq API Key**: Free key from [Groq Console](https://console.groq.com/)
* **Supabase Project**: Free account at [Supabase](https://supabase.com/)

---

## 5.6 Installation Guide

### Step 1: Clone Repository
```bash
git clone https://github.com/Abdullah-Qureshi-404/AI-Job-Hunter.git
cd AI-Job-Hunter
```

### Step 2: Setup Backend (Django)
```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py makemigrations
python manage.py migrate

# (Optional) Seed initial job data
python manage.py fetch_jobs
```

### Step 3: Setup Frontend (React + Vite)
```bash
# Open a new terminal in the project root directory
cd frontend

# Install Node dependencies
npm install
```

---

## 5.7 Configuration Instructions (.env)

### Backend Environment Variables (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
# Django Settings
SECRET_KEY=your_django_secret_key_here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration (PostgreSQL on Supabase or SQLite fallback)
DATABASE_URL=postgres://postgres:your_password@db.your_supabase_ref.supabase.co:5432/postgres

# Groq LLM API Key
GROQ_API_KEY=gsk_your_groq_api_key_here

# Supabase Auth Configuration
SUPABASE_URL=https://your_supabase_ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Frontend Environment Variables (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_SUPABASE_URL=https://your_supabase_ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 5.8 Usage Guide

### Running local development server:

1. **Start Django Backend**:
   ```bash
   cd backend
   .\venv\Scripts\Activate.ps1   # Windows PowerShell
   python manage.py runserver 0.0.0.0:8000
   ```
   Backend will run at: `http://localhost:8000`

2. **Start React Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run at: `http://localhost:5173`

3. **Using the Application**:
   * Open `http://localhost:5173` in your browser.
   * Sign in / Register using email authentication.
   * Navigate to **Profile** and upload your PDF resume.
   * Click **Fetch Fresh Jobs** to scrape job listings.
   * Go to **Job Matcher** to view calculated match percentages.
   * Click any job to analyze text/screenshot, generate an ATS-tailored resume, and compose a cold recruiter email!

---

## 5.9 API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/jobs/` | List and search active jobs | No |
| `GET` | `/api/jobs/<id>/` | Retrieve detail for a job | No |
| `POST` | `/api/jobs/fetch/` | Trigger job scrapers | Yes |
| `POST` | `/api/jobs/analyze/` | AI job description parsing | Yes |
| `POST` | `/api/jobs/analyze-image/` | AI Vision screenshot parser | Yes |
| `POST` | `/api/jobs/generate-resume/` | Generate ATS resume | Yes |
| `POST` | `/api/jobs/generate-email/` | Generate cold email | Yes |
| `GET/POST`| `/api/jobs/saved/` | View / save bookmarked jobs | Yes |
| `GET/POST`| `/api/profiles/` | View / update user profile | Yes |
| `POST` | `/api/profiles/cvs/upload/` | Upload & parse PDF CV | Yes |
| `POST` | `/api/matcher/match/` | Compute profile-job matches | Yes |
| `GET` | `/api/matcher/matches/` | Get top ranked matched jobs | Yes |

*For complete endpoint request/response payloads, refer to [API_DOCUMENTATION.md](file:///d:/Job%20Hunter/API_DOCUMENTATION.md).*

---

## 5.10 Deployment Instructions

### Production Deployment Strategy:
1. **Frontend Deployment (Vercel / Netlify)**:
   * Build project command: `npm run build`
   * Output directory: `dist`
   * Set Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_BASE_URL`).

2. **Backend Deployment (Render / Railway / DigitalOcean)**:
   * Configure environment variables (`SECRET_KEY`, `DEBUG=False`, `GROQ_API_KEY`, `DATABASE_URL`).
   * Gunicorn WSGI command:
     ```bash
     gunicorn core.wsgi:application --bind 0.0.0.0:$PORT
     ```
   * Execute static files collection: `python manage.py collectstatic --noinput`.

3. **Database (Supabase PostgreSQL)**:
   * Run migrations against production DB: `python manage.py migrate`.

---

## 5.11 Contributing Guidelines
We welcome community contributions!
1. Fork the project repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 5.12 License
Distributed under the MIT License. See `LICENSE` for more information.

---

## 5.13 Contact & Support
* **Author / Maintainer**: Abdullah Qureshi
* **Repository**: [Abdullah-Qureshi-404/AI-Job-Hunter](https://github.com/Abdullah-Qureshi-404/AI-Job-Hunter)
* **Issues & Feedback**: [GitHub Issues](https://github.com/Abdullah-Qureshi-404/AI-Job-Hunter/issues)
