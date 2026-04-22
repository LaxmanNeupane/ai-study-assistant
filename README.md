# AI Study Notes Assistant

AI Study Notes Assistant is a focused study tool for college and university students. The v1 product turns course PDFs into structured study notes and supports grounded Q&A based only on uploaded course materials.

## Product Scope

- Primary user: individual college or university students
- Core workflow: upload course PDFs, process them, generate study notes, ask grounded questions
- Unit of organization: one course workspace containing multiple PDFs
- Supported inputs in v1: digitally generated PDFs with selectable text
- Out of scope in v1: scanned PDFs, OCR-heavy workflows, and heavy diagram or table extraction

## Product Principles

- Notes first: structured study notes are the main job; Q&A is secondary
- Grounded only: answers and notes must use uploaded course material only
- Honest boundaries: if the material is insufficient, the system should say so
- Course isolation: content must never leak across courses

## Planning Artifacts

- PRD: [PRD-ai-study-notes-assistant.md](./PRD-ai-study-notes-assistant.md)
- Architecture sketch: [docs/architecture.md](./docs/architecture.md)
- Issue implementation map: [docs/implementation-plan.md](./docs/implementation-plan.md)

## GitHub Issues

- `#1` PRD: AI Study Notes Assistant v1
- `#2` Course Workspace Skeleton
- `#3` Supported PDF Upload Flow
- `#4` Unsupported File Detection and Messaging
- `#5` Ingestion and Normalization Pipeline
- `#6` Course-Scoped Knowledge Store
- `#7` Initial Structured Notes Generation
- `#8` Notes Trustworthiness and Insufficiency Guardrails
- `#9` Grounded Course Q&A
- `#10` Q&A Insufficient-Evidence Responses
- `#11` End-to-End Study Flow Hardening

## Proposed Repo Shape

The repository is intentionally being started small:

- `apps/web` for the student-facing application
- `packages/domain` for shared course and document models
- `packages/ingestion` for PDF validation, extraction, and normalization interfaces
- `packages/course-store` for course-scoped storage and retrieval interfaces
- `packages/notes` for study-note generation contracts
- `packages/qa` for grounded Q&A contracts
- `tests/e2e` for end-to-end workflow coverage

## Current Status

The repo is in project bootstrap mode. Product direction and issue slicing are defined, and the next implementation step is to build issue `#2` as the first thin vertical slice.

## Final Update- please refer tho the following: 
1. Overview
AI Study Notes Assistant is an end-to-end AI application that processes course PDFs into structured study notes and enables grounded Q&A.

2. Features
- PDF ingestion
- ETL pipeline (processing course material)
- Course-scoped knowledge system
- Study notes generation
- Grounded Q&A
- Trust and insufficiency handling

3. Architecture
PDF → ETL → Structured JSON → Course Knowledge Store → Notes + QA → UI

4. Tech Stack
- Frontend: HTML, JS
- Backend: Node.js
- AI Layer: Grounded Q&A (course-only)
- Testing: Jest + E2E tests
- Deployment: Vercel

5. Required Skills Used
- grill-me → refined scope and user
- write-a-prd → defined system design
- prd-to-issues → created development tasks
- tdd → implemented tests
- improve-codebase-architecture → refactored structure

6. How to Run
npm install
npm test
npm start

7. Demo Link 
https://ai-study-assistant-weld-eight.vercel.app
https://ai-study-assistant-git-main-laxmanneupanes-projects.vercel.app

## Section added for assignment 6
## Architecture Classification

This system is a **retrieval-first architecture (RAG-like)**.

### Why
- Processes PDFs into structured chunks
- Retrieves relevant content before answering
- Uses only course-specific data

### Alternative
A prompt-first approach could send full documents directly to the model, but it would:
- exceed context limits
- be inefficient for multiple PDFs

### Tradeoffs
- Better scalability and performance
- More complex chunking and retrieval

### Not Implemented
Advanced vector-based retrieval was not implemented.  
This could improve semantic matching but adds cost and complexity.
## 🔄 Pipeline and Data Flow

The system follows this pipeline:

PDF → ETL → Chunking → Storage → Retrieval → Notes/Q&A → UI

### Stages:
1. PDF ingestion
2. Text extraction and cleaning
3. Chunking into smaller sections
4. Storing processed content
5. Retrieving relevant chunks
6. Generating notes and answers
7. Displaying results in UI

### Failure Points:
- PDF parsing failure
- Weak chunking
- Retrieval mismatch