const collapseWhitespace = (value) => value.replace(/\s+/g, " ").trim();

const decodePdfEscapes = (value) =>
  value
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\\\/g, "\\");

export const normalizeExtractedText = (rawText) =>
  rawText
    .split(/\r?\n/)
    .map((line) => collapseWhitespace(line))
    .filter(Boolean)
    .join("\n");

export const extractPdfText = (pdfSource) => {
  const textMatches = [];
  const literalPattern = /\((?:\\.|[^\\()])*\)\s*T[Jj]/g;
  const arrayPattern = /\[(.*?)\]\s*TJ/gs;

  for (const match of pdfSource.matchAll(literalPattern)) {
    const literal = match[0].replace(/\)\s*T[Jj]$/, "").slice(1);
    textMatches.push(decodePdfEscapes(literal));
  }

  for (const match of pdfSource.matchAll(arrayPattern)) {
    const nestedLiterals = match[1].match(/\((?:\\.|[^\\()])*\)/g) ?? [];
    nestedLiterals.forEach((literal) => {
      textMatches.push(decodePdfEscapes(literal.slice(1, -1)));
    });
  }

  return normalizeExtractedText(textMatches.join("\n"));
};

export const ingestPdfDocument = async (fileLike) => {
  const buffer = await fileLike.arrayBuffer();
  const pdfSource = new TextDecoder("latin1").decode(buffer);
  const extractedText = extractPdfText(pdfSource);

  if (!extractedText) {
    return {
      status: "failed",
      normalizedText: "",
      excerpt: "",
      errorMessage:
        "The PDF could not be processed into selectable text. It may be scanned, image-based, or too visually structured for v1."
    };
  }

  return {
    status: "processed",
    normalizedText: extractedText,
    excerpt: extractedText.split("\n").slice(0, 4).join("\n"),
    errorMessage: null
  };
};
