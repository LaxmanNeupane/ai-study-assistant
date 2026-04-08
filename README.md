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
