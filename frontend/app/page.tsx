"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  MoreHorizontal,
  Copy,
  Trash2,
  Pencil,
  ExternalLink,
  BarChart3,
  X,
  CheckCircle2,
  AlertCircle,
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
} from "lucide-react";

import {
  getForms,
  createForm,
  deleteForm,
  duplicateForm,
  togglePublish,
  Form,
} from "../lib/api";

import { useTheme } from "../components/ThemeProvider";

type ToastType = "success" | "error";

type Toast = {
  message: string;
  type: ToastType;
};

export default function Home() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [themeOpen, setThemeOpen] = useState(false);

  const { mode, accent, setMode, setAccent } = useTheme();

  function showToast(
    message: string,
    type: ToastType = "success"
  ) {
    setToast({
      message,
      type,
    });

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  async function loadForms() {
    try {
      const data = await getForms();
      setForms(data);
    } catch (error) {
      console.error("Failed to load forms:", error);
      showToast("Failed to load forms.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForms();
  }, []);

  async function handleCreate() {
    try {
      const form = await createForm("Untitled form");

      window.location.href = `/builder/${form.id}`;
    } catch (error) {
      console.error("Failed to create form:", error);
      showToast("Failed to create form.", "error");
    }
  }

  async function handleDelete() {
    if (deleteId === null) {
      return;
    }

    const id = deleteId;

    setActionLoading(id);

    try {
      await deleteForm(id);

      setForms((current) =>
        current.filter((form) => form.id !== id)
      );

      setDeleteId(null);

      showToast("Form deleted successfully.");
    } catch (error) {
      console.error("Failed to delete form:", error);
      showToast("Failed to delete form.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDuplicate(id: number) {
    setActionLoading(id);

    try {
      const duplicate = await duplicateForm(id);

      await loadForms();

      showToast(
        `"${duplicate.title}" created successfully.`
      );
    } catch (error) {
      console.error("Failed to duplicate form:", error);
      showToast("Failed to duplicate form.", "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePublish(id: number) {
    setActionLoading(id);

    try {
      const result = await togglePublish(id);

      setForms((current) =>
        current.map((form) =>
          form.id === id
            ? {
                ...form,
                is_published: result.is_published,
                public_slug: result.public_slug,
              }
            : form
        )
      );

      showToast(
        result.is_published
          ? "Form published successfully."
          : "Form unpublished successfully."
      );
    } catch (error) {
      console.error(
        "Failed to update publish status:",
        error
      );

      showToast(
        "Failed to update publish status.",
        "error"
      );
    } finally {
      setActionLoading(null);
    }
  }

  function handleEdit(id: number) {
    window.location.href = `/builder/${id}`;
  }

  function handleResponses(id: number) {
    window.location.href = `/results/${id}`;
  }

  function handleOpen(slug: string) {
    window.open(`/form/${slug}`, "_blank");
  }

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-900 transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">

      {/* Toast notification */}
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
                size={20}
                className="shrink-0 text-green-600"
              />
            ) : (
              <AlertCircle
                size={20}
                className="shrink-0 text-red-600"
              />
            )}

            <p className="flex-1 text-sm font-medium">
              {toast.message}
            </p>

            <button
              onClick={() => setToast(null)}
              className="text-gray-400 transition hover:text-gray-700 dark:hover:text-gray-200"
              aria-label="Close notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 px-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-900">

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Delete form?
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  This action cannot be undone. All questions
                  and responses associated with this form will
                  be deleted.
                </p>
              </div>

              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close delete dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteId}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading === deleteId
                  ? "Deleting..."
                  : "Delete form"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Forms
            </h1>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create and manage your forms
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* Theme settings */}
            <div className="relative">
              <button
                onClick={() =>
                  setThemeOpen((current) => !current)
                }
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
                aria-label="Theme settings"
                aria-expanded={themeOpen}
              >
                <Palette size={17} />
                Theme
              </button>

              {themeOpen && (
                <div className="absolute right-0 top-14 z-30 w-72 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-900">

                  {/* Appearance */}
                  <div>
                    <p className="text-sm font-semibold">
                      Appearance
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Choose how the application looks.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">

                    {/* Light */}
                    <button
                      onClick={() => setMode("light")}
                      className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                        mode === "light"
                          ? "border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-800"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Sun size={18} />
                      Light
                    </button>

                    {/* Dark */}
                    <button
                      onClick={() => setMode("dark")}
                      className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                        mode === "dark"
                          ? "border-gray-900 bg-gray-100 dark:border-white dark:bg-gray-800"
                          : "border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Moon size={18} />
                      Dark
                    </button>

                    {/* System */}
                    <button
                      onClick={() => setMode("system")}
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

                  {/* Accent */}
                  <div className="mt-5 border-t border-gray-200 pt-4 dark:border-gray-700">

                    <p className="text-sm font-semibold">
                      Accent
                    </p>

                    <div className="mt-3 space-y-2">

                      {/* Minimal */}
                      <button
                        onClick={() =>
                          setAccent("minimal")
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

                        {accent === "minimal" && (
                          <Check size={16} />
                        )}
                      </button>

                      {/* Ocean */}
                      <button
                        onClick={() =>
                          setAccent("ocean")
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

                        {accent === "ocean" && (
                          <Check
                            size={16}
                            className="text-blue-600 dark:text-blue-400"
                          />
                        )}
                      </button>

                      {/* Lavender */}
                      <button
                        onClick={() =>
                          setAccent("lavender")
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

                        {accent === "lavender" && (
                          <Check
                            size={16}
                            className="text-purple-600 dark:text-purple-400"
                          />
                        )}
                      </button>

                      {/* Sunset */}
                      <button
                        onClick={() =>
                          setAccent("sunset")
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

                        {accent === "sunset" && (
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

            {/* Create form */}
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor:
                  "var(--accent-primary)",
              }}
            >
              <Plus size={18} />
              Create form
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <section className="mx-auto max-w-6xl px-6 py-10">

        {/* Loading */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-black dark:border-gray-700 dark:border-t-white" />

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Loading forms...
            </p>
          </div>
        ) : forms.length === 0 ? (

          /* Empty state */
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center dark:border-gray-700 dark:bg-gray-900">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <Plus
                size={24}
                className="text-gray-500"
              />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              No forms yet
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Create your first form to get started.
            </p>

            <button
              onClick={handleCreate}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{
                backgroundColor:
                  "var(--accent-primary)",
              }}
            >
              <Plus size={18} />
              Create your first form
            </button>
          </div>

        ) : (

          /* Form cards */
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {forms.map((form) => {
              const busy =
                actionLoading === form.id;

              return (
                <div
                  key={form.id}
                  className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >

                  {/* Card header */}
                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">
                        {form.title ||
                          "Untitled form"}
                      </h2>

                      <p className="mt-1 line-clamp-2 min-h-[40px] text-sm text-gray-500 dark:text-gray-400">
                        {form.description ||
                          "No description"}
                      </p>
                    </div>

                    <MoreHorizontal
                      size={20}
                      className="shrink-0 text-gray-400"
                    />
                  </div>

                  {/* Status */}
                  <div className="mt-5 flex items-center gap-2">

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        form.is_published
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {form.is_published
                        ? "Published"
                        : "Draft"}
                    </span>

                    <span className="text-xs text-gray-400">
                      {form.response_count}{" "}
                      {form.response_count === 1
                        ? "response"
                        : "responses"}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-wrap gap-2">

                    {/* Edit */}
                    <button
                      onClick={() =>
                        handleEdit(form.id)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    {/* Responses */}
                    <button
                      onClick={() =>
                        handleResponses(form.id)
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <BarChart3 size={14} />
                      Responses
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() =>
                        handleDuplicate(form.id)
                      }
                      disabled={busy}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <Copy size={14} />

                      {busy
                        ? "Working..."
                        : "Duplicate"}
                    </button>

                    {/* Publish / Unpublish */}
                    <button
                      onClick={() =>
                        handlePublish(form.id)
                      }
                      disabled={busy}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      {form.is_published
                        ? "Unpublish"
                        : "Publish"}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() =>
                        setDeleteId(form.id)
                      }
                      disabled={busy}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:hover:bg-red-950"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>

                    {/* Open public form */}
                    {form.is_published &&
                      form.public_slug && (
                        <button
                          onClick={() =>
                            handleOpen(
                              form.public_slug!
                            )
                          }
                          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          <ExternalLink size={14} />
                          Open
                        </button>
                      )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}