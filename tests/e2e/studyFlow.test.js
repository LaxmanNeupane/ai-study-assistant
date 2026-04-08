import test from "node:test";
import assert from "node:assert/strict";

import {
  addCourseWorkspace,
  addDocumentsToCourseWorkspace,
  applyDocumentProcessingResult,
  createCourseWorkspaceState,
  getCourseKnowledgeSourceDocuments,
  getActiveCourseWorkspace
} from "../../packages/domain/src/courseWorkspace.js";
import { ingestPdfDocument } from "../../packages/ingestion/src/pdfIngestion.js";
import {
  buildCourseKnowledgeEntries,
  retrieveCourseKnowledge
} from "../../packages/course-store/src/courseStore.js";
import { generateStudyNotes } from "../../packages/notes/src/studyNotes.js";
import { answerCourseQuestion } from "../../packages/qa/src/groundedQa.js";

const createPdfFile = (name, text) => ({
  name,
  type: "application/pdf",
  size: text.length,
  async arrayBuffer() {
    return new TextEncoder().encode(text).buffer;
  }
});

test("student can complete the core study flow within one course", async () => {
  let state = createCourseWorkspaceState();

  const addedCourse = addCourseWorkspace(
    state,
    { name: "Cognitive Psychology", code: "PSYC 230" },
    {
      createId: "course-psyc-230",
      createdAt: "2026-04-07T21:00:00.000Z"
    }
  );

  state = addedCourse.state;

  const supportedPdf = createPdfFile(
    "memory-lecture.pdf",
    `
      BT
        (Encoding specificity principle) Tj
        (Retrieval cues improve recall) Tj
        (Context-dependent memory influences exam performance) Tj
      ET
    `
  );

  const upload = addDocumentsToCourseWorkspace(
    state,
    "course-psyc-230",
    [supportedPdf],
    {
      createDocumentId: () => "doc-memory-1",
      uploadedAt: "2026-04-07T21:05:00.000Z"
    }
  );

  state = upload.state;

  const processingResult = await ingestPdfDocument(supportedPdf);
  state = applyDocumentProcessingResult(
    state,
    "course-psyc-230",
    "doc-memory-1",
    processingResult
  );

  const knowledgeEntries = buildCourseKnowledgeEntries(
    getCourseKnowledgeSourceDocuments(state, "course-psyc-230")
  );
  const retrieval = retrieveCourseKnowledge(knowledgeEntries, "retrieval cues recall");
  const notes = generateStudyNotes(knowledgeEntries);
  const qa = answerCourseQuestion(knowledgeEntries, "What improves recall?");

  assert.equal(getActiveCourseWorkspace(state)?.id, "course-psyc-230");
  assert.equal(processingResult.status, "processed");
  assert.ok(knowledgeEntries.length > 0);
  assert.match(retrieval[0]?.content ?? "", /Retrieval cues improve recall/i);
  assert.ok(notes.sections.length > 0);
  assert.match(notes.summary, /Encoding specificity principle/i);
  assert.equal(qa.status, "grounded");
  assert.match(qa.answer, /Retrieval cues improve recall/i);
});

test("unsupported and insufficient paths remain intact during the workflow", async () => {
  let state = createCourseWorkspaceState();

  state = addCourseWorkspace(
    state,
    { name: "Biology", code: "BIO 101" },
    {
      createId: "course-bio-101",
      createdAt: "2026-04-07T21:00:00.000Z"
    }
  ).state;

  const scannedLikePdf = createPdfFile(
    "scanned-review.pdf",
    "%PDF-1.4\n<< /Type /Page >>"
  );

  const upload = addDocumentsToCourseWorkspace(
    state,
    "course-bio-101",
    [scannedLikePdf],
    {
      createDocumentId: () => "doc-scan-1",
      uploadedAt: "2026-04-07T21:08:00.000Z"
    }
  );

  state = upload.state;

  assert.equal(upload.rejectedDocuments.length, 1);

  const knowledgeEntries = buildCourseKnowledgeEntries(
    getCourseKnowledgeSourceDocuments(state, "course-bio-101")
  );
  const notes = generateStudyNotes(knowledgeEntries);
  const qa = answerCourseQuestion(knowledgeEntries, "What is ATP?");

  assert.equal(knowledgeEntries.length, 0);
  assert.match(notes.warnings[0], /insufficient course material/i);
  assert.equal(qa.status, "insufficient");
  assert.equal(qa.reason, "no_course_content");
});
