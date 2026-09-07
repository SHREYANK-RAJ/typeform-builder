import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.form import Form
from app.models.question import Question
from app.schemas import QuestionCreate, QuestionUpdate, QuestionResponse


router = APIRouter(tags=["Questions"])


def question_to_response(question: Question) -> dict:
    return {
        "id": question.id,
        "form_id": question.form_id,
        "type": question.type,
        "title": question.title,
        "description": question.description,
        "required": question.required,
        "position": question.position,
        "options": json.loads(question.options) if question.options else None,
    }


@router.post(
    "/api/forms/{form_id}/questions",
    response_model=QuestionResponse
)
def create_question(
    form_id: int,
    question_data: QuestionCreate,
    db: Session = Depends(get_db)
):
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    existing_questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .count()
    )

    question = Question(
        form_id=form_id,
        type=question_data.type,
        title=question_data.title,
        description=question_data.description,
        required=question_data.required,
        position=existing_questions,
        options=(
            json.dumps(question_data.options)
            if question_data.options is not None
            else None
        ),
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question_to_response(question)


@router.get(
    "/api/forms/{form_id}/questions",
    response_model=list[QuestionResponse]
)
def get_questions(
    form_id: int,
    db: Session = Depends(get_db)
):
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position)
        .all()
    )

    return [question_to_response(question) for question in questions]


@router.put(
    "/api/questions/{question_id}",
    response_model=QuestionResponse
)
def update_question(
    question_id: int,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db)
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    updates = question_data.model_dump(exclude_unset=True)

    if "type" in updates:
        question.type = updates["type"]

    if "title" in updates:
        question.title = updates["title"]

    if "description" in updates:
        question.description = updates["description"]

    if "required" in updates:
        question.required = updates["required"]

    if "options" in updates:
        question.options = (
            json.dumps(updates["options"])
            if updates["options"] is not None
            else None
        )

    db.commit()
    db.refresh(question)

    return question_to_response(question)


@router.delete("/api/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db)
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()

    return {"message": "Question deleted successfully"}


@router.put("/api/forms/{form_id}/questions/reorder")
def reorder_questions(
    form_id: int,
    question_ids: list[int],
    db: Session = Depends(get_db)
):
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(status_code=404, detail="Form not found")

    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .all()
    )

    question_map = {
        question.id: question
        for question in questions
    }

    if set(question_ids) != set(question_map.keys()):
        raise HTTPException(
            status_code=400,
            detail="Question IDs do not match this form's questions"
        )

    for position, question_id in enumerate(question_ids):
        question_map[question_id].position = position

    db.commit()

    return {
        "message": "Questions reordered successfully"
    }