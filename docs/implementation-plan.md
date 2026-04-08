# Implementation Plan

## Recommended Build Order

1. `#2` Course Workspace Skeleton
2. `#3` Supported PDF Upload Flow
3. `#4` Unsupported File Detection and Messaging
4. `#5` Ingestion and Normalization Pipeline
5. `#6` Course-Scoped Knowledge Store
6. `#7` Initial Structured Notes Generation
7. `#8` Notes Trustworthiness and Insufficiency Guardrails
8. `#9` Grounded Course Q&A
9. `#10` Q&A Insufficient-Evidence Responses
10. `#11` End-to-End Study Flow Hardening

## Thin Slice Intent

Each issue should stay vertical and demoable:

- user-visible behavior
- minimal storage or processing needed for that behavior
- automated tests proving the behavior

Avoid starting with horizontal infrastructure-only tasks that do not produce a visible product increment.

## First Slice Definition

Issue `#2` should prove the course boundary exists before the rest of the system is built.

Definition of done:

- a student can create a course workspace
- a student can select a course workspace
- the app clearly shows which course is active
- later features have an obvious place to plug into that selection state

## Suggested Milestones

### Milestone 1: Course and Upload Foundation

- `#2`
- `#3`
- `#4`

### Milestone 2: Processing and Retrieval Foundation

- `#5`
- `#6`

### Milestone 3: Core Product Value

- `#7`
- `#8`

### Milestone 4: Secondary Study Interaction

- `#9`
- `#10`

### Milestone 5: Release Hardening

- `#11`
