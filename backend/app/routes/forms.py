import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.form import Form
from app.models.question import Question
from app.models.logic_rule import LogicRule
from app.schemas import FormCreate, FormUpdate, FormResponse


router = APIRouter(
    prefix="/api/forms",
    tags=["Forms"]
)


# =========================================================
# CREATE FORM
# =========================================================

@router.post("/", response_model=FormResponse)
def create_form(
    form_data: FormCreate,
    db: Session = Depends(get_db)
):
    form = Form(
        title=form_data.title,
        description=form_data.description
    )

    db.add(form)
    db.commit()
    db.refresh(form)

    return FormResponse(
        **form.__dict__,
        response_count=0
    )


# =========================================================
# GET ALL FORMS
# =========================================================

@router.get("/", response_model=list[FormResponse])
def get_forms(
    db: Session = Depends(get_db)
):
    forms = (
        db.query(Form)
        .order_by(Form.created_at.desc())
        .all()
    )

    return [
        FormResponse(
            **form.__dict__,
            response_count=len(form.responses)
        )
        for form in forms
    ]


# =========================================================
# GET PUBLIC FORM
# =========================================================

@router.get("/public/{slug}")
def get_public_form(
    slug: str,
    db: Session = Depends(get_db)
):
    form = (
        db.query(Form)
        .filter(
            Form.public_slug == slug,
            Form.is_published.is_(True)
        )
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Published form not found"
        )

    logic_rules = (
        db.query(LogicRule)
        .filter(
            LogicRule.form_id == form.id
        )
        .order_by(LogicRule.id)
        .all()
    )

    return {
        "id": form.id,
        "title": form.title,
        "description": form.description,
        "public_slug": form.public_slug,

        "questions": [
            {
                "id": question.id,
                "type": question.type,
                "title": question.title,
                "description": question.description,
                "required": question.required,
                "position": question.position,
                "options": (
                    json.loads(question.options)
                    if question.options
                    else None
                ),
            }
            for question in form.questions
        ],

        "logic_rules": [
            {
                "id": rule.id,
                "form_id": rule.form_id,
                "source_question_id": rule.source_question_id,
                "operator": rule.operator,
                "value": rule.value,
                "target_question_id": rule.target_question_id,
            }
            for rule in logic_rules
        ],
    }


# =========================================================
# GET SINGLE FORM
# =========================================================

@router.get("/{form_id}", response_model=FormResponse)
def get_form(
    form_id: int,
    db: Session = Depends(get_db)
):
    form = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    return FormResponse(
        **form.__dict__,
        response_count=len(form.responses)
    )


# =========================================================
# UPDATE FORM
# =========================================================

@router.put("/{form_id}", response_model=FormResponse)
def update_form(
    form_id: int,
    form_data: FormUpdate,
    db: Session = Depends(get_db)
):
    form = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    if form_data.title is not None:
        form.title = form_data.title

    if form_data.description is not None:
        form.description = form_data.description

    db.commit()
    db.refresh(form)

    return FormResponse(
        **form.__dict__,
        response_count=len(form.responses)
    )


# =========================================================
# DELETE FORM
# =========================================================

@router.delete("/{form_id}")
def delete_form(
    form_id: int,
    db: Session = Depends(get_db)
):
    form = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    db.delete(form)
    db.commit()

    return {
        "message": "Form deleted successfully"
    }


# =========================================================
# PUBLISH / UNPUBLISH
# =========================================================

@router.patch("/{form_id}/publish")
def toggle_publish(
    form_id: int,
    db: Session = Depends(get_db)
):
    form = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    if form.is_published:
        form.is_published = False

    else:
        form.is_published = True

        if not form.public_slug:
            form.public_slug = uuid.uuid4().hex[:10]

    db.commit()
    db.refresh(form)

    return {
        "id": form.id,
        "is_published": form.is_published,
        "public_slug": form.public_slug
    }


# =========================================================
# DUPLICATE FORM
# =========================================================

@router.post("/{form_id}/duplicate", response_model=FormResponse)
def duplicate_form(
    form_id: int,
    db: Session = Depends(get_db)
):
    original = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not original:
        raise HTTPException(
            status_code=404,
            detail="Form not found"
        )

    duplicate = Form(
        title=f"{original.title} (Copy)",
        description=original.description,
        is_published=False,
        public_slug=None
    )

    db.add(duplicate)
    db.flush()

    # Map original question IDs to duplicated question IDs.
    question_id_map = {}

    for question in original.questions:
        duplicate_question = Question(
            form_id=duplicate.id,
            type=question.type,
            title=question.title,
            description=question.description,
            required=question.required,
            position=question.position,
            options=question.options
        )

        db.add(duplicate_question)
        db.flush()

        question_id_map[question.id] = duplicate_question.id

    # Duplicate logic rules using the new question IDs.
    for rule in original.logic_rules:
        source_id = question_id_map.get(
            rule.source_question_id
        )

        target_id = question_id_map.get(
            rule.target_question_id
        )

        if source_id is not None and target_id is not None:
            duplicate_rule = LogicRule(
                form_id=duplicate.id,
                source_question_id=source_id,
                operator=rule.operator,
                value=rule.value,
                target_question_id=target_id,
            )

            db.add(duplicate_rule)

    db.commit()
    db.refresh(duplicate)

    return FormResponse(
        **duplicate.__dict__,
        response_count=0
    )