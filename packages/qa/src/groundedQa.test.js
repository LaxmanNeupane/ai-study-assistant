import test from "node:test";
import assert from "node:assert/strict";

import { buildCourseKnowledgeEntries } from "../../course-store/src/courseStore.js";
import { answerCourseQuestion } from "./groundedQa.js";

test("answerCourseQuestion returns a grounded answer with citations", () => {
  const knowledgeEntries = buildCourseKnowledgeEntries([
    {
      id: "doc-1",
      name: "memory.pdf",
      status: "processed",
      normalizedText:
        "Encoding specificity principle\nRetrieval cues improve recall\nContext-dependent memory"
    }
  ]);

  const answer = answerCourseQuestion(
    knowledgeEntries,
    "What improves recall?"
  );

  assert.equal(answer.status, "grounded");
  assert.match(answer.answer, /Retrieval cues improve recall/i);
  assert.equal(answer.citations.length, 1);
  assert.equal(answer.citations[0].documentName, "memory.pdf");
});

test("answerCourseQuestion reports insufficiency when no course support is found", () => {
  const knowledgeEntries = buildCourseKnowledgeEntries([
    {
      id: "doc-1",
      name: "biology.pdf",
      status: "processed",
      normalizedText: "Mitochondria produce ATP\nCell membranes regulate transport"
    }
  ]);

  const answer = answerCourseQuestion(
    knowledgeEntries,
    "What is operant conditioning?"
  );

  assert.equal(answer.status, "insufficient");
  assert.equal(answer.reason, "no_matching_support");
  assert.match(answer.answer, /could not find enough support/i);
  assert.match(answer.guidance ?? "", /exact terms|closest indexed topics/i);
  assert.equal(answer.citations.length, 0);
});

test("answerCourseQuestion explains when no processed course content exists", () => {
  const answer = answerCourseQuestion([], "What is ATP?");

  assert.equal(answer.status, "insufficient");
  assert.equal(answer.reason, "no_course_content");
  assert.match(answer.answer, /does not have enough processed material/i);
  assert.match(answer.guidance ?? "", /upload supported PDFs/i);
});
