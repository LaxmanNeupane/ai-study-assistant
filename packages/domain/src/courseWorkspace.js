const createId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `course-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

export const createCourseWorkspaceState = (courses = [], activeCourseId = null) => ({
  courses,
  activeCourseId
});

const normalizeLabel = (value) => value.trim().replace(/\s+/g, " ");

export const addCourseWorkspace = (
  state,
  { name, code = "" },
  options = {}
) => {
  const normalizedName = normalizeLabel(name ?? "");
  const normalizedCode = normalizeLabel(code ?? "").toUpperCase();

  if (!normalizedName) {
    throw new Error("Course name is required.");
  }

  const id = options.createId ?? createId();
  const course = {
    id,
    name: normalizedName,
    code: normalizedCode,
    createdAt: options.createdAt ?? new Date().toISOString(),
    documents: []
  };

  return {
    state: {
      courses: [...state.courses, course],
      activeCourseId: state.activeCourseId ?? course.id
    },
    course
  };
};

export const selectCourseWorkspace = (state, courseId) => {
  const courseExists = state.courses.some((course) => course.id === courseId);

  if (!courseExists) {
    throw new Error("Course not found.");
  }

  return {
    ...state,
    activeCourseId: courseId
  };
};

export const getActiveCourseWorkspace = (state) =>
  state.courses.find((course) => course.id === state.activeCourseId) ?? null;

const normalizeDocumentName = (value) => normalizeLabel(value ?? "");

const isPdfLikeDocument = (document) => {
  const normalizedName = normalizeDocumentName(document.name);
  const normalizedType = normalizeLabel(document.type ?? "").toLowerCase();

  return (
    normalizedName.toLowerCase().endsWith(".pdf") ||
    normalizedType === "application/pdf"
  );
};

const inferUnsupportedReason = (document) => {
  const normalizedName = normalizeDocumentName(document.name).toLowerCase();
  const normalizedType = normalizeLabel(document.type ?? "").toLowerCase();

  if (!isPdfLikeDocument(document)) {
    return {
      code: "not_pdf",
      message: "Unsupported in v1: only PDF files can be uploaded."
    };
  }

  if (
    normalizedName.includes("scan") ||
    normalizedName.includes("scanned") ||
    normalizedName.includes("image") ||
    normalizedType.startsWith("image/")
  ) {
    return {
      code: "scanned_pdf",
      message: "Likely unsupported in v1: scanned or image-based PDFs requiring OCR are out of scope."
    };
  }

  if (
    normalizedName.includes("diagram") ||
    normalizedName.includes("chart") ||
    normalizedName.includes("table") ||
    normalizedName.includes("figure")
  ) {
    return {
      code: "heavy_visual_pdf",
      message: "Likely unsupported in v1: PDFs dominated by diagrams, charts, or tables are out of scope."
    };
  }

  return null;
};

export const addDocumentsToCourseWorkspace = (
  state,
  courseId,
  documents,
  options = {}
) => {
  const course = state.courses.find((entry) => entry.id === courseId);

  if (!course) {
    throw new Error("Course not found.");
  }

  const items = Array.from(documents ?? []);

  if (items.length === 0) {
    throw new Error("Select at least one PDF to upload.");
  }

  const processedDocuments = items.map((document, index) => {
    const name = normalizeDocumentName(document.name);

    if (!name) {
      throw new Error("Each uploaded document must have a file name.");
    }

    const createDocumentId = options.createDocumentId ?? createId;
    const unsupportedReason = inferUnsupportedReason(document);

    return {
      id: createDocumentId(document, index),
      name,
      type: normalizeLabel(document.type ?? "") || "application/pdf",
      sizeInBytes: Number(document.size ?? 0),
      uploadedAt: options.uploadedAt ?? new Date().toISOString(),
      status: unsupportedReason ? "unsupported" : "uploaded",
      unsupportedReason,
      normalizedText: "",
      excerpt: "",
      processingError: null
    };
  });

  return {
    state: {
      ...state,
      courses: state.courses.map((entry) =>
        entry.id === courseId
          ? {
              ...entry,
              documents: [...(entry.documents ?? []), ...processedDocuments]
            }
          : entry
      )
    },
    documents: processedDocuments,
    acceptedDocuments: processedDocuments.filter(
      (document) => document.status === "uploaded"
    ),
    rejectedDocuments: processedDocuments.filter(
      (document) => document.status === "unsupported"
    )
  };
};

export const getCourseWorkspaceDocuments = (state, courseId) => {
  const course = state.courses.find((entry) => entry.id === courseId);

  if (!course) {
    throw new Error("Course not found.");
  }

  return course.documents ?? [];
};

export const getCourseKnowledgeSourceDocuments = (state, courseId) =>
  getCourseWorkspaceDocuments(state, courseId).filter(
    (document) => document.status === "processed" && document.normalizedText
  );

export const applyDocumentProcessingResult = (
  state,
  courseId,
  documentId,
  processingResult
) => {
  const course = state.courses.find((entry) => entry.id === courseId);

  if (!course) {
    throw new Error("Course not found.");
  }

  const documentExists = (course.documents ?? []).some(
    (document) => document.id === documentId
  );

  if (!documentExists) {
    throw new Error("Document not found.");
  }

  return {
    ...state,
    courses: state.courses.map((entry) =>
      entry.id === courseId
        ? {
            ...entry,
            documents: (entry.documents ?? []).map((document) =>
              document.id === documentId
                ? {
                    ...document,
                    status: processingResult.status,
                    normalizedText: processingResult.normalizedText ?? "",
                    excerpt: processingResult.excerpt ?? "",
                    processingError: processingResult.errorMessage ?? null
                  }
                : document
            )
          }
        : entry
    )
  };
};
