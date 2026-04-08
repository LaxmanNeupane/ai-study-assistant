import {
  addDocumentsToCourseWorkspace,
  applyDocumentProcessingResult,
  addCourseWorkspace,
  createCourseWorkspaceState,
  getCourseKnowledgeSourceDocuments,
  getCourseWorkspaceDocuments,
  getActiveCourseWorkspace,
  selectCourseWorkspace
} from "../../../packages/domain/src/courseWorkspace.js";
import {
  buildCourseKnowledgeEntries,
  retrieveCourseKnowledge
} from "../../../packages/course-store/src/courseStore.js";
import { ingestPdfDocument } from "../../../packages/ingestion/src/pdfIngestion.js";
import { generateStudyNotes } from "../../../packages/notes/src/studyNotes.js";
import { answerCourseQuestion } from "../../../packages/qa/src/groundedQa.js";

const STORAGE_KEY = "ai-study-assistant.course-workspaces";

const courseListElement = document.querySelector("#course-list");
const activeCourseElement = document.querySelector("#active-course");
const courseFormElement = document.querySelector("#course-form");
const courseMessageElement = document.querySelector("#form-message");
const workflowStatusElement = document.querySelector("#workflow-status");
const uploadFormElement = document.querySelector("#upload-form");
const uploadInputElement = document.querySelector("#course-documents");
const uploadMessageElement = document.querySelector("#upload-message");
const documentListElement = document.querySelector("#document-list");
const knowledgeSearchFormElement = document.querySelector("#knowledge-search-form");
const knowledgeQueryElement = document.querySelector("#knowledge-query");
const knowledgeMessageElement = document.querySelector("#knowledge-message");
const knowledgeListElement = document.querySelector("#knowledge-list");
const notesFormElement = document.querySelector("#notes-form");
const notesMessageElement = document.querySelector("#notes-message");
const notesOutputElement = document.querySelector("#notes-output");
const qaFormElement = document.querySelector("#qa-form");
const qaQuestionElement = document.querySelector("#qa-question");
const qaMessageElement = document.querySelector("#qa-message");
const qaOutputElement = document.querySelector("#qa-output");
let isProcessingUploads = false;
let latestKnowledgeQuery = "";
let latestGeneratedNotes = null;
let latestQaResult = null;

const formatStatusLabel = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "Unknown";

const loadState = () => {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return createCourseWorkspaceState();
    }

    const parsed = JSON.parse(saved);

    return createCourseWorkspaceState(
      Array.isArray(parsed.courses) ? parsed.courses : [],
      parsed.activeCourseId ?? null
    );
  } catch {
    return createCourseWorkspaceState();
  }
};

let state = loadState();

const saveState = () => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const setMessage = (element, text, tone = "muted") => {
  element.textContent = text;
  element.dataset.tone = tone;
};

const renderCourseList = () => {
  if (state.courses.length === 0) {
    courseListElement.innerHTML = `
      <div class="empty-state">
        <h3>No course workspaces yet</h3>
        <p>Create your first course to start the study workflow.</p>
      </div>
    `;
    return;
  }

  courseListElement.innerHTML = "";

  state.courses.forEach((course) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "course-card";
    button.dataset.courseId = course.id;

    if (course.id === state.activeCourseId) {
      button.dataset.active = "true";
    }

    button.innerHTML = `
      <div class="course-card-top">
        <p class="course-title">${course.name}</p>
        <span class="active-pill">${
          course.id === state.activeCourseId ? "Active" : "Select"
        }</span>
      </div>
      <p class="course-code">${course.code || "Course code not set"}</p>
      <p class="course-meta">Uploads, notes, and grounded answers stay inside this course.</p>
    `;

    button.addEventListener("click", () => {
      state = selectCourseWorkspace(state, course.id);
      latestKnowledgeQuery = "";
      latestGeneratedNotes = null;
      latestQaResult = null;
      knowledgeQueryElement.value = "";
      qaQuestionElement.value = "";
      saveState();
      render();
      setMessage(
        courseMessageElement,
        `${course.name} is now the active course workspace.`,
        "success"
      );
    });

    courseListElement.append(button);
  });
};

const renderActiveCourse = () => {
  const activeCourse = getActiveCourseWorkspace(state);

  if (!activeCourse) {
    activeCourseElement.innerHTML = `
      <div class="empty-state">
        <h3>No active course selected</h3>
        <p>Select a course to activate uploads, notes, search, and grounded Q&amp;A.</p>
      </div>
    `;
    return;
  }

  activeCourseElement.innerHTML = `
    <div class="active-card">
      <div class="active-card-header">
        <div>
          <p class="active-label">Active workspace</p>
          <h3>${activeCourse.name}</h3>
        </div>
        <span class="active-badge">${activeCourse.code || "No code"}</span>
      </div>

      <div class="active-grid">
        <article class="focus-tile">
          <p class="tile-label">Live now</p>
          <h4>PDF processing</h4>
          <p>Supported PDFs are attached to this course and processed into searchable study material.</p>
        </article>
        <article class="focus-tile">
          <p class="tile-label">Live now</p>
          <h4>Study notes</h4>
          <p>Notes are generated only from indexed content inside this active course.</p>
        </article>
        <article class="focus-tile">
          <p class="tile-label">Live now</p>
          <h4>Grounded Q&amp;A</h4>
          <p>Questions are answered only from this course's materials with visible supporting excerpts.</p>
        </article>
      </div>
    </div>
  `;
};

const renderWorkflowStatus = () => {
  const activeCourse = getActiveCourseWorkspace(state);

  if (!activeCourse) {
    workflowStatusElement.innerHTML = `
      <div class="empty-state">
        <h3>No workflow in progress</h3>
        <p>Create or select a course to begin the full study flow.</p>
      </div>
    `;
    return;
  }

  const documents = getCourseWorkspaceDocuments(state, activeCourse.id);
  const processedDocuments = getCourseKnowledgeSourceDocuments(state, activeCourse.id);
  const knowledgeEntries = buildCourseKnowledgeEntries(processedDocuments);
  const hasNotes = latestGeneratedNotes?.courseId === activeCourse.id;
  const hasQa = latestQaResult?.courseId === activeCourse.id;

  const checks = [
    {
      label: "Course selected",
      detail: activeCourse.name,
      ready: true
    },
    {
      label: "Documents attached",
      detail: `${documents.length} file${documents.length === 1 ? "" : "s"} tracked`,
      ready: documents.length > 0
    },
    {
      label: "Processed content",
      detail: `${processedDocuments.length} processed PDF${processedDocuments.length === 1 ? "" : "s"}`,
      ready: processedDocuments.length > 0
    },
    {
      label: "Knowledge indexed",
      detail: `${knowledgeEntries.length} chunk${knowledgeEntries.length === 1 ? "" : "s"} available`,
      ready: knowledgeEntries.length > 0
    },
    {
      label: "Notes generated",
      detail: hasNotes ? `${latestGeneratedNotes.notes.sections.length} note section${latestGeneratedNotes.notes.sections.length === 1 ? "" : "s"}` : "Generate notes to complete this step",
      ready: Boolean(hasNotes)
    },
    {
      label: "Grounded Q&A used",
      detail: hasQa ? formatStatusLabel(latestQaResult.result.status) : "Ask a grounded question to complete this step",
      ready: Boolean(hasQa)
    }
  ];

  const list = document.createElement("div");
  list.className = "document-cards";

  checks.forEach((check) => {
    const item = document.createElement("article");
    item.className = "document-card";
    item.dataset.status = check.ready ? "processed" : "failed";
    item.innerHTML = `
      <div class="document-card-top">
        <p class="document-name">${check.label}</p>
        <span class="active-pill">${check.ready ? "Ready" : "Pending"}</span>
      </div>
      <p class="document-meta">${check.detail}</p>
    `;
    list.append(item);
  });

  workflowStatusElement.innerHTML = "";
  workflowStatusElement.append(list);
};

const formatBytes = (sizeInBytes) => {
  if (!sizeInBytes) {
    return "Size unavailable";
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeInBytes / 102.4) / 10)} KB`;
  }

  return `${Math.round((sizeInBytes / (1024 * 1024)) * 10) / 10} MB`;
};

const renderDocumentList = () => {
  const activeCourse = getActiveCourseWorkspace(state);

  if (!activeCourse) {
    documentListElement.innerHTML = `
      <div class="empty-state">
        <h3>No active upload target</h3>
        <p>Select a course before uploading any study material.</p>
      </div>
    `;
    return;
  }

  const documents = getCourseWorkspaceDocuments(state, activeCourse.id);

  if (documents.length === 0) {
    documentListElement.innerHTML = `
      <div class="empty-state">
        <h3>No PDFs uploaded yet</h3>
        <p>Uploaded files for the active course will appear here.</p>
      </div>
    `;
    return;
  }

  documentListElement.innerHTML = `
    <div class="document-list-header">
      <h3>${activeCourse.name} documents</h3>
      <p>${documents.length} tracked file${documents.length === 1 ? "" : "s"} in this course</p>
    </div>
  `;

  const list = document.createElement("div");
  list.className = "document-cards";

  documents.forEach((courseDocument) => {
    const item = document.createElement("article");
    item.className = "document-card";
    if (courseDocument.status === "unsupported") {
      item.dataset.status = "unsupported";
    } else if (courseDocument.status === "processed") {
      item.dataset.status = "processed";
    } else if (courseDocument.status === "failed") {
      item.dataset.status = "failed";
    }
    item.innerHTML = `
      <div class="document-card-top">
        <p class="document-name">${courseDocument.name}</p>
        <span class="active-pill">${formatStatusLabel(courseDocument.status)}</span>
      </div>
      <p class="document-meta">${formatBytes(courseDocument.sizeInBytes)} | ${courseDocument.type}</p>
      ${
        courseDocument.unsupportedReason
          ? `<p class="document-warning">${courseDocument.unsupportedReason.message}</p>`
          : ""
      }
      ${
        courseDocument.processingError
          ? `<p class="document-warning">${courseDocument.processingError}</p>`
          : ""
      }
      ${
        courseDocument.excerpt
          ? `<pre class="document-excerpt">${courseDocument.excerpt}</pre>`
          : ""
      }
    `;
    list.append(item);
  });

  documentListElement.append(list);
};

const renderKnowledgeList = () => {
  const activeCourse = getActiveCourseWorkspace(state);

  if (!activeCourse) {
    knowledgeListElement.innerHTML = `
      <div class="empty-state">
        <h3>No active course knowledge</h3>
        <p>Select a course to inspect its indexed study material.</p>
      </div>
    `;
    return;
  }

  const processedDocuments = getCourseKnowledgeSourceDocuments(state, activeCourse.id);
  const knowledgeEntries = buildCourseKnowledgeEntries(processedDocuments);

  if (processedDocuments.length === 0) {
    knowledgeListElement.innerHTML = `
      <div class="empty-state">
        <h3>No indexed content yet</h3>
        <p>Process at least one supported PDF to build searchable course knowledge.</p>
      </div>
    `;
    setMessage(
      knowledgeMessageElement,
      "Only processed documents from the active course are indexed here.",
      "muted"
    );
    return;
  }

  if (!latestKnowledgeQuery) {
    setMessage(
      knowledgeMessageElement,
      "Browse indexed chunks from the active course or search a topic below.",
      "muted"
    );
  }

  const entries = latestKnowledgeQuery
    ? retrieveCourseKnowledge(knowledgeEntries, latestKnowledgeQuery, 5)
    : knowledgeEntries.slice(0, 5);

  knowledgeListElement.innerHTML = `
    <div class="document-list-header">
      <h3>${activeCourse.name} knowledge</h3>
      <p>${knowledgeEntries.length} indexed chunk${knowledgeEntries.length === 1 ? "" : "s"}</p>
    </div>
  `;

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <h3>No matching course results</h3>
      <p>Try a different query. Search is scoped to the active course only.</p>
    `;
    knowledgeListElement.append(empty);
    setMessage(
      knowledgeMessageElement,
      `No matches found in ${activeCourse.name}.`,
      "warning"
    );
    return;
  }

  const list = document.createElement("div");
  list.className = "document-cards";

  entries.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "document-card";
    item.dataset.status = "processed";
    item.innerHTML = `
      <div class="document-card-top">
        <p class="document-name">${entry.documentName}</p>
        <span class="active-pill">Chunk ${entry.chunkIndex + 1}</span>
      </div>
      <pre class="document-excerpt">${entry.content}</pre>
    `;
    list.append(item);
  });

  knowledgeListElement.append(list);
  setMessage(
    knowledgeMessageElement,
    latestKnowledgeQuery
      ? `Showing active-course matches for "${latestKnowledgeQuery}".`
      : "Showing indexed content from the active course only.",
    "success"
  );
};

const renderNotes = () => {
  const activeCourse = getActiveCourseWorkspace(state);

  if (!activeCourse) {
    notesOutputElement.innerHTML = `
      <div class="empty-state">
        <h3>No active course notes</h3>
        <p>Select a course before generating study notes.</p>
      </div>
    `;
    return;
  }

  if (!latestGeneratedNotes || latestGeneratedNotes.courseId !== activeCourse.id) {
    notesOutputElement.innerHTML = `
      <div class="empty-state">
        <h3>No notes generated yet</h3>
        <p>Generate notes from the active course's indexed content.</p>
      </div>
    `;
    setMessage(
      notesMessageElement,
      "Notes will be generated from processed documents in the active course only.",
      "muted"
    );
    return;
  }

  const notes = latestGeneratedNotes.notes;

  notesOutputElement.innerHTML = `
    <div class="document-list-header">
      <h3>${activeCourse.name} notes</h3>
      <p>${notes.sections.length} section${notes.sections.length === 1 ? "" : "s"}</p>
    </div>
  `;

  if (notes.warnings?.length) {
    const warnings = document.createElement("article");
    warnings.className = "document-card";
    warnings.dataset.status = "failed";
    warnings.innerHTML = `
      <div class="document-card-top">
        <p class="document-name">Trust signals</p>
        <span class="active-pill">Review</span>
      </div>
      <ul class="notes-bullets">
        ${notes.warnings.map((warning) => `<li>${warning}</li>`).join("")}
      </ul>
    `;
    notesOutputElement.append(warnings);
  }

  if (notes.summary) {
    const summary = document.createElement("article");
    summary.className = "document-card";
    summary.dataset.status = "processed";
    summary.innerHTML = `
      <div class="document-card-top">
        <p class="document-name">Course summary</p>
        <span class="active-pill">Snapshot</span>
      </div>
      <pre class="document-excerpt">${notes.summary}</pre>
    `;
    notesOutputElement.append(summary);
  }

  const list = document.createElement("div");
  list.className = "document-cards";

  notes.sections.forEach((section) => {
    const item = document.createElement("article");
    item.className = "document-card";
    item.dataset.status = "processed";
    item.innerHTML = `
      <div class="document-card-top">
        <p class="document-name">${section.heading}</p>
        <span class="active-pill">${section.sourceDocumentName}</span>
      </div>
      ${
        section.warnings?.length
          ? `<ul class="notes-bullets notes-warnings">${section.warnings
              .map((warning) => `<li>${warning}</li>`)
              .join("")}</ul>`
          : ""
      }
      <ul class="notes-bullets">
        ${section.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
      </ul>
    `;
    list.append(item);
  });

  notesOutputElement.append(list);
  setMessage(
    notesMessageElement,
    notes.warnings?.length
      ? "Study notes generated with trust warnings from the active course only."
      : "Study notes generated from the active course only.",
    notes.warnings?.length ? "warning" : "success"
  );
};

const renderQa = () => {
  const activeCourse = getActiveCourseWorkspace(state);

  if (!activeCourse) {
    qaOutputElement.innerHTML = `
      <div class="empty-state">
        <h3>No active course Q&amp;A</h3>
        <p>Select a course before asking grounded questions.</p>
      </div>
    `;
    return;
  }

  if (!latestQaResult || latestQaResult.courseId !== activeCourse.id) {
    qaOutputElement.innerHTML = `
      <div class="empty-state">
        <h3>No grounded answer yet</h3>
        <p>Ask a question to retrieve support from this course only.</p>
      </div>
    `;
    setMessage(
      qaMessageElement,
      "Answers will be grounded only in the active course's indexed content.",
      "muted"
    );
    return;
  }

  const result = latestQaResult.result;

  qaOutputElement.innerHTML = "";

  const answerCard = document.createElement("article");
  answerCard.className = "document-card";
  answerCard.dataset.status = result.status === "grounded" ? "processed" : "failed";
  answerCard.innerHTML = `
    <div class="document-card-top">
      <p class="document-name">Answer</p>
      <span class="active-pill">${formatStatusLabel(result.status)}</span>
    </div>
    <pre class="document-excerpt">${result.answer}</pre>
    ${
      result.guidance
        ? `<p class="document-warning">${result.guidance}</p>`
        : ""
    }
  `;
  qaOutputElement.append(answerCard);

  if (result.citations.length > 0) {
    const list = document.createElement("div");
    list.className = "document-cards";

    result.citations.forEach((citation) => {
      const item = document.createElement("article");
      item.className = "document-card";
      item.dataset.status = "processed";
      item.innerHTML = `
        <div class="document-card-top">
          <p class="document-name">${citation.documentName}</p>
          <span class="active-pill">Chunk ${citation.chunkIndex + 1}</span>
        </div>
        <pre class="document-excerpt">${citation.content}</pre>
      `;
      list.append(item);
    });

    qaOutputElement.append(list);
  }

  setMessage(
    qaMessageElement,
    result.status === "grounded"
      ? "Answer generated from the active course only."
      : result.reason === "no_course_content"
        ? "Process more course material before grounded Q&A can answer."
        : "The active course does not contain enough matching support for that question.",
    result.status === "grounded" ? "success" : "warning"
  );
};

const render = () => {
  uploadInputElement.disabled = isProcessingUploads;
  renderCourseList();
  renderActiveCourse();
  renderWorkflowStatus();
  renderDocumentList();
  renderKnowledgeList();
  renderNotes();
  renderQa();
};

const processAcceptedDocuments = async (courseId, files, documents) => {
  const filesByName = new Map(
    Array.from(files).map((file) => [file.name.trim(), file])
  );

  for (const document of documents) {
    const file = filesByName.get(document.name);

    if (!file) {
      state = applyDocumentProcessingResult(state, courseId, document.id, {
        status: "failed",
        normalizedText: "",
        excerpt: "",
        errorMessage: "The uploaded file data could not be found for processing."
      });
      saveState();
      render();
      continue;
    }

    const result = await ingestPdfDocument(file);
    state = applyDocumentProcessingResult(state, courseId, document.id, result);
    saveState();
    render();
  }
};

courseFormElement.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(courseFormElement);

  try {
    const result = addCourseWorkspace(state, {
      name: formData.get("name"),
      code: formData.get("code")
    });

    state = result.state;
    saveState();
    render();
    courseFormElement.reset();
    document.querySelector("#course-name").focus();
    setMessage(
      courseMessageElement,
      `${result.course.name} is ready for uploads, notes, and grounded Q&A.`,
      "success"
    );
  } catch (error) {
    setMessage(courseMessageElement, error.message, "error");
  }
});

uploadFormElement.addEventListener("submit", async (event) => {
  event.preventDefault();

  const activeCourse = getActiveCourseWorkspace(state);

  if (!activeCourse) {
    setMessage(
      uploadMessageElement,
      "Create or select a course before uploading PDFs.",
      "error"
    );
    return;
  }

  try {
    const selectedFiles = Array.from(uploadInputElement.files ?? []);
    const result = addDocumentsToCourseWorkspace(
      state,
      activeCourse.id,
      selectedFiles
    );

    state = result.state;
    saveState();
    isProcessingUploads = true;
    render();

    if (result.acceptedDocuments.length > 0) {
      setMessage(
        uploadMessageElement,
        `Processing ${result.acceptedDocuments.length} supported PDF${result.acceptedDocuments.length === 1 ? "" : "s"} for ${activeCourse.name}...`,
        "muted"
      );
      await processAcceptedDocuments(
        activeCourse.id,
        selectedFiles,
        result.acceptedDocuments
      );
    }

    isProcessingUploads = false;
    render();
    uploadFormElement.reset();
    if (result.acceptedDocuments.length > 0 && result.rejectedDocuments.length > 0) {
      const processedCount = getCourseWorkspaceDocuments(state, activeCourse.id).filter(
        (document) =>
          result.acceptedDocuments.some((accepted) => accepted.id === document.id) &&
          document.status === "processed"
      ).length;
      const failedCount = result.acceptedDocuments.length - processedCount;
      setMessage(
        uploadMessageElement,
        `${processedCount} processed, ${failedCount} failed, and ${result.rejectedDocuments.length} file${result.rejectedDocuments.length === 1 ? "" : "s"} flagged as unsupported for this demo.`,
        "warning"
      );
    } else if (result.acceptedDocuments.length > 0) {
      const processedCount = getCourseWorkspaceDocuments(state, activeCourse.id).filter(
        (document) =>
          result.acceptedDocuments.some((accepted) => accepted.id === document.id) &&
          document.status === "processed"
      ).length;
      const failedCount = result.acceptedDocuments.length - processedCount;
      setMessage(
        uploadMessageElement,
        failedCount === 0
          ? `${processedCount} PDF${processedCount === 1 ? "" : "s"} processed for ${activeCourse.name}.`
          : `${processedCount} PDF${processedCount === 1 ? "" : "s"} processed and ${failedCount} failed during extraction for ${activeCourse.name}.`,
        failedCount === 0 ? "success" : "warning"
      );
    } else {
      setMessage(
        uploadMessageElement,
        `No files were accepted for ${activeCourse.name}. Review the unsupported-file guidance below.`,
        "warning"
      );
    }
  } catch (error) {
    isProcessingUploads = false;
    render();
    setMessage(uploadMessageElement, error.message, "error");
  }
});

knowledgeSearchFormElement.addEventListener("submit", (event) => {
  event.preventDefault();
  latestKnowledgeQuery = knowledgeQueryElement.value.trim();
  renderKnowledgeList();
});

notesFormElement.addEventListener("submit", (event) => {
  event.preventDefault();

  const activeCourse = getActiveCourseWorkspace(state);

  if (!activeCourse) {
    setMessage(notesMessageElement, "Select a course before generating notes.", "error");
    return;
  }

  const processedDocuments = getCourseKnowledgeSourceDocuments(state, activeCourse.id);
  const knowledgeEntries = buildCourseKnowledgeEntries(processedDocuments);
  const notes = generateStudyNotes(knowledgeEntries);

  if (notes.sections.length === 0) {
    latestGeneratedNotes = null;
    renderNotes();
    setMessage(
      notesMessageElement,
      `No indexed content is available yet for ${activeCourse.name}. Process supported PDFs first.`,
      "warning"
    );
    return;
  }

  latestGeneratedNotes = {
    courseId: activeCourse.id,
    notes
  };
  renderNotes();
});

qaFormElement.addEventListener("submit", (event) => {
  event.preventDefault();

  const activeCourse = getActiveCourseWorkspace(state);

  if (!activeCourse) {
    setMessage(qaMessageElement, "Select a course before asking a question.", "error");
    return;
  }

  const processedDocuments = getCourseKnowledgeSourceDocuments(state, activeCourse.id);
  const knowledgeEntries = buildCourseKnowledgeEntries(processedDocuments);
  const question = qaQuestionElement.value.trim();

  if (!question) {
    setMessage(qaMessageElement, "Enter a question for the active course.", "error");
    return;
  }

  latestQaResult = {
    courseId: activeCourse.id,
    result: answerCourseQuestion(knowledgeEntries, question)
  };
  renderQa();
});

render();
