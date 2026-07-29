import os
import sys
import requests
from supabase import create_client

APPLY_AI_BASE = "http://localhost:8001"
JOB_HUNTER_BASE = "http://localhost:8000"

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://twklxrdaopzgpxrjgltb.supabase.co")
SUPABASE_SERVICE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY"
)

# Test credentials & data
TEST_EMAIL = "applyai.test2026@gmail.com"
TEST_PASSWORD = "123456789"

JOB_DESC = "We are looking for a Python Django backend developer with 2 years experience in REST APIs and PostgreSQL"

results_summary = []

# ----------------------------------------------------
# Get Auth Token
# ----------------------------------------------------
print("=" * 60)
print("AUTHENTICATION SETUP")
print("=" * 60)

token = None
try:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    try:
        auth_resp = supabase.auth.sign_in_with_password({
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = auth_resp.session.access_token
        print("✅ Supabase authentication successful.")
    except Exception as login_err:
        print(f"⚠️ Sign in failed ({login_err}). Attempting sign up...")
        try:
            auth_resp = supabase.auth.sign_up({
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if auth_resp.session:
                token = auth_resp.session.access_token
                print("✅ Supabase sign up successful.")
            else:
                print("⚠️ Sign up registered, but session token requires confirmation.")
        except Exception as signup_err:
            print(f"❌ Supabase sign up error: {signup_err}")
except Exception as e:
    print(f"❌ Failed to initialize Supabase client: {e}")

headers = {"Authorization": f"Bearer {token}"} if token else {}


def log_test(test_num, name, method, url, status_code, response_text, is_pass, skipped=False):
    result_str = "SKIPPED" if skipped else ("PASS" if is_pass else "FAIL")
    print(f"\n--- [{test_num}] {name} ---")
    print(f"Endpoint: {url}")
    print(f"Method: {method}")
    print(f"Status Code: {status_code}")
    snippet = str(response_text)[:300] + "..." if len(str(response_text)) > 300 else str(response_text)
    print(f"Response: {snippet}")
    print(f"Result: {result_str}")

    results_summary.append({
        "number": test_num,
        "endpoint": f"{method} {url}",
        "status_code": status_code,
        "result": result_str
    })


# ----------------------------------------------------
# APPLY AI ENDPOINTS (http://localhost:8001)
# ----------------------------------------------------
print("\n" + "=" * 60)
print("TESTING APPLY AI ENDPOINTS (http://localhost:8001)")
print("=" * 60)

# 1. GET /
try:
    r = requests.get(f"{APPLY_AI_BASE}/")
    is_pass = r.status_code == 200
    log_test(1, "ApplyAI Health Check", "GET", f"{APPLY_AI_BASE}/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(1, "ApplyAI Health Check", "GET", f"{APPLY_AI_BASE}/", "ERR", str(e), False)

# 2. POST /resumes/upload
pdf_path = None
for candidate in ["test_resume.pdf", "sample.pdf", "resume.pdf", "test.pdf"]:
    if os.path.exists(candidate):
        pdf_path = candidate
        break

if pdf_path:
    try:
        with open(pdf_path, "rb") as f:
            files = {"file": (os.path.basename(pdf_path), f, "application/pdf")}
            data = {"resume_type": "backend"}
            r = requests.post(f"{APPLY_AI_BASE}/resumes/upload", headers=headers, files=files, data=data)
            is_pass = r.status_code in [200, 201]
            log_test(2, "Upload Resume", "POST", f"{APPLY_AI_BASE}/resumes/upload", r.status_code, r.text, is_pass)
    except Exception as e:
        log_test(2, "Upload Resume", "POST", f"{APPLY_AI_BASE}/resumes/upload", "ERR", str(e), False)
else:
    log_test(2, "Upload Resume", "POST", f"{APPLY_AI_BASE}/resumes/upload", "N/A", "SKIPPED: No PDF test file found", False, skipped=True)

# 3. GET /resumes/
try:
    r = requests.get(f"{APPLY_AI_BASE}/resumes/", headers=headers)
    is_pass = r.status_code == 200
    log_test(3, "Get Resumes", "GET", f"{APPLY_AI_BASE}/resumes/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(3, "Get Resumes", "GET", f"{APPLY_AI_BASE}/resumes/", "ERR", str(e), False)

# 4. POST /job/analyze
try:
    payload = {"job_description": JOB_DESC}
    r = requests.post(f"{APPLY_AI_BASE}/job/analyze", headers=headers, json=payload)
    is_pass = r.status_code == 200
    log_test(4, "Analyze Job (ApplyAI)", "POST", f"{APPLY_AI_BASE}/job/analyze", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(4, "Analyze Job (ApplyAI)", "POST", f"{APPLY_AI_BASE}/job/analyze", "ERR", str(e), False)

# 5. POST /generate/resume
try:
    payload = {"job_description": JOB_DESC}
    r = requests.post(f"{APPLY_AI_BASE}/generate/resume", headers=headers, json=payload)
    is_pass = r.status_code == 200
    log_test(5, "Generate Resume (ApplyAI)", "POST", f"{APPLY_AI_BASE}/generate/resume", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(5, "Generate Resume (ApplyAI)", "POST", f"{APPLY_AI_BASE}/generate/resume", "ERR", str(e), False)

# 6. GET /profile/
try:
    r = requests.get(f"{APPLY_AI_BASE}/profile/", headers=headers)
    is_pass = r.status_code == 200
    log_test(6, "Get Profile (ApplyAI)", "GET", f"{APPLY_AI_BASE}/profile/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(6, "Get Profile (ApplyAI)", "GET", f"{APPLY_AI_BASE}/profile/", "ERR", str(e), False)

# 7. POST /email/generate
try:
    payload = {
        "job_title": "Python Developer",
        "company_name": "TechCorp",
        "job_description": JOB_DESC
    }
    r = requests.post(f"{APPLY_AI_BASE}/email/generate", headers=headers, json=payload)
    is_pass = r.status_code == 200
    log_test(7, "Generate Email (ApplyAI)", "POST", f"{APPLY_AI_BASE}/email/generate", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(7, "Generate Email (ApplyAI)", "POST", f"{APPLY_AI_BASE}/email/generate", "ERR", str(e), False)


# ----------------------------------------------------
# JOB HUNTER ENDPOINTS (http://localhost:8000)
# ----------------------------------------------------
print("\n" + "=" * 60)
print("TESTING JOB HUNTER ENDPOINTS (http://localhost:8000)")
print("=" * 60)

# 8. GET /api/jobs/
try:
    r = requests.get(f"{JOB_HUNTER_BASE}/api/jobs/", headers=headers)
    is_pass = r.status_code == 200
    log_test(8, "List Jobs", "GET", f"{JOB_HUNTER_BASE}/api/jobs/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(8, "List Jobs", "GET", f"{JOB_HUNTER_BASE}/api/jobs/", "ERR", str(e), False)

# 9. GET /api/jobs/1/
try:
    r = requests.get(f"{JOB_HUNTER_BASE}/api/jobs/1/", headers=headers)
    is_pass = r.status_code in [200, 404]
    log_test(9, "Get Job Detail", "GET", f"{JOB_HUNTER_BASE}/api/jobs/1/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(9, "Get Job Detail", "GET", f"{JOB_HUNTER_BASE}/api/jobs/1/", "ERR", str(e), False)

# 10. POST /api/jobs/analyze/
try:
    payload = {"job_description": JOB_DESC}
    r = requests.post(f"{JOB_HUNTER_BASE}/api/jobs/analyze/", headers=headers, json=payload)
    is_pass = r.status_code == 200
    log_test(10, "Analyze Job (Job Hunter)", "POST", f"{JOB_HUNTER_BASE}/api/jobs/analyze/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(10, "Analyze Job (Job Hunter)", "POST", f"{JOB_HUNTER_BASE}/api/jobs/analyze/", "ERR", str(e), False)

# 11. POST /api/jobs/generate-resume/
try:
    payload = {"job_description": JOB_DESC}
    r = requests.post(f"{JOB_HUNTER_BASE}/api/jobs/generate-resume/", headers=headers, json=payload)
    is_pass = r.status_code == 200
    log_test(11, "Generate Resume (Job Hunter)", "POST", f"{JOB_HUNTER_BASE}/api/jobs/generate-resume/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(11, "Generate Resume (Job Hunter)", "POST", f"{JOB_HUNTER_BASE}/api/jobs/generate-resume/", "ERR", str(e), False)

# 12. POST /api/jobs/generate-email/
try:
    payload = {
        "job_title": "Python Developer",
        "company_name": "TechCorp",
        "job_description": JOB_DESC
    }
    r = requests.post(f"{JOB_HUNTER_BASE}/api/jobs/generate-email/", headers=headers, json=payload)
    is_pass = r.status_code == 200
    log_test(12, "Generate Email (Job Hunter)", "POST", f"{JOB_HUNTER_BASE}/api/jobs/generate-email/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(12, "Generate Email (Job Hunter)", "POST", f"{JOB_HUNTER_BASE}/api/jobs/generate-email/", "ERR", str(e), False)

# 13. POST /api/matcher/match/
try:
    r = requests.post(f"{JOB_HUNTER_BASE}/api/matcher/match/", headers=headers)
    is_pass = r.status_code == 200
    log_test(13, "Match Jobs", "POST", f"{JOB_HUNTER_BASE}/api/matcher/match/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(13, "Match Jobs", "POST", f"{JOB_HUNTER_BASE}/api/matcher/match/", "ERR", str(e), False)

# 14. POST /api/jobs/fetch/
try:
    r = requests.post(f"{JOB_HUNTER_BASE}/api/jobs/fetch/", headers=headers)
    is_pass = r.status_code == 200
    log_test(14, "Fetch Jobs (Scraper)", "POST", f"{JOB_HUNTER_BASE}/api/jobs/fetch/", r.status_code, r.text, is_pass)
except Exception as e:
    log_test(14, "Fetch Jobs (Scraper)", "POST", f"{JOB_HUNTER_BASE}/api/jobs/fetch/", "ERR", str(e), False)


# ----------------------------------------------------
# FINAL SUMMARY TABLE
# ----------------------------------------------------
print("\n" + "=" * 60)
print("SUMMARY RESULTS")
print("=" * 60)
print(f"{'Endpoint':<45} | {'Status Code':<12} | {'Result':<10}")
print("-" * 73)

for res in results_summary:
    endpoint_display = res['endpoint'][:44]
    print(f"{endpoint_display:<45} | {str(res['status_code']):<12} | {res['result']:<10}")

print("=" * 60)
