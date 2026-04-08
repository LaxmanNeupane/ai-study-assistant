const normalizeSearchText = (value) =>
  value
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value) =>
  normalizeSearchText(value)
    .split(" ")
    .filter(Boolean);

export const chunkNormalizedText = (normalizedText, maxLines = 6) => {
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const chunks = [];

  for (let index = 0; index < lines.length; index += maxLines) {
    chunks.push(lines.slice(index, index + maxLines).join("\n"));
  }

  return chunks;
};

export const buildCourseKnowledgeEntries = (documents, options = {}) => {
  const maxLinesPerChunk = options.maxLinesPerChunk ?? 6;

  return (documents ?? [])
    .filter((document) => document.status === "processed" && document.normalizedText)
    .flatMap((document) =>
      chunkNormalizedText(document.normalizedText, maxLinesPerChunk).map(
        (content, index) => ({
          id: `${document.id}:chunk:${index + 1}`,
          documentId: document.id,
          documentName: document.name,
          chunkIndex: index,
          content,
          searchText: normalizeSearchText(content)
        })
      )
    );
};

export const retrieveCourseKnowledge = (knowledgeEntries, query, limit = 5) => {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  return [...(knowledgeEntries ?? [])]
    .map((entry) => {
      const score = queryTokens.reduce((total, token) => {
        if (!entry.searchText.includes(token)) {
          return total;
        }

        const occurrences = entry.searchText.split(token).length - 1;
        return total + occurrences;
      }, 0);

      return {
        ...entry,
        score
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.chunkIndex - right.chunkIndex)
    .slice(0, limit);
};
