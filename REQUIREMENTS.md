# AIGuidebook - Requirements Specification

## Scope

This document specifies the requirements for the **Logging & Risk Engine** module of the AIGuidebook system. The system is a student-centred web application where students log their AI tool usage against assignments, submit declarations of what tools they used, and the system automatically classifies risk levels and flags discrepancies.

Assignments and students are pre-seeded data. The module covers 8 functional requirements (RE-09 through RE-16) and 2 non-functional requirements (NFR-01, NFR-02), as selected in task 2.1.

## Data Model

- **Students** — pre-seeded (id, name, email, role)
- **Assignments** — pre-seeded (id, title, course)
- **Log entries** — student logs AI usage: tool used (ChatGPT, Copilot, Claude, Other), task type (grammar, summarizing, drafting, coding, direct answers), linked to an assignment, timestamped
- **Declarations** — student declares tools used for an assignment at submission time
- **Risk classifications** — computed per student per assignment: Low, Medium, or High, with discrepancy details
- **Alerts** — created automatically when a classification is High

## Functional Requirements

### RE-09: Log AI Usage

**User story:** As a student, I want to quickly log which AI tool I used and what I used it for, so that my usage is documented.

**Actor:** Student

**Acceptance criteria:**

- **Given** a student is authenticated, **when** they `POST /api/logs` with a tool (e.g. "chatgpt"), one or more task types (e.g. ["grammar", "drafting"]), and an assignment ID, **then** the system creates a log entry and returns it with a generated ID and timestamp.
- **Given** the request is missing required fields (tool, task types, or assignment ID), **when** the endpoint is called, **then** the system returns a 400 validation error.

### RE-10: Validate Assignment on Log Entry

**User story:** As a student, I want my log entries linked to a valid assignment, so that records are accurate.

**Actor:** Student

**Acceptance criteria:**

- **Given** a student submits a log entry with a valid assignment ID, **when** the log is created, **then** the stored entry includes the assignment ID.
- **Given** a student submits a log entry with a non-existent assignment ID, **when** the endpoint is called, **then** the system returns a 404 error indicating the assignment was not found.

### RE-11: Submit Declaration

**User story:** As a student, I want to declare which AI tools I used for an assignment when I'm done, so that my usage is transparent.

**Actor:** Student

**Acceptance criteria:**

- **Given** a student is authenticated, **when** they `POST /api/declarations` with an assignment ID and a list of declared tools, **then** the system stores the declaration and returns it with a generated ID and timestamp.
- **Given** a declaration already exists for that student and assignment, **when** a new declaration is submitted, **then** the system returns a 409 conflict error.
- **Given** the declaration is successfully created, **when** it is stored, **then** a risk classification is automatically triggered (see RE-15).

### RE-12: View Usage History

**User story:** As a student, I want to view my AI usage logs so I can reflect on how much I rely on AI.

**Actor:** Student

**Acceptance criteria:**

- **Given** a student has log entries, **when** they `GET /api/logs`, **then** the system returns their log entries ordered by timestamp (most recent first).
- **Given** a student provides a query parameter `assignment_id`, **when** the request is made, **then** only log entries for that assignment are returned.
- **Given** a student provides query parameters `from` and `to` (ISO date strings), **when** the request is made, **then** only log entries within that date range are returned.
- **Given** a student has no log entries, **when** the request is made, **then** the system returns an empty array.

### RE-13: Risk Classification

**User story:** As an administrator, I want the system to classify a student's AI usage as Low, Medium, or High risk based on task types, frequency, and declaration discrepancies.

**Actor:** System (triggered automatically)

**Acceptance criteria:**

- **Given** a student has only used AI for minor tasks (grammar, summarizing) with low frequency, **when** risk is classified, **then** the result is "low".
- **Given** a student has frequent AI usage for substantial tasks (drafting, coding) across multiple assignments, **when** risk is classified, **then** the result is "medium".
- **Given** a student has used AI for direct answer generation on assignments, or there are discrepancies between their logs and declaration, **when** risk is classified, **then** the result is "high".

### RE-14: Declaration vs. Log Comparison

**User story:** As an administrator, I want the system to detect when a student's declaration doesn't match their logged usage.

**Actor:** System (triggered automatically)

**Acceptance criteria:**

- **Given** a student logged usage of "chatgpt" but did not declare it, **when** the comparison runs, **then** the result includes "chatgpt" as an undeclared tool.
- **Given** a student declared "copilot" but never logged using it, **when** the comparison runs, **then** the result includes "copilot" as declared but not logged.
- **Given** the declaration matches the logs exactly, **when** the comparison runs, **then** the result indicates no discrepancies.

### RE-15: Auto-Classify on Declaration Submit

**User story:** As an administrator, I want risk classification to happen automatically when a student submits their declaration.

**Actor:** System

**Acceptance criteria:**

- **Given** a student submits a declaration via `POST /api/declarations`, **when** the declaration is stored, **then** the system automatically runs risk classification (RE-13) and declaration comparison (RE-14) for that student and assignment.
- **Given** the classification completes, **when** the result is stored, **then** it includes the risk level, student ID, assignment ID, discrepancy details, and timestamp.
- **Given** an administrator calls `GET /api/classifications`, **then** the system returns all stored classifications.

### RE-16: Alerts for High Risk

**User story:** As an administrator, I want to be notified when a student is classified as high risk so I can follow up.

**Actor:** System

**Acceptance criteria:**

- **Given** a risk classification results in "high", **when** the classification is stored, **then** the system creates an alert record.
- **Given** a risk classification results in "low" or "medium", **when** the classification is stored, **then** no alert is created.
- **Given** an administrator calls `GET /api/alerts`, **then** the system returns all alerts with student ID, assignment ID, risk level, and timestamp.

## Non-Functional Requirements

### NFR-01: Logging Responsiveness

**User story:** As a student, I want logging to feel instant so it doesn't interrupt my workflow.

**Acceptance criteria:**

- **Given** a student submits a log entry via `POST /api/logs`, **when** the request is processed, **then** the server responds within 2000 milliseconds.

### NFR-02: API Response Time

**User story:** As a user, I want the system to respond quickly to any request.

**Acceptance criteria:**

- **Given** any API request is made to the system, **when** the request is processed, **then** the server responds within 30 seconds.

## Dependency & Implementation Order

1. **NFR-01, NFR-02** — Performance constraints shape API design.
2. **RE-09** — Core logging. Everything depends on this.
3. **RE-10** — Assignment validation. Refines RE-09.
4. **RE-11** — Declarations. Depends on assignments existing.
5. **RE-12** — Usage history. Reads log data from RE-09/RE-10.
6. **RE-13** — Risk classification logic. Consumes log data.
7. **RE-14** — Declaration vs. log comparison. Needs both logs and declarations.
8. **RE-15** — Auto-trigger on submit. Wires RE-13 + RE-14 into RE-11.
9. **RE-16** — Alerts. Depends on RE-15 producing classifications.

## Sources

- [Task 1.1 - Requirements Elicitation](tasks/1.1-requirements-elicitation.md) — Original requirements and interviews
- [Task 1.2 - Requirements Overview](tasks/1.2-requirements-overview.md) — Peer review
- [Task 1.3 - Dependency Analysis](tasks/1.3-requirement-dependency-analysis-and-categorization.md) — Dependency graph
- [Task 2.1 - Prompting Strategy](tasks/2.1-prompting-strategy.md) — Selected scope and prompting strategy
- [Task 2.2 - Code Generation](tasks/2.2-code-generation.md) — Code generation task description
- [Project Overview](tasks/overview.md) — Project and course description
