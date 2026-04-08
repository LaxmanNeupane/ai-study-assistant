const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "with"
]);

const normalizeWord = (value) =>
  value
    .toLowerCase()
    .replace(/[^\w]/g, "")
    .trim();

const scoreSectionTitle = (content) => {
  const words = content
    .split(/\s+/)
    .map((word) => normalizeWord(word))
    .filter((word) => word && !stopWords.has(word) && word.length > 2);

  const frequencies = new Map();

  words.forEach((word) => {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  });

  const topWords = [...frequencies.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));

  if (topWords.length === 0) {
    return "Course Concepts";
  }

  return topWords.join(" / ");
};

const uniqueLines = (content) => {
  const seen = new Set();

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      const key = line.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

const normalizeLineKey = (value) => value.trim().toLowerCase();

const detectSectionWarnings = (entry, bullets) => {
  const warnings = [];
  const rawLines = entry.content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const uniqueCount = new Set(rawLines.map((line) => normalizeLineKey(line))).size;

  if (bullets.length < 2) {
    warnings.push(
      "Limited source detail: this section is based on very little extractable material."
    );
  }

  if (rawLines.length > 0 && uniqueCount / rawLines.length < 0.6) {
    warnings.push(
      "Repetitive source material: review the original PDF for fuller context."
    );
  }

  return warnings;
};

export const generateStudyNotes = (knowledgeEntries, options = {}) => {
  const maxSections = options.maxSections ?? 4;
  const maxBulletsPerSection = options.maxBulletsPerSection ?? 4;

  const usableEntries = (knowledgeEntries ?? []).slice(0, maxSections);

  if (usableEntries.length === 0) {
    return {
      title: "Study Notes",
      sections: [],
      summary: "",
      warnings: [
        "Insufficient course material: no processed course content is available to generate notes."
      ]
    };
  }

  const sections = usableEntries.map((entry) => {
    const bullets = uniqueLines(entry.content).slice(0, maxBulletsPerSection);
    const warnings = detectSectionWarnings(entry, bullets);

    return {
      id: entry.id,
      heading: scoreSectionTitle(entry.content),
      sourceDocumentName: entry.documentName,
      bullets,
      warnings
    };
  });

  const summary = sections
    .map((section) => `${section.heading}: ${section.bullets[0] ?? "Key points extracted."}`)
    .join(" ");

  const warnings = [];
  const sectionsWithWarnings = sections.filter((section) => section.warnings.length > 0);

  if (sections.length < 2) {
    warnings.push(
      "Thin course coverage: notes were generated from a very small amount of course material."
    );
  }

  if (sectionsWithWarnings.length > 0) {
    warnings.push(
      "Some note sections have limited or repetitive source support. Review the original PDFs for confirmation."
    );
  }

  return {
    title: "Structured Study Notes",
    sections,
    summary,
    warnings
  };
};
