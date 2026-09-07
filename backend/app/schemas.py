from datetime import datetime

from pydantic import BaseModel, ConfigDict


# =========================================================
# FORM SCHEMAS
# =========================================================

class FormCreate(BaseModel):
    title: str = "Untitled form"
    description: str | None = None


class FormUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class FormResponse(BaseModel):
    id: int
    title: str
    description: str | None
    is_published: bool
    public_slug: str | None
    created_at: datetime
    updated_at: datetime
    response_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# QUESTION SCHEMAS
# =========================================================

class QuestionCreate(BaseModel):
    type: str
    title: str
    description: str | None = None
    required: bool = False
    options: list[str] | None = None


class QuestionUpdate(BaseModel):
    type: str | None = None
    title: str | None = None
    description: str | None = None
    required: bool | None = None
    options: list[str] | None = None


class QuestionResponse(BaseModel):
    id: int
    form_id: int
    type: str
    title: str
    description: str | None
    required: bool
    options: list[str] | None
    position: int

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# RESPONSE SCHEMAS
# =========================================================

class AnswerCreate(BaseModel):
    question_id: int
    value: str


class ResponseCreate(BaseModel):
    answers: list[AnswerCreate]


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    value: str

    model_config = ConfigDict(from_attributes=True)


class ResponseResponse(BaseModel):
    id: int
    form_id: int
    submitted_at: datetime
    answers: list[AnswerResponse] = []

    model_config = ConfigDict(from_attributes=True)


# =========================================================
# LOGIC JUMP SCHEMAS
# =========================================================

class LogicRuleCreate(BaseModel):
    source_question_id: int
    operator: str
    value: str = ""
    target_question_id: int


class LogicRuleUpdate(BaseModel):
    source_question_id: int | None = None
    operator: str | None = None
    value: str | None = None
    target_question_id: int | None = None


class LogicRuleResponse(BaseModel):
    id: int
    form_id: int
    source_question_id: int
    operator: str
    value: str
    target_question_id: int

    model_config = ConfigDict(from_attributes=True)