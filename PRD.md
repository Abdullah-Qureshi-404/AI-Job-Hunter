# Product Requirements Document (PRD)

## Project Details
* **Project Name**: AI Job Hunter (Apply-AI)
* **Tagline**: Autonomous AI-Powered Job Discovery, Intelligent Match Scoring, Tailored Resume Generation & Cold Outreach Automation.
* **Document Version**: 1.0.0
* **Date**: August 2026

---

## Table of Contents
- [1.1 Executive Summary](#11-executive-summary)
- [1.2 Product Vision & Goals](#12-product-vision--goals)
- [1.3 Target Users & Personas](#13-target-users--personas)
- [1.4 User Problems & Pain Points](#14-user-problems--pain-points)
- [1.5 Core Features](#15-core-features)
- [1.6 Complete User Flow](#16-complete-user-flow)
- [1.7 Success Metrics (KPIs)](#17-success-metrics-kpis)
- [1.8 Competitor Analysis](#18-competitor-analysis)
- [1.9 Unique Selling Points](#19-unique-selling-points)
- [1.10 Constraints & Assumptions](#110-constraints--assumptions)

---

## 1.1 Executive Summary
AI Job Hunter (Apply-AI) is an end-to-end autonomous job acquisition platform designed to eliminate repetitive application overhead for job seekers. By aggregating job postings across multiple global platforms (Greenhouse, Ashby, RemoteOK, JobSpy, Rozee, etc.), extracting key skill parameters using Groq-driven Large Language Models (LLMs) and Vision OCR, and performing vector-driven match scoring, the platform enables candidates to discover, evaluate, tailor resumes for, and reach out to hiring managers with unprecedented efficiency.

## 1.2 Product Vision & Goals
* **Vision**: Empower job seekers globally with an AI agent that handles job searching, match evaluation, resume tailoring, and outreach creation—converting 10+ hours of weekly manual work into minutes.
* **Primary Goals**:
  1. Aggregate 1,000+ targeted job postings daily across multi-channel job portals.
  2. Deliver accurate (>90% relevance) quantitative match scoring between candidate profile/CV and job descriptions.
  3. Automate context-aware ATS resume tailoring and recruiter cold outreach generation within <3 seconds per request.
  4. Provide a seamless, modern, responsive web application for managing candidate profiles, CVs, and application funnels.

## 1.3 Target Users & Personas

### Persona 1: Alex Chen – Mid-Level Full Stack Engineer
* **Role**: Software Developer (3 years experience)
* **Goal**: Find remote React/Django roles, optimize CV keywords to bypass ATS filters, and submit 20+ quality applications weekly.
* **Pain Point**: Spending 15 minutes per application adjusting resume bullet points and writing custom cover letters.

### Persona 2: Fatima Khan – Tech Graduate & Career Starter
* **Role**: Junior Data Analyst / Python Developer
* **Goal**: Discover entry-level opportunities across local (Rozee, Mustakbil) and international (RemoteOK, Ashby) boards simultaneously.
* **Pain Point**: Difficulty identifying whether job requirements match their skill set without reading lengthy posts.

### Persona 3: Marcus Vance – Senior DevOps Specialist
* **Role**: Lead Cloud Architect / Site Reliability Engineer
* **Goal**: Screen high-paying remote roles, quickly extract key infrastructure tech stacks, and reach out directly to tech recruiters.
* **Pain Point**: Disorganized tracking across multiple bookmarked links and spreadsheets.

## 1.4 User Problems & Pain Points
1. **Fragmented Job Markets**: Jobs are spread across dozens of sites (Greenhouse, Lever, LinkedIn, RemoteOK, local boards).
2. **ATS Rejection & Keyword Mismatch**: Un-tailored resumes fail standard Applicant Tracking Systems.
3. **Manual Analysis Fatigue**: Reading 50+ job descriptions daily leads to decision fatigue and missed opportunities.
4. **Low Cold Outreach Response Rates**: Generic cold messages to recruiters are ignored.

## 1.5 Core Features

| Feature ID | Feature Name | Description | Priority |
| :--- | :--- | :--- | :--- |
| **FEAT-01** | Multi-Source Scraper Engine | Automated & manual scraping across Greenhouse, Ashby, RemoteOK, ArbeitNow, JobSpy (LinkedIn/Indeed), Rozee, etc. | **High** |
| **FEAT-02** | Profile & CV Parser | Upload PDF resumes, auto-extract technical skills, experience level, and save structured candidate profile. | **High** |
| **FEAT-03** | AI Match Scoring Engine | Quantitative 0–100% score calculation matching user CV/profile skills with job description requirements via Groq LLM. | **High** |
| **FEAT-04** | AI Job & Screenshot Analyzer | Deep analysis of job text or uploaded job post screenshots via Vision LLM to extract skills, level, and responsibilities. | **Medium** |
| **FEAT-05** | AI Resume Generator | Generates ATS-optimized, targeted resume text tailored specifically to selected job requirements. | **High** |
| **FEAT-06** | Cold Outreach Email Generator | Generates professional, recruiter-facing outreach emails and cover letters personalized with job details. | **High** |
| **FEAT-07** | Application Tracker & Bookmarks | Bookmark target jobs, add custom notes, and track application status in a clean user dashboard. | **Medium** |

## 1.6 Complete User Flow
1. **Onboarding & Authentication**: User registers/logs in using email or Supabase Authentication.
2. **Profile & CV Upload**: User completes candidate profile details (skills, target roles, preferred countries, min salary) and uploads primary PDF CV.
3. **Job Discovery**: User views aggregated job feed, filtered by role, country, remote status, or job board source.
4. **Scraper Execution**: User or system triggers background fetch (`/api/jobs/fetch/`) to pull real-time job listings.
5. **Match Evaluation**: User runs Match Engine (`/api/matcher/match/`) to score and rank jobs based on candidate skill compatibility.
6. **Deep Job Analysis**: User opens job detail, clicks "Analyze Job" or uploads a job post screenshot for instant breakdown of required vs preferred skills.
7. **Resume & Email Generation**: User generates a tailored ATS resume draft and cold outreach email to contact hiring manager.
8. **Tracking**: User bookmarks job into "Saved Jobs" tab with application notes.

## 1.7 Success Metrics (KPIs)
* **Active User Retention**: 60%+ 30-day user retention.
* **Match Accuracy Score**: 90%+ user agreement on high match ratings.
* **Time Saved Per Application**: Reduction of application preparation time from 20 minutes down to < 2 minutes.
* **Application Conversion Rate**: 25% increase in recruiter response rate due to personalized outreach.

## 1.8 Competitor Analysis

| Competitor | Strengths | Weaknesses | AI Job Hunter Advantage |
| :--- | :--- | :--- | :--- |
| **Simplify.jobs** | Form auto-fill, browser extension | Limited backend customization, web scraping restrictions | Direct multi-board API scraping & Groq LLM precision |
| **Huntr.co** | Excellent application board UI | No automated AI match scoring or direct CV parsing | Built-in CV parser & dynamic 0-100% LLM match scoring |
| **TealHQ** | Resume builder & job tracker | Expensive subscription, slow AI generation | Ultra-fast Groq LLM inference (<2s) and open API access |
| **LazyApply** | High-volume automated applications | High spam risk, low application quality, high ban rate | Targeted ATS resume tailoring & personalized cold emails |

## 1.9 Unique Selling Points
* **Ultra-Fast AI Inference**: Powered by Groq Llama-3.3 70B & Llama-3.2 Vision models for near-instant responses (<2s).
* **Multi-Portal Scraping Architecture**: Combines corporate job board APIs (Greenhouse, Ashby), remote boards (RemoteOK), and search scrapers (JobSpy).
* **Vision-Based Screenshot Analysis**: Allows users to analyze job posts from images/screenshots directly when text cannot be copied.
* **End-to-End Workflow**: Integrated flow from discovery -> parsing -> matching -> resume tailoring -> cold email -> tracking.

## 1.10 Constraints & Assumptions
* **Groq API Rate Limits**: System must manage API quotas for free/tier LLM requests efficiently.
* **Web Scraping Regulations**: Scrapers must adhere to rate limits and handle site structure changes gracefully.
* **PDF Standard**: CV parser assumes standard text-readable PDF format.
