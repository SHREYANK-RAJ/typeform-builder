"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  GripVertical,
  Link2,
  Plus,
  Save,
  Trash2,
  X,
  Palette,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import {
  getForm,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  updateForm,
  reorderQuestions,
  togglePublish,
  getLogicRules,
  createLogicRule,
  deleteLogicRule,
  Form,
  Question,
  LogicRule,
} from "../../../lib/api";

import { useTheme } from "../../../components/ThemeProvider";

const QUESTION_TYPES = [
  {
    value: "short_text",
    label: "Short text",
  },
  {
    value: "long_text",
    label: "Long text",
  },
  {
    value: "multiple_choice",
    label: "Multiple choice",
  },
  {
    value: "dropdown",
    label: "Dropdown",
  },
  {
    value: "email",
    label: "Email",
  },
  {
    value: "number",
    label: "Number",
  },
  {
    value: "yes_no",
    label: "Yes / No",
  },
  {
    value: "rating",
    label: "Rating",
  },
];

type Toast = {
  message: string;
  type: "success" | "error";
};

function SortableQuestionCard({
  question,
  index,
  onChange,
  onSave,
  onDelete,
  onAddOption,
  onChangeOption,
  onDeleteOption,
}: {
  question: Question;
  index: number;
  onChange: (
    questionId: number,
    field: keyof Question,
    value: string | boolean
  ) => void;
  onSave: (question: Question) => void;
  onDelete: (questionId: number) => void;
  onAddOption: (question: Question) => void;
  onChangeOption: (
    question: Question,
    optionIndex: number,
    value: string
  ) => void;
  onDeleteOption: (
    question: Question,
    optionIndex: number
  ) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isChoiceQuestion =
    question.type === "multiple_choice" ||
    question.type === "dropdown";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border p-6 shadow-sm transition ${
        isDragging
          ? "z-10 border-gray-900 shadow-xl dark:border-white"
          : "border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      }`}
    >
      {/* Question header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing dark:hover:bg-gray-800 dark:hover:text-gray-200"
            title="Drag to reorder"
          >
            <GripVertical size={18} />
          </button>

          <span className="text-sm font-semibold text-gray-400">
            Question {index + 1}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDelete(question.id)}
          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
          title="Delete question"
        >
          <Trash2 size={17} />
        </button>
      </div>

      {/* Question type */}
      <div className="mb-4">
        <select
          value={question.type}
          onChange={(event) =>
            onChange(
              question.id,
              "type",
              event.target.value
            )
          }
          onBlur={() => onSave(question)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none transition focus:border-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-white"
        >
          {QUESTION_TYPES.map((type) => (
            <option
              key={type.value}
              value={type.value}
            >
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Question title */}
      <input
        value={question.title}
        onChange={(event) =>
          onChange(
            question.id,
            "title",
            event.target.value
          )
        }
        onBlur={() => onSave(question)}
        className="w-full border-b border-gray-200 bg-transparent pb-3 text-xl font-semibold text-gray-900 outline-none transition focus:border-gray-900 placeholder:text-gray-300 dark:border-gray-700 dark:text-gray-100 dark:focus:border-white dark:placeholder:text-gray-600"
        placeholder="Write your question..."
      />

      {/* Description */}
      <input
        value={question.description || ""}
        onChange={(event) =>
          onChange(
            question.id,
            "description",
            event.target.value
          )
        }
        onBlur={() => onSave(question)}
        className="mt-4 w-full border-b border-gray-100 bg-transparent pb-3 text-sm text-gray-500 outline-none transition focus:border-gray-300 dark:border-gray-800 dark:text-gray-400 dark:focus:border-gray-600"
        placeholder="Add help text..."
      />

      {/* Required */}
      <label className="mt-5 flex cursor-pointer items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
        <input
          type="checkbox"
          checked={question.required}
          onChange={(event) =>
            onChange(
              question.id,
              "required",
              event.target.checked
            )
          }
          onBlur={() => onSave(question)}
          className="h-4 w-4 rounded"
        />

        <span>Required</span>
      </label>

      {/* Options */}
      {isChoiceQuestion && (
        <div className="mt-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Options
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Add the choices respondents can select.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onAddOption(question)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
              style={{
                backgroundColor:
                  "var(--accent-primary)",
              }}
            >
              <Plus size={14} />
              Add option
            </button>
          </div>

          <div className="space-y-2">
            {(question.options || []).map(
              (option, optionIndex) => (
                <div
                  key={optionIndex}
                  className="flex items-center gap-2"
                >
                  <span className="w-5 text-center text-xs text-gray-400">
                    {optionIndex + 1}
                  </span>

                  <input
                    value={option}
                    onChange={(event) =>
                      onChangeOption(
                        question,
                        optionIndex,
                        event.target.value
                      )
                    }
                    onBlur={() =>
                      onSave(question)
                    }
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-white"
                    placeholder={`Option ${
                      optionIndex + 1
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      onDeleteOption(
                        question,
                        optionIndex
                      )
                    }
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    title="Delete option"
                  >
                    <X size={16} />
                  </button>
                </div>
              )
            )}
          </div>

          {(question.options || []).length === 0 && (
            <p className="mt-3 text-xs text-gray-400">
              No options yet. Click "Add option".
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Builder({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [formId, setFormId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<Form | null>(null);

  const [questions, setQuestions] =
    useState<Question[]>([]);

  const [logicRules, setLogicRules] =
    useState<LogicRule[]>([]);

  const [logicSourceId, setLogicSourceId] =
    useState<number | "">("");

  const [logicOperator, setLogicOperator] =
    useState("equals");

  const [logicValue, setLogicValue] =
    useState("");

  const [logicTargetId, setLogicTargetId] =
    useState<number | "">("");

  const [logicSaving, setLogicSaving] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saveStatus, setSaveStatus] =
    useState<
      "idle" | "saving" | "saved" | "error"
    >("idle");

  const [toast, setToast] =
    useState<Toast | null>(null);

  const [publishing, setPublishing] =
    useState(false);

  const [themeOpen, setThemeOpen] =
    useState(false);

  const {
    mode,
    accent,
    setMode,
    setAccent,
  } = useTheme();

  function showToast(
    message: string,
    type: "success" | "error" = "success"
  ) {
    setToast({
      message,
      type,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  useEffect(() => {
    async function loadBuilder() {
      try {
        const { id } = await params;

        const numericId = Number(id);

        if (Number.isNaN(numericId)) {
          throw new Error("Invalid form ID");
        }

        setFormId(numericId);

        const [
          formData,
          questionData,
          logicRuleData,
        ] = await Promise.all([
          getForm(numericId),
          getQuestions(numericId),
          getLogicRules(numericId),
        ]);

        setForm(formData);

        setQuestions(
          [...questionData].sort(
            (a, b) =>
              a.position - b.position
          )
        );

        setLogicRules(logicRuleData);
      } catch (error) {
        console.error(
          "Failed to load builder:",
          error
        );

        showToast(
          "Failed to load form.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    }

    loadBuilder();
  }, [params]);

  function handleFormTitleChange(
    title: string
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            title,
          }
        : current
    );
  }

  function handleFormDescriptionChange(
    description: string
  ) {
    setForm((current) =>
      current
        ? {
            ...current,
            description,
          }
        : current
    );
  }

  function changeQuestion(
    questionId: number,
    field: keyof Question,
    value: string | boolean
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    );
  }

  async function saveQuestion(
    question: Question
  ) {
    try {
      const updated =
        await updateQuestion(
          question.id,
          {
            type: question.type,
            title: question.title,
            description:
              question.description || "",
            required: question.required,
            options:
              question.options || null,
          }
        );

      setQuestions((current) =>
        current.map((item) =>
          item.id === question.id
            ? updated
            : item
        )
      );
    } catch (error) {
      console.error(
        "Failed to save question:",
        error
      );

      showToast(
        "Failed to save question.",
        "error"
      );
    }
  }

  async function saveForm() {
    if (!form || !formId) {
      return;
    }

    setSaving(true);
    setSaveStatus("saving");

    try {
      const updatedForm =
        await updateForm(formId, {
          title: form.title,
          description:
            form.description || "",
        });

      const updatedQuestions =
        await Promise.all(
          questions.map((question) =>
            updateQuestion(
              question.id,
              {
                type: question.type,
                title: question.title,
                description:
                  question.description || "",
                required:
                  question.required,
                options:
                  question.options || null,
              }
            )
          )
        );

      setForm(updatedForm);

      setQuestions(
        [...updatedQuestions].sort(
          (a, b) =>
            a.position - b.position
        )
      );

      setSaveStatus("saved");

      showToast(
        "Form saved successfully."
      );

      window.setTimeout(() => {
        setSaveStatus("idle");
      }, 2500);
    } catch (error) {
      console.error(
        "Failed to save form:",
        error
      );

      setSaveStatus("error");

      showToast(
        "Failed to save form.",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function addQuestion() {
    if (!formId) {
      return;
    }

    try {
      const question =
        await createQuestion(
          formId,
          {
            type: "short_text",
            title: "Untitled question",
            description: "",
            required: false,
            options: null,
          }
        );

      setQuestions((current) => [
        ...current,
        question,
      ]);

      showToast(
        "Question added."
      );
    } catch (error) {
      console.error(
        "Failed to create question:",
        error
      );

      showToast(
        "Failed to add question.",
        "error"
      );
    }
  }

  async function removeQuestion(
    questionId: number
  ) {
    try {
      await deleteQuestion(
        questionId
      );

      setQuestions((current) =>
        current.filter(
          (question) =>
            question.id !== questionId
        )
      );

      setLogicRules((current) =>
        current.filter(
          (rule) =>
            rule.source_question_id !== questionId &&
            rule.target_question_id !== questionId
        )
      );

      showToast(
        "Question deleted."
      );
    } catch (error) {
      console.error(
        "Failed to delete question:",
        error
      );

      showToast(
        "Failed to delete question.",
        "error"
      );
    }
  }

  function addOption(
    question: Question
  ) {
    const currentOptions =
      question.options || [];

    const updatedQuestion = {
      ...question,
      options: [
        ...currentOptions,
        `Option ${
          currentOptions.length + 1
        }`,
      ],
    };

    setQuestions((current) =>
      current.map((item) =>
        item.id === question.id
          ? updatedQuestion
          : item
      )
    );

    void saveQuestion(
      updatedQuestion
    );
  }

  function changeOption(
    question: Question,
    optionIndex: number,
    value: string
  ) {
    const currentOptions =
      question.options || [];

    const updatedOptions =
      [...currentOptions];

    updatedOptions[optionIndex] =
      value;

    setQuestions((current) =>
      current.map((item) =>
        item.id === question.id
          ? {
              ...item,
              options:
                updatedOptions,
            }
          : item
      )
    );
  }

  function deleteOption(
    question: Question,
    optionIndex: number
  ) {
    const currentOptions =
      question.options || [];

    const updatedOptions =
      currentOptions.filter(
        (_, index) =>
          index !== optionIndex
      );

    const updatedQuestion = {
      ...question,
      options: updatedOptions,
    };

    setQuestions((current) =>
      current.map((item) =>
        item.id === question.id
          ? updatedQuestion
          : item
      )
    );

    void saveQuestion(
      updatedQuestion
    );
  }

  async function handleDragEnd(
    event: DragEndEvent
  ) {
    const {
      active,
      over,
    } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex =
      questions.findIndex(
        (question) =>
          question.id === active.id
      );

    const newIndex =
      questions.findIndex(
        (question) =>
          question.id === over.id
      );

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return;
    }

    const reordered =
      arrayMove(
        questions,
        oldIndex,
        newIndex
      );

    setQuestions(reordered);

    if (!formId) {
      return;
    }

    try {
      await reorderQuestions(
        formId,
        reordered.map(
          (question) =>
            question.id
        )
      );

      showToast(
        "Questions reordered."
      );
    } catch (error) {
      console.error(
        "Failed to reorder questions:",
        error
      );

      showToast(
        "Failed to save new order.",
        "error"
      );

      const refreshed =
        await getQuestions(formId);

      setQuestions(
        [...refreshed].sort(
          (a, b) =>
            a.position - b.position
        )
      );
    }
  }

  // =========================================================
  // LOGIC JUMP HANDLERS
  // =========================================================

  function getQuestionLabel(questionId: number) {
    const index = questions.findIndex(
      (question) => question.id === questionId
    );

    if (index === -1) {
      return "Unknown question";
    }

    return `Q${index + 1}: ${
      questions[index].title || "Untitled question"
    }`;
  }


  function getSourceQuestion() {
    if (logicSourceId === "") {
      return null;
    }

    return (
      questions.find(
        (question) =>
          question.id === logicSourceId
      ) || null
    );
  }


  function getAvailableTargets() {
    if (logicSourceId === "") {
      return [];
    }

    const sourceIndex =
      questions.findIndex(
        (question) =>
          question.id === logicSourceId
      );

    if (sourceIndex === -1) {
      return [];
    }

    return questions.slice(
      sourceIndex + 1
    );
  }


  function getLogicValueOptions() {
    const source = getSourceQuestion();

    if (!source) {
      return [];
    }

    if (
      source.type === "multiple_choice" ||
      source.type === "dropdown"
    ) {
      return source.options || [];
    }

    if (source.type === "yes_no") {
      return ["Yes", "No"];
    }

    if (source.type === "rating") {
      return ["1", "2", "3", "4", "5"];
    }

    return [];
  }


  async function handleCreateLogicRule() {
    if (!formId) {
      return;
    }

    if (
      logicSourceId === "" ||
      logicTargetId === ""
    ) {
      showToast(
        "Choose a source and target question.",
        "error"
      );
      return;
    }

    const source =
      questions.find(
        (question) =>
          question.id === logicSourceId
      );

    const target =
      questions.find(
        (question) =>
          question.id === logicTargetId
      );

    if (!source || !target) {
      showToast(
        "Invalid source or target question.",
        "error"
      );
      return;
    }

    if (
      target.position <= source.position
    ) {
      showToast(
        "Logic jumps must go to a later question.",
        "error"
      );
      return;
    }

    if (
      logicOperator !== "is_empty" &&
      logicOperator !== "is_not_empty" &&
      !logicValue.trim()
    ) {
      showToast(
        "Enter or select a condition value.",
        "error"
      );
      return;
    }

    setLogicSaving(true);

    try {
      const created =
        await createLogicRule(
          formId,
          {
            source_question_id:
              Number(logicSourceId),
            operator:
              logicOperator,
            value:
              logicOperator === "is_empty" ||
              logicOperator === "is_not_empty"
                ? ""
                : logicValue,
            target_question_id:
              Number(logicTargetId),
          }
        );

      setLogicRules((current) => [
        ...current,
        created,
      ]);

      setLogicValue("");
      setLogicTargetId("");

      showToast(
        "Logic jump created successfully."
      );
    } catch (error) {
      console.error(
        "Failed to create logic rule:",
        error
      );

      showToast(
        "Failed to create logic jump.",
        "error"
      );
    } finally {
      setLogicSaving(false);
    }
  }


  async function handleDeleteLogicRule(
    ruleId: number
  ) {
    try {
      await deleteLogicRule(ruleId);

      setLogicRules((current) =>
        current.filter(
          (rule) => rule.id !== ruleId
        )
      );

      showToast(
        "Logic jump deleted."
      );
    } catch (error) {
      console.error(
        "Failed to delete logic rule:",
        error
      );

      showToast(
        "Failed to delete logic jump.",
        "error"
      );
    }
  }


  function handleLogicSourceChange(
    value: string
  ) {
    const sourceId =
      value === "" ? "" : Number(value);

    setLogicSourceId(sourceId);
    setLogicTargetId("");
    setLogicValue("");
  }


  async function handlePublish() {
    if (!formId || !form) {
      return;
    }

    setPublishing(true);

    try {
      const result =
        await togglePublish(
          formId
        );

      setForm((current) =>
        current
          ? {
              ...current,
              is_published:
                result.is_published,
              public_slug:
                result.public_slug,
            }
          : current
      );

      showToast(
        result.is_published
          ? "Form published successfully."
          : "Form unpublished successfully."
      );
    } catch (error) {
      console.error(
        "Failed to publish form:",
        error
      );

      showToast(
        "Failed to update publish status.",
        "error"
      );
    } finally {
      setPublishing(false);
    }
  }

  async function copyPublicLink() {
    if (!form?.public_slug) {
      showToast(
        "Publish the form first.",
        "error"
      );

      return;
    }

    const link =
      `${window.location.origin}/form/${form.public_slug}`;

    try {
      await navigator.clipboard.writeText(
        link
      );

      showToast(
        "Public link copied."
      );
    } catch (error) {
      console.error(
        "Failed to copy link:",
        error
      );

      showToast(
        "Could not copy the link.",
        "error"
      );
    }
  }

  function openPublicForm() {
    if (!form?.public_slug) {
      showToast(
        "Publish the form first.",
        "error"
      );

      return;
    }

    window.open(
      `/form/${form.public_slug}`,
      "_blank"
    );
  }

  function openResults() {
    if (!formId) {
      return;
    }

    window.location.href =
      `/results/${formId}`;
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] dark:bg-gray-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white" />

          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Loading builder...
          </p>
        </div>
      </main>
    );
  }

  if (!form) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] dark:bg-gray-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Form not found
          </h1>

          <button
            onClick={() => {
              window.location.href =
                "/";
            }}
            className="mt-5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{
              backgroundColor:
                "var(--accent-primary)",
            }}
          >
            Back to forms
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 top-6 z-50">
          <div
            className={`flex min-w-[280px] items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg dark:bg-gray-900 ${
              toast.type === "success"
                ? "border-gray-200 dark:border-gray-700"
                : "border-red-200 dark:border-red-800"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2
                size={19}
                className="shrink-0 text-green-600"
              />
            ) : (
              <X
                size={19}
                className="shrink-0 text-red-600"
              />
            )}

            <p className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">
              {toast.message}
            </p>

            <button
              onClick={() =>
                setToast(null)
              }
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">

        <div className="flex h-16 items-center justify-between px-5 sm:px-6">

          {/* Left */}
          <div className="flex items-center gap-4">

            <button
              onClick={() => {
                window.location.href =
                  "/";
              }}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft size={18} />
              <span>Forms</span>
            </button>

            <div className="hidden h-5 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

            <div className="hidden max-w-[300px] truncate text-sm font-semibold text-gray-900 dark:text-gray-100 sm:block">
              {form.title}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">

            {/* Theme */}
            <div className="relative">
              <button
                onClick={() =>
                  setThemeOpen(
                    (current) =>
                      !current
                  )
                }
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Theme settings"
                aria-expanded={themeOpen}
              >
                <Palette size={16} />
                <span className="hidden sm:inline">
                  Theme
                </span>
              </button>

              {themeOpen && (
                <div className="absolute right-0 top-12 z-40 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">

                  <p className="text-sm font-semibold">
                    Appearance
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Choose how the builder looks.
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2">

                    <button
                      onClick={() =>
                        setMode("light")
                      }
                      className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                        mode === "light"
                          ? "border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-800"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Sun size={18} />
                      Light
                    </button>

                    <button
                      onClick={() =>
                        setMode("dark")
                      }
                      className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                        mode === "dark"
                          ? "border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-800"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Moon size={18} />
                      Dark
                    </button>

                    <button
                      onClick={() =>
                        setMode("system")
                      }
                      className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                        mode === "system"
                          ? "border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-800"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Monitor size={18} />
                      System
                    </button>
                  </div>

                  <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">

                    <p className="text-sm font-semibold">
                      Accent
                    </p>

                    <div className="mt-3 space-y-2">

                      <button
                        onClick={() =>
                          setAccent(
                            "minimal"
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                          accent === "minimal"
                            ? "border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800"
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            Minimal
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Clean black and white
                          </p>
                        </div>

                        {accent ===
                          "minimal" && (
                          <Check
                            size={16}
                          />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          setAccent(
                            "ocean"
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                          accent === "ocean"
                            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            Ocean
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Cool blue accent
                          </p>
                        </div>

                        {accent ===
                          "ocean" && (
                          <Check
                            size={16}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          setAccent(
                            "lavender"
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                          accent === "lavender"
                            ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-950"
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            Lavender
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Soft purple accent
                          </p>
                        </div>

                        {accent ===
                          "lavender" && (
                          <Check
                            size={16}
                            className="text-purple-600 dark:text-purple-400"
                          />
                        )}
                      </button>

                      <button
                        onClick={() =>
                          setAccent(
                            "sunset"
                          )
                        }
                        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${
                          accent === "sunset"
                            ? "border-orange-500 bg-orange-50 dark:border-orange-400 dark:bg-orange-950"
                            : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            Sunset
                          </p>

                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Warm orange accent
                          </p>
                        </div>

                        {accent ===
                          "sunset" && (
                          <Check
                            size={16}
                            className="text-orange-600 dark:text-orange-400"
                          />
                        )}
                      </button>

                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            <button
              onClick={openResults}
              className="hidden items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 md:flex"
            >
              <BarChart3 size={16} />
              Results
            </button>

            {/* Publish */}
            <button
              onClick={handlePublish}
              disabled={publishing}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                form.is_published
                  ? "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  : "text-white hover:opacity-90"
              }`}
              style={
                form.is_published
                  ? undefined
                  : {
                      backgroundColor:
                        "var(--accent-primary)",
                    }
              }
            >
              {form.is_published ? (
                <>
                  <Check size={16} />
                  Published
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  Publish
                </>
              )}
            </button>

            {/* Save */}
            <button
              onClick={saveForm}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {saveStatus === "saved" ? (
                <Check
                  size={16}
                  className="text-green-600"
                />
              ) : (
                <Save size={16} />
              )}

              {saving
                ? "Saving..."
                : saveStatus === "saved"
                ? "Saved"
                : saveStatus === "error"
                ? "Retry"
                : "Save"}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">

          {/* Builder */}
          <section>

            {/* Form information */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">

              <input
                value={form.title}
                onChange={(event) =>
                  handleFormTitleChange(
                    event.target.value
                  )
                }
                className="w-full border-none bg-transparent text-3xl font-bold tracking-tight text-gray-900 outline-none placeholder:text-gray-300 dark:text-gray-100 dark:placeholder:text-gray-600 sm:text-4xl"
                placeholder="Form title"
              />

              <textarea
                value={
                  form.description || ""
                }
                onChange={(event) =>
                  handleFormDescriptionChange(
                    event.target.value
                  )
                }
                className="mt-3 w-full resize-none border-none bg-transparent text-gray-500 outline-none placeholder:text-gray-300 dark:text-gray-400 dark:placeholder:text-gray-600"
                placeholder="Add a description..."
                rows={2}
              />
            </div>

            {/* Published link */}
            {form.is_published &&
              form.public_slug && (
                <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Public form
                    </p>

                    <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
                      {window.location.origin}
                      /form/
                      {form.public_slug}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">

                    <button
                      onClick={
                        copyPublicLink
                      }
                      className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <Copy size={14} />
                      Copy link
                    </button>

                    <button
                      onClick={
                        openPublicForm
                      }
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                      style={{
                        backgroundColor:
                          "var(--accent-primary)",
                      }}
                    >
                      <Eye size={14} />
                      Open
                    </button>
                  </div>
                </div>
              )}

            {/* Questions */}
            <DndContext
              collisionDetection={
                closestCenter
              }
              onDragEnd={
                handleDragEnd
              }
            >
              <SortableContext
                items={questions.map(
                  (question) =>
                    question.id
                )}
                strategy={
                  verticalListSortingStrategy
                }
              >
                <div className="space-y-5">
                  {questions.map(
                    (
                      question,
                      index
                    ) => (
                      <SortableQuestionCard
                        key={question.id}
                        question={
                          question
                        }
                        index={index}
                        onChange={
                          changeQuestion
                        }
                        onSave={
                          saveQuestion
                        }
                        onDelete={
                          removeQuestion
                        }
                        onAddOption={
                          addOption
                        }
                        onChangeOption={
                          changeOption
                        }
                        onDeleteOption={
                          deleteOption
                        }
                      />
                    )
                  )}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add question */}
            <button
              onClick={addQuestion}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white py-5 text-sm font-semibold text-gray-600 transition hover:border-gray-900 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-white dark:hover:text-white"
            >
              <Plus size={18} />
              Add question
            </button>
          </section>

          {/* Logic Jumps */}
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Logic jumps
                </p>

                <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">
                  Make your form adaptive
                </h2>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                  Send respondents to a later question when their answer matches a condition.
                </p>
              </div>

              <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {logicRules.length}{" "}
                {logicRules.length === 1
                  ? "rule"
                  : "rules"}
              </div>
            </div>


            {/* Create rule */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">

              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Add a logic jump
              </p>

              <div className="mt-4 grid gap-3">

                {/* Source */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    When this question is answered
                  </label>

                  <select
                    value={logicSourceId}
                    onChange={(event) =>
                      handleLogicSourceChange(
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-white"
                  >
                    <option value="">
                      Select source question
                    </option>

                    {questions.map(
                      (question, index) => (
                        <option
                          key={question.id}
                          value={question.id}
                        >
                          Q{index + 1}:{" "}
                          {question.title ||
                            "Untitled question"}
                        </option>
                      )
                    )}
                  </select>
                </div>


                {/* Operator */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Condition
                  </label>

                  <select
                    value={logicOperator}
                    onChange={(event) => {
                      setLogicOperator(
                        event.target.value
                      );
                      setLogicValue("");
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-white"
                  >
                    <option value="equals">
                      Equals
                    </option>

                    <option value="not_equals">
                      Does not equal
                    </option>

                    <option value="contains">
                      Contains
                    </option>

                    <option value="greater_than">
                      Greater than
                    </option>

                    <option value="less_than">
                      Less than
                    </option>

                    <option value="is_empty">
                      Is empty
                    </option>

                    <option value="is_not_empty">
                      Is not empty
                    </option>
                  </select>
                </div>


                {/* Value */}
                {logicOperator !== "is_empty" &&
                  logicOperator !== "is_not_empty" && (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                        Answer value
                      </label>

                      {getLogicValueOptions().length > 0 ? (
                        <select
                          value={logicValue}
                          onChange={(event) =>
                            setLogicValue(
                              event.target.value
                            )
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-white"
                        >
                          <option value="">
                            Select answer
                          </option>

                          {getLogicValueOptions().map(
                            (option, index) => (
                              <option
                                key={`${option}-${index}`}
                                value={option}
                              >
                                {option}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <input
                          value={logicValue}
                          onChange={(event) =>
                            setLogicValue(
                              event.target.value
                            )
                          }
                          placeholder="Enter answer value"
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-white"
                        />
                      )}
                    </div>
                  )}


                {/* Target */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Then jump to
                  </label>

                  <select
                    value={logicTargetId}
                    onChange={(event) =>
                      setLogicTargetId(
                        event.target.value === ""
                          ? ""
                          : Number(
                              event.target.value
                            )
                      )
                    }
                    disabled={
                      logicSourceId === ""
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:focus:border-white"
                  >
                    <option value="">
                      Select target question
                    </option>

                    {getAvailableTargets().map(
                      (question) => {
                        const index =
                          questions.findIndex(
                            (item) =>
                              item.id ===
                              question.id
                          );

                        return (
                          <option
                            key={question.id}
                            value={question.id}
                          >
                            Q{index + 1}:{" "}
                            {question.title ||
                              "Untitled question"}
                          </option>
                        );
                      }
                    )}
                  </select>

                  {logicSourceId !== "" &&
                    getAvailableTargets().length ===
                      0 && (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        The source question needs a later question to jump to.
                      </p>
                    )}
                </div>


                <button
                  type="button"
                  onClick={
                    handleCreateLogicRule
                  }
                  disabled={
                    logicSaving ||
                    logicSourceId === "" ||
                    logicTargetId === ""
                  }
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    backgroundColor:
                      "var(--accent-primary)",
                  }}
                >
                  <Plus size={16} />

                  {logicSaving
                    ? "Adding..."
                    : "Add logic jump"}
                </button>

              </div>
            </div>


            {/* Existing rules */}
            {logicRules.length > 0 && (
              <div className="mt-5 space-y-3">

                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Active rules
                </p>

                {logicRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {getQuestionLabel(
                          rule.source_question_id
                        )}
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {rule.operator ===
                        "equals"
                          ? "equals"
                          : rule.operator ===
                            "not_equals"
                          ? "does not equal"
                          : rule.operator ===
                            "contains"
                          ? "contains"
                          : rule.operator ===
                            "greater_than"
                          ? "is greater than"
                          : rule.operator ===
                            "less_than"
                          ? "is less than"
                          : rule.operator ===
                            "is_empty"
                          ? "is empty"
                          : "is not empty"}

                        {rule.operator !==
                          "is_empty" &&
                          rule.operator !==
                            "is_not_empty" && (
                            <>
                              {" "}
                              <span className="font-semibold text-gray-700 dark:text-gray-200">
                                "{rule.value}"
                              </span>
                            </>
                          )}

                        {" → "}

                        <span className="font-semibold text-gray-700 dark:text-gray-200">
                          {getQuestionLabel(
                            rule.target_question_id
                          )}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteLogicRule(
                          rule.id
                        )
                      }
                      className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-800 dark:hover:bg-red-950"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>

                  </div>
                ))}

              </div>
            )}


            {logicRules.length === 0 && (
              <div className="mt-5 rounded-xl border border-dashed border-gray-200 p-5 text-center dark:border-gray-700">
                <p className="text-sm text-gray-400">
                  No logic jumps yet.
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Add one above to create branching paths.
                </p>
              </div>
            )}

          </section>


          {/* Live preview */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

              {/* Preview header */}
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">

                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  Live preview
                </h2>

                <button
                  onClick={
                    openPublicForm
                  }
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  title="Open public form"
                >
                  <Eye size={17} />
                </button>
              </div>

              {/* Preview content */}
              <div className="min-h-[520px] p-6 sm:p-8">

                <div className="mb-8">

                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {form.title ||
                      "Untitled form"}
                  </h1>

                  {form.description && (
                    <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                      {form.description}
                    </p>
                  )}
                </div>

                {questions.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
                    <p className="text-sm text-gray-400">
                      Add a question to see the preview.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-7">

                    {questions.map(
                      (question) => (
                        <div
                          key={
                            question.id
                          }
                        >

                          <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {question.title ||
                              "Untitled question"}

                            {question.required && (
                              <span className="ml-1 text-red-500">
                                *
                              </span>
                            )}
                          </label>

                          {question.description && (
                            <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                              {
                                question.description
                              }
                            </p>
                          )}

                          {/* Long text */}
                          {question.type ===
                          "long_text" ? (
                            <textarea
                              className="mt-3 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                              placeholder="Your answer..."
                              rows={4}
                              disabled
                            />
                          ) : question.type ===
                            "yes_no" ? (

                            <div className="mt-3 flex gap-2">
                              <button
                                disabled
                                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium dark:border-gray-700 dark:bg-gray-800"
                              >
                                Yes
                              </button>

                              <button
                                disabled
                                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium dark:border-gray-700 dark:bg-gray-800"
                              >
                                No
                              </button>
                            </div>

                          ) : question.type ===
                            "rating" ? (

                            <div className="mt-3 flex gap-2">
                              {[
                                1,
                                2,
                                3,
                                4,
                                5,
                              ].map(
                                (rating) => (
                                  <button
                                    key={
                                      rating
                                    }
                                    disabled
                                    className="h-10 w-10 rounded-lg border border-gray-200 text-sm font-medium dark:border-gray-700 dark:bg-gray-800"
                                  >
                                    {
                                      rating
                                    }
                                  </button>
                                )
                              )}
                            </div>

                          ) : question.type ===
                            "multiple_choice" ? (

                            <div className="mt-3 space-y-2">
                              {(
                                question.options ||
                                []
                              ).map(
                                (
                                  option,
                                  optionIndex
                                ) => (
                                  <div
                                    key={
                                      optionIndex
                                    }
                                    className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
                                  >
                                    <span className="h-4 w-4 rounded-full border-2 border-gray-300 dark:border-gray-600" />

                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      {option ||
                                        `Option ${
                                          optionIndex +
                                          1
                                        }`}
                                    </span>
                                  </div>
                                )
                              )}

                              {(
                                question.options ||
                                []
                              ).length ===
                                0 && (
                                <p className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-400 dark:border-gray-700">
                                  Add options in the builder.
                                </p>
                              )}
                            </div>

                          ) : question.type ===
                            "dropdown" ? (

                            <div className="relative mt-3">
                              <select
                                disabled
                                className="w-full appearance-none rounded-xl border border-gray-200 bg-white p-3 pr-10 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                defaultValue=""
                              >
                                <option value="">
                                  Select an option
                                </option>

                                {(
                                  question.options ||
                                  []
                                ).map(
                                  (
                                    option,
                                    optionIndex
                                  ) => (
                                    <option
                                      key={
                                        optionIndex
                                      }
                                      value={
                                        option
                                      }
                                    >
                                      {
                                        option
                                      }
                                    </option>
                                  )
                                )}
                              </select>

                              <ChevronDown
                                size={16}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                              />
                            </div>

                          ) : (

                            <input
                              type={
                                question.type ===
                                "email"
                                  ? "email"
                                  : question.type ===
                                    "number"
                                  ? "number"
                                  : "text"
                              }
                              className="mt-3 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                              placeholder="Your answer..."
                              disabled
                            />
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Preview footer */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
              <span>Powered by</span>

              <span className="font-semibold text-gray-600 dark:text-gray-300">
                Typeform Clone
              </span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}