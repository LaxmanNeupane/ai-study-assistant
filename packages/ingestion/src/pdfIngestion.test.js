import test from "node:test";
import assert from "node:assert/strict";

import {
  extractPdfText,
  ingestPdfDocument,
  normalizeExtractedText
} from "./pdfIngestion.js";

test("normalizeExtractedText collapses noisy whitespace into study-ready lines", () => {
  const normalized = normalizeExtractedText("  Cell   theory \n\n explains \t life  ");

  assert.equal(normalized, "Cell theory\nexplains life");
});

test("extractPdfText pulls text from simple PDF text operators", () => {
  const pdfSource = `
    BT
      (Introduction to Biology) Tj
      (Cell Structure) Tj
    ET
  `;

  assert.equal(
    extractPdfText(pdfSource),
    "Introduction to Biology\nCell Structure"
  );
});

test("extractPdfText combines text found inside TJ arrays", () => {
  const pdfSource = `
    BT
      [(Week 1) 120 (Review)] TJ
    ET
  `;

  assert.equal(extractPdfText(pdfSource), "Week 1\nReview");
});

test("ingestPdfDocument returns processed normalized content for text PDFs", async () => {
  const file = {
    async arrayBuffer() {
      const source = `
        BT
          (Chapter 2: Memory) Tj
          (Encoding and retrieval cues) Tj
        ET
      `;

      return new TextEncoder().encode(source).buffer;
    }
  };

  const result = await ingestPdfDocument(file);

  assert.equal(result.status, "processed");
  assert.match(result.normalizedText, /Chapter 2: Memory/);
  assert.match(result.excerpt, /Encoding and retrieval cues/);
});

test("ingestPdfDocument returns a clear failure when no text is extractable", async () => {
  const file = {
    async arrayBuffer() {
      return new TextEncoder().encode("%PDF-1.4\n<< /Type /Page >>").buffer;
    }
  };

  const result = await ingestPdfDocument(file);

  assert.equal(result.status, "failed");
  assert.match(result.errorMessage ?? "", /could not be processed/i);
});
