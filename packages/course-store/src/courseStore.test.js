import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCourseKnowledgeEntries,
  chunkNormalizedText,
  retrieveCourseKnowledge
} from "./courseStore.js";

test("chunkNormalizedText groups processed text into retrieval-sized sections", () => {
  const chunks = chunkNormalizedText(
    "Line 1\nLine 2\nLine 3\nLine 4\nLine 5",
    2
  );

  assert.deepEqual(chunks, [
    "Line 1\nLine 2",
    "Line 3\nLine 4",
    "Line 5"
  ]);
});

test("buildCourseKnowledgeEntries only indexes processed documents", () => {
  const entries = buildCourseKnowledgeEntries([
    {
      id: "doc-1",
      name: "lecture-01.pdf",
      status: "processed",
      normalizedText: "Cell theory\nMitochondria"
    },
    {
      id: "doc-2",
      name: "diagram-handout.pdf",
      status: "unsupported",
      normalizedText: "Should not appear"
    },
    {
      id: "doc-3",
      name: "scan.pdf",
      status: "failed",
      normalizedText: ""
    }
  ]);

  assert.equal(entries.length, 1);
  assert.equal(entries[0].documentId, "doc-1");
});

test("retrieveCourseKnowledge returns the highest matching chunks", () => {
  const entries = buildCourseKnowledgeEntries([
    {
      id: "doc-1",
      name: "memory.pdf",
      status: "processed",
      normalizedText:
        "Encoding specificity principle\nRetrieval cues improve recall\nWorking memory model"
    },
    {
      id: "doc-2",
      name: "perception.pdf",
      status: "processed",
      normalizedText:
        "Bottom-up processing\nTop-down processing\nPerceptual set"
    }
  ]);

  const results = retrieveCourseKnowledge(entries, "retrieval cues memory", 2);

  assert.equal(results.length, 1);
  assert.equal(results[0].documentName, "memory.pdf");
  assert.match(results[0].content, /Retrieval cues improve recall/);
});

test("retrieveCourseKnowledge returns an empty list for blank queries", () => {
  const entries = buildCourseKnowledgeEntries([
    {
      id: "doc-1",
      name: "lecture.pdf",
      status: "processed",
      normalizedText: "Atoms\nMolecules"
    }
  ]);

  assert.deepEqual(retrieveCourseKnowledge(entries, "   "), []);
});
