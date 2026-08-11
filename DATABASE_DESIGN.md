# Database Design Document

## Project Details
* **Project Name**: AI Job Hunter System (Apply-AI)
* **Document Version**: 1.0.0
* **Date**: August 2026

---

## Table of Contents
- [4.1 Purpose & Scope](#41-purpose--scope)
- [4.2 Entity Relationship Diagram](#42-entity-relationship-diagram)
- [4.3 Full Table Definitions](#43-full-table-definitions)
  - [4.3.1 jobs_job Table](#431-jobs_job-table)
  - [4.3.2 jobs_savedjob Table](#432-jobs_savedjob-table)
  - [4.3.3 profiles_profile Table](#433-profiles_profile-table)
  - [4.3.4 profiles_cv Table](#434-profiles_cv-table)
  - [4.3.5 matcher_matchedjob Table](#435-matcher_matchedjob-table)
- [4.4 Data Dictionary & Naming Conventions](#44-data-dictionary--naming-conventions)
- [4.5 Migration Strategy](#45-migration-strategy)

---

## 4.1 Purpose & Scope
This document details the relational database schema design for the **AI Job Hunter** platform. The database persists job postings from multi-source scrapers, user profiles, uploaded CV metadata, match scores, and user application bookmarks. The primary production database is **PostgreSQL** hosted on Supabase DB with SQLite fallback support for local environments.

## 4.2 Entity Relationship Diagram

```text
  +-----------------------+              +-----------------------+
  |    profiles_profile   |              |       profiles_cv     |
  +-----------------------+              +-----------------------+
  | PK  id                |<------------1| PK  id                |
  | FK  supabase_uid (UQ) |<---+  (1:N)  | FK  profile_id        |
  |     email (UQ)        |    |         |     file              |
  |     skills            |    |         |     extracted_skills  |
  |     experience_level  |    |         +-----------------------+
  +-----------------------+    |
                               |
                               |
  +-----------------------+    |         +-----------------------+
  |      jobs_job         |    |         |     jobs_savedjob     |
  +-----------------------+    |         +-----------------------+
  | PK  id                |<---|--------1| PK  id                |
  | UQ  (source,source_id)|<--+|  (1:N)  | FK  job_id            |
  |     title             |   ||         | DB  supabase_uid      |
  |     company           |   ||         |     note              |
  |     description       |   ||         +-----------------------+
  +-----------------------+   ||
                              ||
                              ||         +-----------------------+
                              ||         |  matcher_matchedjob   |
                              ||         +-----------------------+
                              +|--------1| PK  id                |
                               |  (1:N)  | FK  job_id            |
                               +-------->| DB  supabase_uid      |
                                         |     match_score       |
                                         +-----------------------+
```

---

## 4.3 Full Table Definitions

### 4.3.1 `jobs_job` Table
* **Description**: Primary store for scraped job postings collected across external job boards.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BigInt / Auto | **PK**, NOT NULL | Auto-incrementing primary key. |
| `title` | VarChar(255) | NOT NULL | Job position title. |
| `company` | VarChar(255) | NOT NULL | Company name offering the position. |
| `location` | VarChar(255) | NOT NULL | City/Region string or "Remote". |
| `country` | VarChar(255) | NULL | Country name for filtering. |
| `job_type` | VarChar(20) | NOT NULL | Choice: `full-time`, `part-time`, `remote`, etc. |
| `description` | Text | NOT NULL, DEFAULT '' | Raw job description text. |
| `requirements` | Text | NOT NULL, DEFAULT '' | Extracted skill/experience requirements. |
| `description_formatted`| Text | NOT NULL, DEFAULT '' | LLM-restructured markdown description. |
| `salary_min` | Integer | NULL | Minimum offered salary. |
| `salary_max` | Integer | NULL | Maximum offered salary. |
| `currency` | VarChar(10) | NOT NULL, DEFAULT '' | Currency code (e.g. "USD", "EUR"). |
| `source` | VarChar(30) | NOT NULL | Choice: `greenhouse`, `ashby`, `remoteok`, `jobspy_linkedin`, etc. |
| `source_url` | VarChar(200) | NOT NULL | Original URL of job posting. |
| `source_id` | VarChar(255) | NOT NULL | Unique posting identifier from source platform. |
| `is_remote` | Boolean | NOT NULL, DEFAULT False | Flag indicating remote availability. |
| `date_posted` | Date | NULL | Date job was posted on external platform. |
| `date_fetched` | DateTime | NOT NULL, AUTO_NOW_ADD | Timestamp when record was created. |
| `is_active` | Boolean | NOT NULL, DEFAULT True | Active listing flag. |

* **Indexes**:
  * `idx_jobs_source`: `source` (Fast filtering by job source)
  * `idx_jobs_country`: `country` (Country filtering)
  * `idx_jobs_job_type`: `job_type` (Job type filtering)
  * `idx_jobs_is_remote`: `is_remote` (Remote toggle filtering)
  * `idx_jobs_date_posted`: `date_posted` (Chronological ordering)
* **Constraints**:
  * `UNIQUE(source, source_id)` (Prevents duplicate scraping insertion).

---

### 4.3.2 `jobs_savedjob` Table
* **Description**: Connects user Supabase UID to bookmarked jobs with user notes.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BigInt / Auto | **PK**, NOT NULL | Auto-increment primary key. |
| `supabase_uid` | VarChar(255) | NOT NULL, INDEX | Foreign Supabase Auth user UUID string. |
| `job_id` | BigInt | **FK**, NOT NULL | References `jobs_job.id` ON DELETE CASCADE. |
| `note` | Text | NOT NULL, DEFAULT '' | Candidate notes on application status. |
| `saved_at` | DateTime | NOT NULL, AUTO_NOW_ADD | Bookmark creation timestamp. |

* **Indexes**:
  * `idx_saved_user_date`: `(supabase_uid, -saved_at)` (Fast list retrieval per user)
* **Relationships**:
  * **Many-to-One** with `jobs_job` (`job_id`).
* **Constraints**:
  * `UNIQUE(supabase_uid, job_id)` (Prevents duplicate saving of same job).

---

### 4.3.3 `profiles_profile` Table
* **Description**: User profile data, career preferences, and aggregated technical skills.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BigInt / Auto | **PK**, NOT NULL | Auto-increment primary key. |
| `supabase_uid` | VarChar(255) | **UNIQUE**, NULL | Supabase Auth UUID linkage. |
| `name` | VarChar(200) | NOT NULL | Candidate full name. |
| `email` | VarChar(254) | **UNIQUE**, NOT NULL | Candidate email address. |
| `skills` | Text | NOT NULL | Comma-separated list of candidate skills. |
| `experience_level` | VarChar(20) | NOT NULL | Choice: `junior`, `mid`, `senior`. |
| `preferred_roles` | Text | NOT NULL | Target job titles desired. |
| `target_countries` | Text | NOT NULL | Desired geographic locations. |
| `job_types_wanted` | Text | NOT NULL | Desired employment types. |
| `min_salary` | Decimal(12,2) | NULL | Minimum desired compensation. |
| `created_at` | DateTime | NOT NULL, AUTO_NOW_ADD | Profile creation timestamp. |

---

### 4.3.4 `profiles_cv` Table
* **Description**: Metadata for PDF resume files uploaded by candidates.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BigInt / Auto | **PK**, NOT NULL | Auto-increment primary key. |
| `profile_id` | BigInt | **FK**, NOT NULL | References `profiles_profile.id` ON DELETE CASCADE. |
| `label` | VarChar(255) | NOT NULL | Display name/label for CV version. |
| `file` | VarChar(100) | NOT NULL | File path relative to media storage. |
| `extracted_skills`| Text | NOT NULL, DEFAULT '' | Extracted skills from PDF parser. |
| `is_default` | Boolean | NOT NULL, DEFAULT False | Flag for primary resume. |
| `uploaded_at` | DateTime | NOT NULL, AUTO_NOW_ADD | Upload timestamp. |

* **Relationships**:
  * **Many-to-One** with `profiles_profile` (`profile_id`).

---

### 4.3.5 `matcher_matchedjob` Table
* **Description**: Pre-computed match scores between candidate profiles and job postings.

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | BigInt / Auto | **PK**, NOT NULL | Primary key ID. |
| `supabase_uid` | VarChar(255) | NOT NULL | Supabase user UUID string. |
| `job_id` | BigInt | **FK**, NOT NULL | References `jobs_job.id` ON DELETE CASCADE. |
| `match_score` | Float | NOT NULL | Match percentage score (0.0 to 100.0). |
| `matched_at` | DateTime | NOT NULL, AUTO_NOW_ADD | Score calculation timestamp. |

* **Indexes**:
  * `idx_matched_score`: `match_score` (Ordering by match score descending)
* **Constraints**:
  * `UNIQUE(supabase_uid, job_id)` (One match score entry per user-job pair).

---

## 4.4 Data Dictionary & Naming Conventions
1. **Table Naming**: Lowercase snake_case prefixed by Django app module (e.g., `jobs_job`, `profiles_profile`, `matcher_matchedjob`).
2. **Column Naming**: Lowercase snake_case (e.g., `supabase_uid`, `salary_min`, `date_posted`).
3. **Primary Keys**: Named `id` as auto-incrementing 64-bit integer (`BigInt`).
4. **Foreign Keys**: Suffix `_id` appended to reference table entity (e.g., `job_id`, `profile_id`).
5. **Timestamps**: `created_at`, `uploaded_at`, `saved_at`, `matched_at` set via `AUTO_NOW_ADD`.

## 4.5 Migration Strategy
* Database migrations are managed through standard Django ORM migration files (`python manage.py makemigrations` and `python manage.py migrate`).
* Seed scripts (`python manage.py fetch_jobs`) populate initial job postings.
