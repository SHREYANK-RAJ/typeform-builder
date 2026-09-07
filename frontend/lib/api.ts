import axios from "axios";


// =========================================================
// API CLIENT
// =========================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


// =========================================================
// FORM TYPES
// =========================================================

export interface Form {
  id: number;
  title: string;
  description: string | null;
  is_published: boolean;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
  response_count: number;
}


// =========================================================
// QUESTION TYPES
// =========================================================

export interface Question {
  id: number;
  form_id: number;
  type: string;
  title: string;
  description: string | null;
  required: boolean;
  options: string[] | null;
  position: number;
}


// =========================================================
// RESPONSE TYPES
// =========================================================

export interface Answer {
  id: number;
  question_id: number;
  value: string;
}


export interface FormResponse {
  id: number;
  form_id: number;
  submitted_at: string;
  answers: Answer[];
}


// =========================================================
// LOGIC JUMP TYPES
// =========================================================

export interface LogicRule {
  id: number;
  form_id: number;
  source_question_id: number;
  operator: string;
  value: string;
  target_question_id: number;
}


// =========================================================
// PUBLIC FORM TYPE
// =========================================================

export interface PublicForm {
  id: number;
  title: string;
  description: string | null;
  public_slug: string;

  questions: Question[];

  logic_rules: LogicRule[];
}


// =========================================================
// FORM API
// =========================================================

export async function getForms() {
  const response = await api.get<Form[]>(
    "/api/forms/"
  );

  return response.data;
}


export async function getForm(
  formId: number
) {
  const response = await api.get<Form>(
    `/api/forms/${formId}`
  );

  return response.data;
}


export async function createForm(
  title: string,
  description?: string
) {
  const response = await api.post<Form>(
    "/api/forms/",
    {
      title,
      description: description || null,
    }
  );

  return response.data;
}


export async function updateForm(
  formId: number,
  data: {
    title?: string;
    description?: string;
  }
) {
  const response = await api.put<Form>(
    `/api/forms/${formId}`,
    data
  );

  return response.data;
}


export async function deleteForm(
  formId: number
) {
  const response = await api.delete(
    `/api/forms/${formId}`
  );

  return response.data;
}


export async function togglePublish(
  formId: number
) {
  const response = await api.patch(
    `/api/forms/${formId}/publish`
  );

  return response.data;
}


export async function duplicateForm(
  formId: number
) {
  const response = await api.post<Form>(
    `/api/forms/${formId}/duplicate`
  );

  return response.data;
}


// =========================================================
// QUESTION API
// =========================================================

export async function getQuestions(
  formId: number
) {
  const response = await api.get<Question[]>(
    `/api/forms/${formId}/questions`
  );

  return response.data;
}


export async function createQuestion(
  formId: number,
  data: {
    type: string;
    title: string;
    description?: string;
    required?: boolean;
    options?: string[] | null;
  }
) {
  const response = await api.post<Question>(
    `/api/forms/${formId}/questions`,
    data
  );

  return response.data;
}


export async function updateQuestion(
  questionId: number,
  data: Partial<Question>
) {
  const response = await api.put<Question>(
    `/api/questions/${questionId}`,
    data
  );

  return response.data;
}


export async function deleteQuestion(
  questionId: number
) {
  const response = await api.delete(
    `/api/questions/${questionId}`
  );

  return response.data;
}


export async function reorderQuestions(
  formId: number,
  questionIds: number[]
) {
  const response = await api.put(
    `/api/forms/${formId}/questions/reorder`,
    questionIds
  );

  return response.data;
}


// =========================================================
// PUBLIC FORM API
// =========================================================

export async function getPublicForm(
  slug: string
) {
  const response = await api.get<PublicForm>(
    `/api/forms/public/${slug}`
  );

  return response.data;
}


// =========================================================
// RESPONSE API
// =========================================================

export async function submitResponse(
  formId: number,
  answers: {
    question_id: number;
    value: string;
  }[]
) {
  const response = await api.post<FormResponse>(
    `/api/public/forms/${formId}/responses`,
    {
      answers,
    }
  );

  return response.data;
}


export async function getResponses(
  formId: number
) {
  const response = await api.get<FormResponse[]>(
    `/api/forms/${formId}/responses`
  );

  return response.data;
}


export async function getResponse(
  responseId: number
) {
  const response = await api.get<FormResponse>(
    `/api/responses/${responseId}`
  );

  return response.data;
}


// =========================================================
// LOGIC JUMP API
// =========================================================

export async function getLogicRules(
  formId: number
) {
  const response = await api.get<LogicRule[]>(
    `/api/forms/${formId}/logic-rules`
  );

  return response.data;
}


export async function createLogicRule(
  formId: number,
  data: {
    source_question_id: number;
    operator: string;
    value: string;
    target_question_id: number;
  }
) {
  const response = await api.post<LogicRule>(
    `/api/forms/${formId}/logic-rules`,
    data
  );

  return response.data;
}


export async function updateLogicRule(
  ruleId: number,
  data: Partial<{
    source_question_id: number;
    operator: string;
    value: string;
    target_question_id: number;
  }>
) {
  const response = await api.put<LogicRule>(
    `/api/logic-rules/${ruleId}`,
    data
  );

  return response.data;
}


export async function deleteLogicRule(
  ruleId: number
) {
  const response = await api.delete(
    `/api/logic-rules/${ruleId}`
  );

  return response.data;
}