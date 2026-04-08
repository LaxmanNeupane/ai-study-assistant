# Architecture Sketch

## Goal

Support a narrow, trustworthy v1:

- one student
- one selected course at a time
- multiple supported PDFs inside that course
- structured study notes as the main output
- grounded Q&A as a secondary capability

## Core Boundaries

### Course Workspace

The course workspace is the top-level product boundary. Every upload, processing job, note generation request, and Q&A interaction must be scoped to a single selected course.

### Supported Source Material

Only digitally generated PDFs with selectable text are supported in v1. Unsupported files should fail clearly instead of being processed unreliably.

### Grounding Contract

Notes and Q&A must be generated only from course-scoped source material. If the material does not support an answer or summary detail, the system should return an insufficiency response instead of guessing.

## Proposed Modules

### `packages/domain`

Shared product concepts and contracts.

Suggested responsibilities:

- `Course`
- `CourseId`
- `Document`
- `DocumentId`
- `ProcessingStatus`
- `UnsupportedReason`

### `packages/ingestion`

PDF intake boundary for file validation, text extraction, and normalization.

Suggested interface shape:

- accept a file for a specific course
- determine whether it is supported
- extract normalized text for downstream storage
- return explicit unsupported-file reasons

### `packages/course-store`

Course-scoped storage and retrieval boundary.

Suggested responsibilities:

- persist uploaded document metadata
- persist normalized course content
- retrieve content only within one course

### `packages/notes`

Study-note generation boundary.

Suggested responsibilities:

- accept course-scoped normalized content
- produce structured notes sections
- surface insufficiency when source coverage is weak

### `packages/qa`

Grounded question-answering boundary.

Suggested responsibilities:

- accept a course identifier and user question
- retrieve only course-scoped supporting material
- return a grounded answer or insufficiency result

### `apps/web`

Student-facing application shell.

Suggested v1 screens or routes:

- course list or selector
- course detail view
- course document upload area
- generated notes view
- course Q&A view

## Issue Mapping

- `#2` establishes course scoping in the product shell
- `#3` and `#4` establish supported upload behavior
- `#5` creates normalized processing output
- `#6` makes course-scoped retrieval enforceable
- `#7` and `#8` deliver trustworthy notes
- `#9` and `#10` deliver grounded Q&A
- `#11` hardens the full workflow end to end

## Early Technical Priorities

- Preserve course isolation above all else
- Keep module interfaces simple and testable
- Optimize for honest failure modes over broad support claims
- Build behavior-first tests for each issue slice
