"use client";

import {
  useEffect,
  useState,
  type KeyboardEvent,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

import {
  getPublicForm,
  submitResponse,
  PublicForm,
  Question,
  LogicRule,
} from "../../../lib/api";


/*
 * =========================================================
 * PUBLIC FORM / RESPONDENT PAGE
 * =========================================================
 *
 * Features:
 * - One question at a time
 * - Required validation
 * - Email validation
 * - Number validation
 * - Keyboard navigation
 * - Progress indicator
 * - Logic jumps
 * - Forward navigation
 * - Correct back navigation after jumps
 * - Response submission
 * - Thank-you screen
 * =========================================================
 */


export default function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {

  /*
   * =======================================================
   * STATE
   * =======================================================
   */

  const [form, setForm] =
    useState<PublicForm | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [currentIndex, setCurrentIndex] =
    useState(0);

  /*
   * Keeps track of the actual questions visited.
   *
   * Example:
   *
   * Q1 -> Q3
   *
   * history = [0, 2]
   *
   * Pressing Back therefore returns to Q1,
   * instead of incorrectly returning to Q2.
   */
  const [navigationHistory, setNavigationHistory] =
    useState<number[]>([0]);

  const [answers, setAnswers] =
    useState<Record<number, string>>({});

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);


  /*
   * =======================================================
   * LOAD PUBLIC FORM
   * =======================================================
   */

  useEffect(() => {

    async function loadForm() {

      try {

        const { slug } =
          await params;

        const data =
          await getPublicForm(slug);

        setForm(data);

        setCurrentIndex(0);

        setNavigationHistory([0]);

      } catch (error) {

        console.error(
          "Failed to load public form:",
          error
        );

      } finally {

        setLoading(false);

      }
    }

    loadForm();

  }, [params]);


  /*
   * =======================================================
   * LOADING SCREEN
   * =======================================================
   */

  if (loading) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <Loader2
            size={28}
            className="mx-auto animate-spin text-gray-400"
          />

          <p className="mt-3 text-sm text-gray-500">
            Loading form...
          </p>

        </div>

      </main>
    );
  }


  /*
   * =======================================================
   * FORM NOT FOUND
   * =======================================================
   */

  if (!form) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">

        <div className="max-w-md text-center">

          <h1 className="text-2xl font-bold text-gray-900">
            Form not found
          </h1>

          <p className="mt-2 text-gray-500">
            This form may not exist or may no longer be published.
          </p>

          <button
            type="button"
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
   * =======================================================
   * THANK YOU SCREEN
   * =======================================================
   */

  if (submitted) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">

        <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-white">
            <Check size={30} />
          </div>

          <h1 className="mt-7 text-3xl font-bold tracking-tight text-gray-900">
            Thank you!
          </h1>

          <p className="mx-auto mt-3 max-w-md text-gray-500">
            Your response has been successfully submitted.
          </p>

        </div>

      </main>
    );
  }


  /*
   * =======================================================
   * SORT QUESTIONS
   * =======================================================
   */

  const questions =
    [...form.questions].sort(
      (a, b) =>
        a.position - b.position
    );


  /*
   * =======================================================
   * NO QUESTIONS
   * =======================================================
   */

  if (questions.length === 0) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-6">

        <div className="text-center">

          <h1 className="text-2xl font-bold text-gray-900">
            {form.title}
          </h1>

          <p className="mt-3 text-gray-500">
            This form doesn't have any questions yet.
          </p>

        </div>

      </main>
    );
  }


  /*
   * =======================================================
   * CURRENT QUESTION
   * =======================================================
   */

  const currentQuestion: Question =
    questions[currentIndex];


  /*
   * Safety check in case an invalid index occurs.
   */

  if (!currentQuestion) {

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5]">

        <div className="text-center">

          <h1 className="text-2xl font-bold text-gray-900">
            Something went wrong
          </h1>

          <button
            type="button"
            onClick={() => {
              setCurrentIndex(0);
              setNavigationHistory([0]);
            }}
            className="mt-5 rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Restart form
          </button>

        </div>

      </main>
    );
  }


  const currentAnswer =
    answers[currentQuestion.id] || "";


  /*
   * Progress.
   *
   * This represents the respondent's position
   * in the complete question sequence.
   */

  const progress =
    ((currentIndex + 1) /
      questions.length) *
    100;


  /*
   * =======================================================
   * ANSWER UPDATE
   * =======================================================
   */

  function setAnswer(value: string) {

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: value,
    }));

    setError("");
  }


  /*
   * =======================================================
   * VALIDATE CURRENT QUESTION
   * =======================================================
   */

  function validateQuestion() {

    const value =
      currentAnswer.trim();


    /*
     * Required validation
     */

    if (
      currentQuestion.required &&
      !value
    ) {

      setError(
        "Please answer this question before continuing."
      );

      return false;
    }


    /*
     * Optional empty question is valid.
     */

    if (!value) {
      return true;
    }


    /*
     * Email validation
     */

    if (
      currentQuestion.type === "email"
    ) {

      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (
        !emailPattern.test(value)
      ) {

        setError(
          "Please enter a valid email address."
        );

        return false;
      }
    }


    /*
     * Number validation
     */

    if (
      currentQuestion.type === "number"
    ) {

      if (
        Number.isNaN(
          Number(value)
        )
      ) {

        setError(
          "Please enter a valid number."
        );

        return false;
      }
    }


    return true;
  }


  /*
   * =======================================================
   * LOGIC JUMP SUPPORT
   * =======================================================
   *
   * The backend sends logic_rules with the public form.
   *
   * We intentionally access it safely so this page
   * remains compatible even if an older API response
   * does not contain logic_rules.
   */

  const logicRules: LogicRule[] =
    (
      form as PublicForm & {
        logic_rules?: LogicRule[];
      }
    ).logic_rules || [];


  /*
   * Check whether one rule matches the answer.
   */

  function doesLogicRuleMatch(
    rule: LogicRule,
    answerValue: string
  ): boolean {

    const answer =
      answerValue.trim();

    const ruleValue =
      (rule.value || "").trim();


    switch (rule.operator) {

      /*
       * Exact match
       */

      case "equals":

        return (
          answer === ruleValue
        );


      /*
       * Not equal
       */

      case "not_equals":

        return (
          answer !== ruleValue
        );


      /*
       * Text contains
       */

      case "contains":

        return answer
          .toLowerCase()
          .includes(
            ruleValue.toLowerCase()
          );


      /*
       * Number greater than
       */

      case "greater_than": {

        const answerNumber =
          Number(answer);

        const ruleNumber =
          Number(ruleValue);

        if (
          Number.isNaN(answerNumber) ||
          Number.isNaN(ruleNumber)
        ) {

          return false;
        }

        return (
          answerNumber >
          ruleNumber
        );
      }


      /*
       * Number less than
       */

      case "less_than": {

        const answerNumber =
          Number(answer);

        const ruleNumber =
          Number(ruleValue);

        if (
          Number.isNaN(answerNumber) ||
          Number.isNaN(ruleNumber)
        ) {

          return false;
        }

        return (
          answerNumber <
          ruleNumber
        );
      }


      /*
       * Empty answer
       */

      case "is_empty":

        return (
          answer === ""
        );


      /*
       * Non-empty answer
       */

      case "is_not_empty":

        return (
          answer !== ""
        );


      /*
       * Unknown operator
       */

      default:

        return false;
    }
  }


  /*
   * =======================================================
   * FIND NEXT QUESTION
   * =======================================================
   *
   * Normal behavior:
   *
   * Q1 -> Q2 -> Q3
   *
   * Logic behavior:
   *
   * Q1 --Yes--> Q3
   *
   * If no rule matches, we simply move to the
   * next question.
   */

  function getNextQuestionIndex(
    answerValue: string
  ): number {

    const current =
      questions[currentIndex];


    if (!current) {

      return (
        currentIndex + 1
      );
    }


    /*
     * Find the first matching rule
     * belonging to the current question.
     */

    const matchingRule =
      logicRules.find(
        (rule) =>
          rule.source_question_id ===
            current.id &&
          doesLogicRuleMatch(
            rule,
            answerValue
          )
      );


    /*
     * No matching rule:
     * normal sequential navigation.
     */

    if (!matchingRule) {

      return (
        currentIndex + 1
      );
    }


    /*
     * Find the target question
     * in the sorted question list.
     */

    const targetIndex =
      questions.findIndex(
        (question) =>
          question.id ===
          matchingRule.target_question_id
      );


    /*
     * Invalid/missing target:
     * safely continue normally.
     */

    if (
      targetIndex === -1
    ) {

      return (
        currentIndex + 1
      );
    }


    return targetIndex;
  }


  /*
   * =======================================================
   * NEXT
   * =======================================================
   */

  function handleNext() {

    setError("");


    /*
     * Validate current question first.
     */

    if (!validateQuestion()) {
      return;
    }


    /*
     * Calculate normal or logic-jump destination.
     */

    const nextIndex =
      getNextQuestionIndex(
        currentAnswer
      );


    /*
     * There is another question.
     */

    if (
      nextIndex >= 0 &&
      nextIndex < questions.length
    ) {

      setNavigationHistory(
        (current) => [
          ...current,
          nextIndex,
        ]
      );

      setCurrentIndex(
        nextIndex
      );

      return;
    }


    /*
     * No more questions.
     */

    handleSubmit();
  }


  /*
   * =======================================================
   * BACK
   * =======================================================
   *
   * We use navigation history instead of
   * currentIndex - 1.
   *
   * Example:
   *
   * Q1 -> Q3
   *
   * history = [0, 2]
   *
   * Back removes 2 and returns to 0.
   */

  function handleBack() {

    setError("");


    if (
      navigationHistory.length <= 1
    ) {

      return;
    }


    setNavigationHistory(
      (current) => {

        const previous =
          current.slice(
            0,
            current.length - 1
          );


        const previousIndex =
          previous[
            previous.length - 1
          ];


        setCurrentIndex(
          previousIndex
        );


        return previous;
      }
    );
  }


  /*
   * =======================================================
   * SUBMIT RESPONSE
   * =======================================================
   */

  async function handleSubmit() {

    if (!form) {
      return;
    }


    setError("");


    /*
     * Validate final question.
     */

    if (!validateQuestion()) {
      return;
    }


    setSubmitting(true);


    try {

      /*
       * Submit every answer that the respondent
       * actually provided.
       *
       * Skipped questions are naturally absent.
       */

      const responseAnswers =
        questions
          .filter(
            (question) =>
              answers[
                question.id
              ] !== undefined
          )
          .map(
            (question) => ({
              question_id:
                question.id,

              value:
                answers[
                  question.id
                ] || "",
            })
          );


      await submitResponse(
        form.id,
        responseAnswers
      );


      setSubmitted(true);

    } catch (error) {

      console.error(
        "Failed to submit response:",
        error
      );

      setError(
        "Something went wrong while submitting your response. Please try again."
      );

    } finally {

      setSubmitting(false);
    }
  }


  /*
   * =======================================================
   * KEYBOARD NAVIGATION
   * =======================================================
   */

  function handleKeyDown(
    event: KeyboardEvent
  ) {

    /*
     * Enter continues for all inputs
     * except long text.
     */

    if (
      event.key === "Enter" &&
      currentQuestion.type !==
        "long_text"
    ) {

      event.preventDefault();

      handleNext();
    }
  }


  /*
   * =======================================================
   * ANSWER INPUTS
   * =======================================================
   */

  function renderAnswerInput() {


    /*
     * -------------------------------------------------------
     * LONG TEXT
     * -------------------------------------------------------
     */

    if (
      currentQuestion.type ===
      "long_text"
    ) {

      return (
        <textarea
          autoFocus
          value={currentAnswer}
          onChange={(event) =>
            setAnswer(
              event.target.value
            )
          }
          onKeyDown={handleKeyDown}
          placeholder="Type your answer..."
          rows={6}
          className="w-full resize-none rounded-2xl border border-gray-300 bg-white px-5 py-4 text-lg outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100"
        />
      );
    }


    /*
     * -------------------------------------------------------
     * MULTIPLE CHOICE
     * -------------------------------------------------------
     */

    if (
      currentQuestion.type ===
      "multiple_choice"
    ) {

      return (
        <div className="space-y-3">

          {(
            currentQuestion.options ||
            []
          ).map(
            (
              option,
              index
            ) => {

              const selected =
                currentAnswer ===
                option;


              return (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setAnswer(
                      option
                    )
                  }
                  className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left text-lg transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white hover:border-black"
                  }`}
                >

                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? "border-white"
                        : "border-gray-400"
                    }`}
                  >

                    {selected && (
                      <span className="h-3 w-3 rounded-full bg-white" />
                    )}

                  </span>


                  <span>
                    {option ||
                      `Option ${
                        index + 1
                      }`}
                  </span>

                </button>
              );
            }
          )}

        </div>
      );
    }


    /*
     * -------------------------------------------------------
     * DROPDOWN
     * -------------------------------------------------------
     */

    if (
      currentQuestion.type ===
      "dropdown"
    ) {

      return (
        <select
          autoFocus
          value={currentAnswer}
          onChange={(event) =>
            setAnswer(
              event.target.value
            )
          }
          onKeyDown={handleKeyDown}
          className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-lg outline-none transition focus:border-black"
        >

          <option value="">
            Select an option
          </option>


          {(
            currentQuestion.options ||
            []
          ).map(
            (
              option,
              index
            ) => (

              <option
                key={index}
                value={option}
              >
                {option ||
                  `Option ${
                    index + 1
                  }`}
              </option>

            )
          )}

        </select>
      );
    }


    /*
     * -------------------------------------------------------
     * YES / NO
     * -------------------------------------------------------
     */

    if (
      currentQuestion.type ===
      "yes_no"
    ) {

      return (
        <div className="flex gap-4">

          {[
            "Yes",
            "No",
          ].map(
            (option) => {

              const selected =
                currentAnswer ===
                option;


              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setAnswer(
                      option
                    )
                  }
                  className={`min-w-32 rounded-2xl border px-8 py-4 text-lg font-medium transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white hover:border-black"
                  }`}
                >
                  {option}
                </button>
              );
            }
          )}

        </div>
      );
    }


    /*
     * -------------------------------------------------------
     * RATING
     * -------------------------------------------------------
     */

    if (
      currentQuestion.type ===
      "rating"
    ) {

      return (
        <div className="flex flex-wrap gap-3">

          {[
            1,
            2,
            3,
            4,
            5,
          ].map(
            (rating) => {

              const value =
                String(rating);

              const selected =
                currentAnswer ===
                value;


              return (
                <button
                  key={rating}
                  type="button"
                  onClick={() =>
                    setAnswer(
                      value
                    )
                  }
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-lg font-semibold transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-gray-300 bg-white hover:border-black"
                  }`}
                >
                  {rating}
                </button>
              );
            }
          )}

        </div>
      );
    }


    /*
     * -------------------------------------------------------
     * EMAIL
     * -------------------------------------------------------
     */

    if (
      currentQuestion.type ===
      "email"
    ) {

      return (
        <input
          autoFocus
          type="email"
          value={currentAnswer}
          onChange={(event) =>
            setAnswer(
              event.target.value
            )
          }
          onKeyDown={handleKeyDown}
          placeholder="name@example.com"
          className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-lg outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100"
        />
      );
    }


    /*
     * -------------------------------------------------------
     * NUMBER
     * -------------------------------------------------------
     */

    if (
      currentQuestion.type ===
      "number"
    ) {

      return (
        <input
          autoFocus
          type="number"
          value={currentAnswer}
          onChange={(event) =>
            setAnswer(
              event.target.value
            )
          }
          onKeyDown={handleKeyDown}
          placeholder="Enter a number"
          className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-lg outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100"
        />
      );
    }


    /*
     * -------------------------------------------------------
     * SHORT TEXT
     * -------------------------------------------------------
     */

    return (
      <input
        autoFocus
        type="text"
        value={currentAnswer}
        onChange={(event) =>
          setAnswer(
            event.target.value
          )
        }
        onKeyDown={handleKeyDown}
        placeholder="Type your answer..."
        className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-4 text-lg outline-none transition focus:border-black focus:ring-2 focus:ring-gray-100"
      />
    );
  }


  /*
   * =======================================================
   * PAGE
   * =======================================================
   */

  return (
    <main className="min-h-screen bg-[#f7f7f5]">


      {/* =================================================
          PROGRESS BAR
          ================================================= */}

      <div className="fixed left-0 right-0 top-0 z-30 h-1 bg-gray-200">

        <div
          className="h-full bg-black transition-all duration-500"
          style={{
            width: `${progress}%`,
          }}
        />

      </div>


      {/* =================================================
          HEADER
          ================================================= */}

      <header className="border-b border-gray-200 bg-white">

        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">

          <div>

            <p className="text-sm font-semibold text-gray-900">
              {form.title}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              {currentIndex + 1} of{" "}
              {questions.length}
            </p>

          </div>

        </div>

      </header>


      {/* =================================================
          MAIN QUESTION
          ================================================= */}

      <section className="mx-auto flex min-h-[calc(100vh-81px)] max-w-4xl items-center px-6 py-16">

        <div className="w-full">


          {/* Question number */}

          <div className="mb-5 text-sm font-semibold text-gray-400">

            Question{" "}
            {currentIndex + 1}

            <span className="mx-2">
              ·
            </span>

            {currentIndex + 1}/
            {questions.length}

          </div>


          {/* Question content */}

          <div
            key={currentQuestion.id}
            className="animate-[fadeIn_0.3s_ease-out]"
          >


            {/* Question title */}

            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-gray-900 md:text-5xl">

              {currentQuestion.title}

              {currentQuestion.required && (
                <span className="ml-2 text-gray-400">
                  *
                </span>
              )}

            </h1>


            {/* Description */}

            {currentQuestion.description && (

              <p className="mt-4 max-w-2xl text-lg text-gray-500">

                {currentQuestion.description}

              </p>

            )}


            {/* Answer input */}

            <div className="mt-10 max-w-2xl">

              {renderAnswerInput()}

            </div>


            {/* Error */}

            {error && (

              <p className="mt-4 text-sm font-medium text-red-600">

                {error}

              </p>

            )}


            {/* =================================================
                NAVIGATION
                ================================================= */}

            <div className="mt-8 flex items-center gap-3">


              {/* Back */}

              {navigationHistory.length > 1 && (

                <button
                  type="button"
                  onClick={
                    handleBack
                  }
                  disabled={
                    submitting
                  }
                  className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-black hover:text-black disabled:opacity-50"
                >

                  <ArrowLeft
                    size={17}
                  />

                  Back

                </button>

              )}


              {/* Next / Submit */}

              <button
                type="button"
                onClick={
                  handleNext
                }
                disabled={
                  submitting
                }
                className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {submitting ? (

                  <>

                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Submitting...

                  </>

                ) : currentIndex ===
                  questions.length - 1 ? (

                  <>

                    Submit

                    <Check
                      size={17}
                    />

                  </>

                ) : (

                  <>

                    Next

                    <ArrowRight
                      size={17}
                    />

                  </>

                )}

              </button>

            </div>


            {/* Keyboard hint */}

            <p className="mt-5 text-xs text-gray-400">

              Press Enter ↵ to continue

            </p>

          </div>

        </div>

      </section>

    </main>
  );
}