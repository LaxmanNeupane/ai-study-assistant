import { retrieveCourseKnowledge } from "../../course-store/src/courseStore.js";

const buildAnswerText = (results) => {
  const lines = results
    .flatMap((result) =>
      result.content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
    )
    .slice(0, 4);

  return lines.join(" ");
};

export const answerCourseQuestion = (knowledgeEntries, question, options = {}) => {
  const limit = options.limit ?? 3;
  const results = retrieveCourseKnowledge(knowledgeEntries, question, limit);

  if ((knowledgeEntries ?? []).length === 0) {
    return {
      status: "insufficient",
      reason: "no_course_content",
      answer:
        "I could not answer because the active course does not have enough processed material yet.",
      guidance:
        "Upload supported PDFs and finish processing them before asking grounded questions.",
      citations: []
    };
  }

  if (results.length === 0) {
    return {
      status: "insufficient",
      reason: "no_matching_support",
      answer:
        "I could not find enough support for that question in the active course materials.",
      guidance:
        "Try using the exact terms from your lecture slides or review the course knowledge panel for the closest indexed topics.",
      citations: []
    };
  }

  return {
    status: "grounded",
    reason: null,
    answer: buildAnswerText(results),
    guidance: null,
    citations: results.map((result) => ({
      documentName: result.documentName,
      chunkIndex: result.chunkIndex,
      content: result.content
    }))
  };
};
