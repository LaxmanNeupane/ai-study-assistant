import test from "node:test";
import assert from "node:assert/strict";

import {
  applyDocumentProcessingResult,
  addDocumentsToCourseWorkspace,
  addCourseWorkspace,
  createCourseWorkspaceState,
  getCourseWorkspaceDocuments,
  getActiveCourseWorkspace,
  selectCourseWorkspace
} from "./courseWorkspace.js";

test("adding the first course makes it active", () => {
  const initialState = createCourseWorkspaceState();

  const { state, course } = addCourseWorkspace(
    initialState,
    { name: "Introduction to Biology", code: "bio 101" },
    {
      createId: "course-bio-101",
      createdAt: "2026-04-07T20:00:00.000Z"
    }
  );

  assert.equal(state.courses.length, 1);
  assert.equal(state.activeCourseId, "course-bio-101");
  assert.equal(course.code, "BIO 101");
  assert.deepEqual(getActiveCourseWorkspace(state), course);
});

test("adding another course keeps the existing active course until the student changes it", () => {
  const seededState = createCourseWorkspaceState(
    [
      {
        id: "course-math-201",
        name: "Calculus II",
        code: "MATH 201",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: []
      }
    ],
    "course-math-201"
  );

  const { state } = addCourseWorkspace(
    seededState,
    { name: "Computer Networks", code: "cs 330" },
    {
      createId: "course-cs-330",
      createdAt: "2026-04-07T20:05:00.000Z"
    }
  );

  assert.equal(state.courses.length, 2);
  assert.equal(state.activeCourseId, "course-math-201");
});

test("students can change the active course explicitly", () => {
  const state = createCourseWorkspaceState(
    [
      {
        id: "course-chem-101",
        name: "General Chemistry",
        code: "CHEM 101",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: []
      },
      {
        id: "course-phys-101",
        name: "Physics I",
        code: "PHYS 101",
        createdAt: "2026-04-07T20:03:00.000Z",
        documents: []
      }
    ],
    "course-chem-101"
  );

  const nextState = selectCourseWorkspace(state, "course-phys-101");

  assert.equal(nextState.activeCourseId, "course-phys-101");
  assert.equal(getActiveCourseWorkspace(nextState)?.name, "Physics I");
});

test("blank course names are rejected", () => {
  const initialState = createCourseWorkspaceState();

  assert.throws(
    () => addCourseWorkspace(initialState, { name: "   " }),
    /Course name is required/
  );
});

test("selecting a missing course fails clearly", () => {
  const state = createCourseWorkspaceState();

  assert.throws(
    () => selectCourseWorkspace(state, "missing-course"),
    /Course not found/
  );
});

test("students can attach multiple pdf documents to the selected course", () => {
  const state = createCourseWorkspaceState(
    [
      {
        id: "course-psych-101",
        name: "Introduction to Psychology",
        code: "PSYC 101",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: []
      }
    ],
    "course-psych-101"
  );

  const result = addDocumentsToCourseWorkspace(
    state,
    "course-psych-101",
    [
      { name: "lecture-01.pdf", type: "application/pdf", size: 1024 },
      { name: "chapter-02.pdf", type: "application/pdf", size: 2048 }
    ],
    {
      createDocumentId: (_, index) => `doc-${index + 1}`,
      uploadedAt: "2026-04-07T20:10:00.000Z"
    }
  );

  assert.equal(result.documents.length, 2);
  assert.equal(result.acceptedDocuments.length, 2);
  assert.equal(result.rejectedDocuments.length, 0);
  assert.equal(
    getCourseWorkspaceDocuments(result.state, "course-psych-101").length,
    2
  );
  assert.equal(result.documents[0].status, "uploaded");
});

test("document uploads stay isolated to one course workspace", () => {
  const state = createCourseWorkspaceState(
    [
      {
        id: "course-econ-101",
        name: "Microeconomics",
        code: "ECON 101",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: []
      },
      {
        id: "course-hist-210",
        name: "Modern History",
        code: "HIST 210",
        createdAt: "2026-04-07T20:02:00.000Z",
        documents: []
      }
    ],
    "course-econ-101"
  );

  const result = addDocumentsToCourseWorkspace(
    state,
    "course-hist-210",
    [{ name: "week-03.pdf", type: "application/pdf", size: 900 }],
    {
      createDocumentId: () => "doc-history-1",
      uploadedAt: "2026-04-07T20:12:00.000Z"
    }
  );

  assert.equal(
    getCourseWorkspaceDocuments(result.state, "course-econ-101").length,
    0
  );
  assert.equal(
    getCourseWorkspaceDocuments(result.state, "course-hist-210").length,
    1
  );
});

test("uploading without any files fails clearly", () => {
  const state = createCourseWorkspaceState(
    [
      {
        id: "course-stat-200",
        name: "Applied Statistics",
        code: "STAT 200",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: []
      }
    ],
    "course-stat-200"
  );

  assert.throws(
    () => addDocumentsToCourseWorkspace(state, "course-stat-200", []),
    /Select at least one PDF/
  );
});

test("unsupported non-pdf uploads are preserved with an explicit reason", () => {
  const state = createCourseWorkspaceState(
    [
      {
        id: "course-phil-110",
        name: "Ethics",
        code: "PHIL 110",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: []
      }
    ],
    "course-phil-110"
  );

  const result = addDocumentsToCourseWorkspace(state, "course-phil-110", [
    {
      name: "notes.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 800
    }
  ]);

  assert.equal(result.acceptedDocuments.length, 0);
  assert.equal(result.rejectedDocuments.length, 1);
  assert.match(
    result.rejectedDocuments[0].unsupportedReason?.message ?? "",
    /only PDF files can be uploaded/i
  );
});

test("likely scanned pdfs are flagged as unsupported in v1", () => {
  const state = createCourseWorkspaceState(
    [
      {
        id: "course-art-150",
        name: "Art History",
        code: "ART 150",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: []
      }
    ],
    "course-art-150"
  );

  const result = addDocumentsToCourseWorkspace(state, "course-art-150", [
    {
      name: "scanned-midterm-review.pdf",
      type: "application/pdf",
      size: 4096
    }
  ]);

  assert.equal(result.acceptedDocuments.length, 0);
  assert.equal(result.rejectedDocuments.length, 1);
  assert.equal(result.rejectedDocuments[0].status, "unsupported");
  assert.match(
    result.rejectedDocuments[0].unsupportedReason?.message ?? "",
    /scanned or image-based PDFs/i
  );
});

test("mixed uploads keep supported pdfs while flagging unsupported ones", () => {
  const state = createCourseWorkspaceState(
    [
      {
        id: "course-bus-101",
        name: "Business Fundamentals",
        code: "BUS 101",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: []
      }
    ],
    "course-bus-101"
  );

  const result = addDocumentsToCourseWorkspace(state, "course-bus-101", [
    { name: "lecture-03.pdf", type: "application/pdf", size: 2048 },
    { name: "diagram-heavy-review.pdf", type: "application/pdf", size: 3072 },
    { name: "draft-notes.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
  ]);

  assert.equal(result.acceptedDocuments.length, 1);
  assert.equal(result.rejectedDocuments.length, 2);
  assert.equal(
    getCourseWorkspaceDocuments(result.state, "course-bus-101").length,
    3
  );
});

test("processed document results are stored on the correct course document", () => {
  const state = createCourseWorkspaceState(
    [
      {
        id: "course-chem-210",
        name: "Organic Chemistry",
        code: "CHEM 210",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: [
          {
            id: "doc-1",
            name: "lecture-05.pdf",
            type: "application/pdf",
            sizeInBytes: 2048,
            uploadedAt: "2026-04-07T20:05:00.000Z",
            status: "uploaded",
            unsupportedReason: null,
            normalizedText: "",
            excerpt: "",
            processingError: null
          }
        ]
      }
    ],
    "course-chem-210"
  );

  const nextState = applyDocumentProcessingResult(
    state,
    "course-chem-210",
    "doc-1",
    {
      status: "processed",
      normalizedText: "Alkanes\nSubstitution reactions",
      excerpt: "Alkanes\nSubstitution reactions",
      errorMessage: null
    }
  );

  const document = getCourseWorkspaceDocuments(nextState, "course-chem-210")[0];

  assert.equal(document.status, "processed");
  assert.match(document.normalizedText, /Alkanes/);
  assert.equal(document.processingError, null);
});

test("failed processing results are also stored on the correct document", () => {
  const state = createCourseWorkspaceState(
    [
      {
        id: "course-geo-101",
        name: "Geography",
        code: "GEOG 101",
        createdAt: "2026-04-07T20:00:00.000Z",
        documents: [
          {
            id: "doc-1",
            name: "map-scan.pdf",
            type: "application/pdf",
            sizeInBytes: 4096,
            uploadedAt: "2026-04-07T20:05:00.000Z",
            status: "uploaded",
            unsupportedReason: null,
            normalizedText: "",
            excerpt: "",
            processingError: null
          }
        ]
      }
    ],
    "course-geo-101"
  );

  const nextState = applyDocumentProcessingResult(
    state,
    "course-geo-101",
    "doc-1",
    {
      status: "failed",
      normalizedText: "",
      excerpt: "",
      errorMessage: "The PDF could not be processed into selectable text."
    }
  );

  const document = getCourseWorkspaceDocuments(nextState, "course-geo-101")[0];

  assert.equal(document.status, "failed");
  assert.match(document.processingError ?? "", /could not be processed/i);
});
