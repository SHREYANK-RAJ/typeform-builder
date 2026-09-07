"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  RefreshCw,
} from "lucide-react";

import {
  getForm,
  getQuestions,
  getResponses,
  Form,
  Question,
  FormResponse,
} from "../../../lib/api";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [form, setForm] = useState<Form | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);

  const [responses, setResponses] = useState<FormResponse[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [expandedResponse, setExpandedResponse] =
    useState<number | null>(null);

  /*
   * Load results
   */
  async function loadResults(showRefreshing = false) {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { id } = await params;

      const formId = Number(id);

      if (Number.isNaN(formId)) {
        throw new Error("Invalid form ID");
      }

      const [
        formData,
        questionData,
        responseData,
      ] = await Promise.all([
        getForm(formId),
        getQuestions(formId),
        getResponses(formId),
      ]);

      setForm(formData);

      setQuestions(
        [...questionData].sort(
          (a, b) => a.position - b.position
        )
      );

      setResponses(responseData);
    } catch (error) {
      console.error(
        "Failed to load results:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
   * Initial load
   */
  useEffect(() => {
    loadResults();
  }, []);

  /*
   * Format date
   */
  function formatDate(date: string) {
    return new Date(date.endsWith("Z") ? date : `${date}Z`).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  /*
   * Expand/collapse response
   */
  function toggleResponse(
    responseId: number
  ) {
    setExpandedResponse(
      (current) =>
        current === responseId
          ? null
          : responseId
    );
  }

  /*
   * Count selected option
   */
  function getOptionCount(
    questionId: number,
    option: string
  ) {
    let count = 0;

    for (const response of responses) {
      const answer =
        response.answers.find(
          (item) =>
            item.question_id ===
            questionId
        );

      if (answer?.value === option) {
        count++;
      }
    }

    return count;
  }

  /*
   * Export responses as CSV
   */
  function exportCSV() {
    if (!form || responses.length === 0) {
      return;
    }

    const headers = [
      "Response",
      "Submitted At",
      ...questions.map(
        (question) => question.title
      ),
    ];

    const rows = responses.map(
      (response, index) => {
        return [
          `Response #${index + 1}`,
          formatDate(
            response.submitted_at
          ),
          ...questions.map(
            (question) => {
              const answer =
                response.answers.find(
                  (item) =>
                    item.question_id ===
                    question.id
                );

              return answer?.value || "";
            }
          ),
        ];
      }
    );

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const escaped = String(
              value
            ).replace(/"/g, '""');

            return `"${escaped}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob(
      [csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `${form.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_responses.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /*
   * Loading state
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-gray-400"
          />

          <p className="mt-4 text-sm text-gray-500">
            Loading responses...
          </p>
        </div>
      </main>
    );
  }

  /*
   * Form not found
   */
  if (!form) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Form not found
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            We couldn't find this form.
          </p>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Back to forms
          </button>
        </div>
      </main>
    );
  }

  /*
   * Questions that support statistics
   */
  const choiceQuestions =
    questions.filter(
      (question) =>
        question.type ===
          "multiple_choice" ||
        question.type ===
          "dropdown"
    );

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-gray-900">

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          {/* Back */}
          <button
            onClick={() => {
              window.location.href =
                "/";
            }}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-black"
          >
            <ArrowLeft size={18} />
            Forms
          </button>

          {/* Header actions */}
          <div className="flex items-center gap-2">

            <button
              onClick={() =>
                loadResults(true)
              }
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              onClick={exportCSV}
              disabled={
                responses.length === 0
              }
              className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={16} />

              Export CSV
            </button>

          </div>

        </div>

      </header>


      {/* Main */}
      <section className="mx-auto max-w-6xl px-6 py-10">

        {/* Heading */}
        <div className="mb-8">

          <div className="flex items-start justify-between gap-6">

            <div>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <BarChart3 size={17} />

                <span>
                  Results
                </span>
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
                {form.title}
              </h1>

              {form.description && (
                <p className="mt-2 max-w-2xl text-gray-500">
                  {form.description}
                </p>
              )}

            </div>

          </div>


          {/* Summary cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Total responses
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {responses.length}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Submitted responses
              </p>

            </div>


            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Questions
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900">
                {questions.length}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Questions in this form
              </p>

            </div>

          </div>

        </div>


        {/* Statistics */}
        {responses.length > 0 &&
          choiceQuestions.length > 0 && (

            <section className="mb-10">

              <div className="mb-5 flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black text-white">
                  <BarChart3 size={18} />
                </div>

                <div>
                  <h2 className="text-xl font-bold">
                    Statistics
                  </h2>

                  <p className="text-sm text-gray-400">
                    Response distribution
                  </p>
                </div>

              </div>


              <div className="grid gap-5 md:grid-cols-2">

                {choiceQuestions.map(
                  (question) => (

                    <div
                      key={question.id}
                      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div>

                          <h3 className="font-semibold text-gray-900">
                            {question.title}
                          </h3>

                          <p className="mt-1 text-xs text-gray-400">
                            {question.type ===
                            "multiple_choice"
                              ? "Multiple choice"
                              : "Dropdown"}
                          </p>

                        </div>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                          {responses.length}{" "}
                          responses
                        </span>

                      </div>


                      <div className="mt-6 space-y-5">

                        {(question.options ||
                          []).map(
                          (
                            option,
                            optionIndex
                          ) => {

                            const count =
                              getOptionCount(
                                question.id,
                                option
                              );

                            const percentage =
                              responses.length >
                              0
                                ? Math.round(
                                    (count /
                                      responses.length) *
                                      100
                                  )
                                : 0;

                            return (
                              <div
                                key={
                                  optionIndex
                                }
                              >

                                <div className="mb-2 flex items-center justify-between text-sm">

                                  <span className="font-medium text-gray-700">
                                    {option ||
                                      `Option ${
                                        optionIndex +
                                        1
                                      }`}
                                  </span>

                                  <span className="font-semibold text-gray-900">
                                    {count}
                                  </span>

                                </div>


                                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">

                                  <div
                                    className="h-full rounded-full bg-black transition-all duration-500"
                                    style={{
                                      width: `${percentage}%`,
                                    }}
                                  />

                                </div>


                                <div className="mt-1 text-right text-xs text-gray-400">
                                  {percentage}%
                                </div>

                              </div>
                            );
                          }
                        )}

                        {(question.options ||
                          []).length ===
                          0 && (
                          <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-400">
                            No options configured for this question.
                          </p>
                        )}

                      </div>

                    </div>

                  )
                )}

              </div>

            </section>
          )}


        {/* No responses */}
        {responses.length === 0 ? (

          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <BarChart3
                size={26}
                className="text-gray-400"
              />
            </div>

            <h2 className="mt-5 text-xl font-semibold text-gray-900">
              No responses yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Share your form with respondents to start collecting answers.
            </p>

            {form.is_published &&
              form.public_slug && (
                <button
                  onClick={() =>
                    window.open(
                      `/form/${form.public_slug}`,
                      "_blank"
                    )
                  }
                  className="mt-6 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Open public form
                </button>
              )}

          </div>

        ) : (

          /* Individual responses */
          <section>

            <div className="mb-5">

              <h2 className="text-xl font-bold text-gray-900">
                Individual responses
              </h2>

              <p className="mt-1 text-sm text-gray-400">
                Click a response to view all answers.
              </p>

            </div>


            <div className="space-y-4">

              {responses.map(
                (response, index) => {

                  const isExpanded =
                    expandedResponse ===
                    response.id;

                  return (
                    <div
                      key={response.id}
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >

                      {/* Response header */}
                      <button
                        onClick={() =>
                          toggleResponse(
                            response.id
                          )
                        }
                        className="flex w-full items-center justify-between px-6 py-5 text-left transition hover:bg-gray-50"
                      >

                        <div className="flex items-center gap-4">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600">
                            {index + 1}
                          </div>

                          <div>

                            <p className="font-semibold text-gray-900">
                              Response #
                              {index + 1}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              Submitted{" "}
                              {formatDate(
                                response.submitted_at
                              )}
                            </p>

                          </div>

                        </div>


                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">

                          {isExpanded ? (
                            <ChevronUp
                              size={18}
                              className="text-gray-500"
                            />
                          ) : (
                            <ChevronDown
                              size={18}
                              className="text-gray-500"
                            />
                          )}

                        </div>

                      </button>


                      {/* Response details */}
                      {isExpanded && (

                        <div className="border-t border-gray-100 px-6 py-6">

                          <div className="space-y-4">

                            {questions.map(
                              (question) => {

                                const answer =
                                  response.answers.find(
                                    (item) =>
                                      item.question_id ===
                                      question.id
                                  );

                                return (
                                  <div
                                    key={
                                      question.id
                                    }
                                    className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                                  >

                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                      {
                                        question.title
                                      }
                                    </p>

                                    <p className="mt-2 whitespace-pre-wrap text-base font-medium text-gray-900">
                                      {answer?.value ||
                                        "No answer"}
                                    </p>

                                  </div>
                                );
                              }
                            )}

                          </div>

                        </div>

                      )}

                    </div>
                  );
                }
              )}

            </div>

          </section>

        )}

      </section>

    </main>
  );
}