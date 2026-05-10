# Context & Handoff: Duke Capstone Platform (Phase 2)

## 📌 Background
We are building a comprehensive capstone management system. We just wrapped up "Phase 1: Pre-Semester Matching" and are now transitioning to conceptualize and build "Phase 2: Capstone Ops & Communication Platform."

## 🏗 Current Architecture & Tech Stack (Phase 1)
* **Frontend:** React + Vite, TailwindCSS, Playwright for testing.
* **Backend:** FastAPI (Python), SQLAlchemy ORM, Alembic for migrations.
* **Database:** PostgreSQL.
* **Infrastructure/Integrations:** AWS SES (for email notifications), Clerk / Magic Links (for Auth).
* **Key Completed Features:** 
  * Project catalog management and viewing.
  * Role-Based Access Control (Admin, Faculty, Student, Client). Faculty and Admins share backend admin UI capabilities.
  * Capturing student teammate preferences with privacy controls: preferences are hidden from developers using server-side deterministic hashing (gibberish syllable generation like "Babebo Dadidu"), while Faculty can unmask and read the real data.
  * Automated AWS SES emails sent to all Faculty when students submit project-related questions.

## 🚀 The Goal: Phase 2 (Ops & Comms Platform)
We are building a decoupled Operations application that takes over *after* the Phase 1 matching algorithm assigns students to projects. 
* **Database strategy:** It will share the exact same PostgreSQL database but focus on highly operational tables rather than matching tables.
* **Primary Users:** 
  * **Students:** Submit milestone deliverables and message sponsors.
  * **Faculty/Admins:** Track team progress, grade deliverables, send broadcast announcements.
  * **Clients (Sponsors):** Review team milestones and provide standard feedback.

## 📋 Recommended Next Steps (Action Plan)
1. **Schema Design:** Draft the SQLAlchemy models for Phase 2 entities. We need tables for `teams` (linking students to finalized projects), `milestones`, `tasks/deliverables`, and `client_feedback`.
2. **Backend Scaffolding:** Create new FastAPI routers (e.g., `routers/ops.py` or separate bounded contexts for milestones and teams) utilizing the existing RBAC dependencies.
3. **Frontend UI Scaffolding:** Draft the React component architecture for the Ops Dashboard, which will need tailored views for Students, Faculty, and Clients.
4. **Notification Triggers:** Expand the AWS SES background tasks to handle Phase 2 events (e.g., "Sponsor left feedback," "Milestone deadline approaching").

**Action for the LLM:** Please review this context. I would like to begin with **Step 1: Schema Design**. Based on this description, can you propose the SQLAlchemy models and table relationships needed to support the Phase 2 Operations platform? Let's assume the `users` and `projects` tables already exist.