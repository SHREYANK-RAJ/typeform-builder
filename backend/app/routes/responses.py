from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.form import Form
from app.models.question import Question
from app.models.response import FormResponse, Answer
from app.schemas import ResponseCreate, ResponseResponse

router = APIRouter(tags=["Responses"])


@router.post(
    "/api/public/forms/{form_id}/responses",
    response_model=ResponseResponse
)
def submit_response(
    form_id: int,
    response_data: ResponseCreate,
    db: Session = Depends(get_db)
):
    # Check that the form exists
    form = db.query(Form).filter(Form.id == form_id).first()

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    # Get all questions belonging to this form
    questions = (
        db.query(Question)
        .filter(Question.form_id == form_id)
        .all()
    )

    question_map = {
        question.id: question
        for question in questions
    }

    # Validate answers
    for answer_data in response_data.answers:

        if answer_data.question_id not in question_map:
            raise HTTPException(
                status_code=400,
                detail=f"Question {answer_data.question_id} does not belong to this form"
            )

    # Check required questions
    for question in questions:

        if question.required:
            answered = any(
                answer.question_id == question.id
                and answer.value.strip() != ""
                for answer in response_data.answers
            )

            if not answered:
                raise HTTPException(
                    status_code=400,
                    detail=f"Required question '{question.title}' was not answered"
                )

    # Create response
    new_response = FormResponse(
        form_id=form_id
    )

    db.add(new_response)
    db.flush()

    # Create answers
    for answer_data in response_data.answers:

        answer = Answer(
            response_id=new_response.id,
            question_id=answer_data.question_id,
            value=answer_data.value
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