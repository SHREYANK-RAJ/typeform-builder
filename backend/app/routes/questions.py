import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.form import Form
from app.models.question import Question
from app.models.logic_rule import LogicRule
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
    # Make sure the form exists
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    # Validate question type
    allowed_types = {
        "short_text",
        "long_text",
        "multiple_choice",
        "dropdown",
        "email",
        "number",
        "yes_no",
        "rating",
    }

    if question_data.type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported question type: {question_data.type}"
        )

    # Choice-based questions should have options
    if question_data.type in {"multiple_choice", "dropdown"}:
        if not question_data.options or len(question_data.options) == 0:
            raise HTTPException(
                status_code=400,
                detail="Multiple choice and dropdown questions require options"
            )

    existing_questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .count()
    )

    question = Question(
        form_id=form_id,
        type=question_data.type,
        title=question_data.title.strip(),
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
    # Make sure the form exists
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .order_by(Question.position)
        .all()
    )

    return [
        question_to_response(question)
        for question in questions
    ]


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
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    updates = question_data.model_dump(exclude_unset=True)

    # Validate type if it is being changed
    if "type" in updates:
        allowed_types = {
            "short_text",
            "long_text",
            "multiple_choice",
            "dropdown",
            "email",
            "number",
            "yes_no",
            "rating",
        }

        if updates["type"] not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported question type: {updates['type']}"
            )

    # Apply normal updates
    if "type" in updates:
        question.type = updates["type"]

    if "title" in updates:
        title = updates["title"]

        if not title or not title.strip():
            raise HTTPException(
                status_code=400,
                detail="Question title cannot be empty"
            )

        question.title = title.strip()

    if "description" in updates:
        question.description = updates["description"]

    if "required" in updates:
        question.required = updates["required"]

    if "options" in updates:
        new_type = updates.get("type", question.type)

        if new_type in {"multiple_choice", "dropdown"}:
            if not updates["options"]:
                raise HTTPException(
                    status_code=400,
                    detail="Multiple choice and dropdown questions require options"
                )

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
        raise HTTPException(
            status_code=404,
            detail="Question not found"
        )

    # Delete any Logic Jump rules that reference this question.
    # This prevents orphaned rules after deleting a question.
    db.query(LogicRule).filter(
        (LogicRule.source_question_id == question_id)
        | (LogicRule.target_question_id == question_id)
    ).delete(synchronize_session=False)

    db.delete(question)
    db.commit()

    return {
        "message": "Question deleted successfully"
    }


@router.put("/api/forms/{form_id}/questions/reorder")
def reorder_questions(
    form_id: int,
    question_ids: list[int],
    db: Session = Depends(get_db)
):
    # Make sure the form exists
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .all()
    )

    question_map = {
        question.id: question
        for question in questions
    }

    # Ensure the submitted list contains exactly
    # the questions belonging to this form.
    if (
        len(question_ids) != len(question_map)
        or set(question_ids) != set(question_map.keys())
    ):
        raise HTTPException(
            status_code=400,
            detail="Question IDs do not match this form's questions"
        )

    # Prevent duplicate IDs in the reorder request.
    if len(question_ids) != len(set(question_ids)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate question IDs are not allowed"
        )

    # Calculate the new position of every question.
    new_positions = {
        question_id: position
        for position, question_id in enumerate(question_ids)
    }

    # Existing Logic Jump rules are only valid when the
    # target question comes after the source question.
    logic_rules = (
        db.query(LogicRule)
        .filter(LogicRule.form_id == form_id)
        .all()
    )

    for rule in logic_rules:
        source_position = new_positions.get(
            rule.source_question_id
        )

        target_position = new_positions.get(
            rule.target_question_id
        )

        if source_position is None or target_position is None:
            raise HTTPException(
                status_code=400,
                detail="Logic Jump references an invalid question"
            )

        if target_position <= source_position:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Cannot reorder questions because a Logic Jump "
                    f"from question {rule.source_question_id} to "
                    f"question {rule.target_question_id} would become invalid"
                )
            )

    # Apply the new positions.
    for question_id, position in new_positions.items():
        question_map[question_id].position = position

    db.commit()

    return {
        "message": "Questions reordered successfully"
    }