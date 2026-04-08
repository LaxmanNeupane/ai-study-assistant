import test from "node:test";
import assert from "node:assert/strict";

import { generateStudyNotes } from "./studyNotes.js";

test("generateStudyNotes returns structured sections from course knowledge entries", () => {
  const notes = generateStudyNotes([
    {
      id: "doc-1:chunk:1",
      documentName: "memory.pdf",
      content:
        "Encoding specificity principle\nRetrieval cues improve recall\nContext-dependent memory"
    },
    {
      id: "doc-2:chunk:1",
      documentName: "neuroscience.pdf",
      content:
        "Neuron structure includes dendrites and axons\nSynaptic transmission depends on neurotransmitters"
    }
  ]);

  assert.equal(notes.title, "Structured Study Notes");
  assert.equal(notes.sections.length, 2);
  assert.match(notes.sections[0].heading, /Encoding|Retrieval|Memory|Context/i);
  assert.equal(notes.sections[0].sourceDocumentName, "memory.pdf");
  assert.ok(notes.sections[0].bullets.length > 0);
  assert.match(notes.summary, /Encoding specificity principle/i);
});

test("generateStudyNotes returns an empty structure when no knowledge is available", () => {
  const notes = generateStudyNotes([]);

  assert.equal(notes.sections.length, 0);
  assert.equal(notes.summary, "");
  assert.match(notes.warnings[0], /insufficient course material/i);
});

test("generateStudyNotes flags thin and repetitive material with warnings", () => {
  const notes = generateStudyNotes([
    {
      id: "doc-1:chunk:1",
      documentName: "slides.pdf",
      content:
        "Exam review\nExam review\nExam review"
    }
  ]);

  assert.equal(notes.sections.length, 1);
  assert.ok(notes.warnings.length > 0);
  assert.match(notes.warnings.join(" "), /thin course coverage/i);
  assert.match(notes.sections[0].warnings.join(" "), /repetitive source material/i);
  assert.match(
    notes.sections[0].warnings.join(" "),
    /limited source detail/i
  );
});
