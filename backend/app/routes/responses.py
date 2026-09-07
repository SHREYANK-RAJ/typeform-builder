from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import re

from app.database import get_db
from app.models.form import Form
from app.models.question import Question
from app.models.response import FormResponse, Answer
from app.schemas import ResponseCreate, ResponseResponse

router = APIRouter(tags=["Responses"])


EMAIL_REGEX = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


@router.post(
    "/api/public/forms/{form_id}/responses",
    response_model=ResponseResponse
)
def submit_response(
    form_id: int,
    response_data: ResponseCreate,
    db: Session = Depends(get_db)
):
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    if not form.is_published:
        raise HTTPException(
            status_code=403,
            detail="This form is not published"
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

    # Prevent duplicate answers for the same question
    submitted_question_ids = set()

    for answer_data in response_data.answers:

        if answer_data.question_id not in question_map:
            raise HTTPException(
                status_code=400,
                detail=f"Question {answer_data.question_id} does not belong to this form"
            )

        if answer_data.question_id in submitted_question_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Question {answer_data.question_id} has multiple answers"
            )

        submitted_question_ids.add(answer_data.question_id)

        question = question_map[answer_data.question_id]
        value = answer_data.value.strip()

        # Required validation
        if question.required and not value:
            raise HTTPException(
                status_code=400,
                detail=f"Required question '{question.title}' was not answered"
            )

        # Skip type validation for optional empty answers
        if not value:
            continue

        # Email validation
        if question.type == "email":
            if not re.match(EMAIL_REGEX, value):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid email for question '{question.title}'"
                )

        # Number validation
        if question.type == "number":
            try:
                float(value)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid number for question '{question.title}'"
                )

        # Yes/No validation
        if question.type == "yes_no":
            if value not in ["Yes", "No"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid answer for question '{question.title}'"
                )

        # Rating validation
        if question.type == "rating":
            try:
                rating = int(value)
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid rating for question '{question.title}'"
                )

            if rating < 1 or rating > 5:
                raise HTTPException(
                    status_code=400,
                    detail=f"Rating must be between 1 and 5 for question '{question.title}'"
                )

        # Choice/dropdown validation
        if question.type in ["multiple_choice", "dropdown"]:
            if question.options:
                import json

                options = json.loads(question.options)

                if value not in options:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid option for question '{question.title}'"
                    )

    # Check required questions that were completely omitted
    for question in questions:
        if question.required and question.id not in submitted_question_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Required question '{question.title}' was not answered"
            )

    new_response = FormResponse(
        form_id=form_id
    )

    db.add(new_response)
    db.flush()

    for answer_data in response_data.answers:

        answer = Answer(
            response_id=new_response.id,
            question_id=answer_data.question_id,
            value=answer_data.value.strip()
        )

        db.add(answer)

    db.commit()
    db.refresh(new_response)

    return new_response


@router.get(
    "/api/forms/{form_id}/responses",
    response_model=list[ResponseResponse]
)
def get_form_responses(
    form_id: int,
    db: Session = Depends(get_db)
):
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    return (
        db.query(FormResponse)
        .filter(FormResponse.form_id == form_id)
        .order_by(FormResponse.submitted_at.desc())
        .all()
    )


@router.get(
    "/api/responses/{response_id}",
    response_model=ResponseResponse
)
def get_response(
    response_id: int,
    db: Session = Depends(get_db)
):
    response = (
        db.query(FormResponse)
        .filter(FormResponse.id == response_id)
        .first()
    )

    if not response:
        raise HTTPException(
            status_code=404,
            detail="Response not found"
        )

    return response
