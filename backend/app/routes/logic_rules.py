from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.form import Form
from app.models.question import Question
from app.models.logic_rule import LogicRule
from app.schemas import (
    LogicRuleCreate,
    LogicRuleUpdate,
    LogicRuleResponse,
)


router = APIRouter(
    tags=["Logic Jumps"]
)


ALLOWED_OPERATORS = {
    "equals",
    "not_equals",
    "contains",
    "greater_than",
    "less_than",
    "is_empty",
    "is_not_empty",
}


def get_form_or_404(
    form_id: int,
    db: Session,
) -> Form:
    form = (
        db.query(Form)
        .filter(Form.id == form_id)
        .first()
    )

    if not form:
        raise HTTPException(
            status_code=404,
            detail="Form not found",
        )

    return form


def get_question_for_form(
    question_id: int,
    form_id: int,
    db: Session,
) -> Question:
    question = (
        db.query(Question)
        .filter(
            Question.id == question_id,
            Question.form_id == form_id,
        )
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question does not belong to this form",
        )

    return question


def validate_rule(
    form_id: int,
    source_question_id: int,
    target_question_id: int,
    operator: str,
    db: Session,
):
    if operator not in ALLOWED_OPERATORS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid operator. Allowed operators: "
                f"{', '.join(sorted(ALLOWED_OPERATORS))}"
            ),
        )

    source_question = get_question_for_form(
        source_question_id,
        form_id,
        db,
    )

    target_question = get_question_for_form(
        target_question_id,
        form_id,
        db,
    )

    if source_question.id == target_question.id:
        raise HTTPException(
            status_code=400,
            detail="A question cannot jump to itself",
        )

    if target_question.position <= source_question.position:
        raise HTTPException(
            status_code=400,
            detail=(
                "Logic jumps must target a later question. "
                "Backward jumps are not supported."
            ),
        )

    return source_question, target_question


@router.get(
    "/api/forms/{form_id}/logic-rules",
    response_model=list[LogicRuleResponse],
)
def get_logic_rules(
    form_id: int,
    db: Session = Depends(get_db),
):
    get_form_or_404(form_id, db)

    rules = (
        db.query(LogicRule)
        .filter(LogicRule.form_id == form_id)
        .order_by(LogicRule.id)
        .all()
    )

    return rules


@router.post(
    "/api/forms/{form_id}/logic-rules",
    response_model=LogicRuleResponse,
)
def create_logic_rule(
    form_id: int,
    rule_data: LogicRuleCreate,
    db: Session = Depends(get_db),
):
    get_form_or_404(form_id, db)

    validate_rule(
        form_id=form_id,
        source_question_id=rule_data.source_question_id,
        target_question_id=rule_data.target_question_id,
        operator=rule_data.operator,
        db=db,
    )

    rule = LogicRule(
        form_id=form_id,
        source_question_id=rule_data.source_question_id,
        operator=rule_data.operator,
        value=rule_data.value,
        target_question_id=rule_data.target_question_id,
    )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return rule


@router.put(
    "/api/logic-rules/{rule_id}",
    response_model=LogicRuleResponse,
)
def update_logic_rule(
    rule_id: int,
    rule_data: LogicRuleUpdate,
    db: Session = Depends(get_db),
):
    rule = (
        db.query(LogicRule)
        .filter(LogicRule.id == rule_id)
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Logic rule not found",
        )

    updates = rule_data.model_dump(
        exclude_unset=True
    )

    source_question_id = updates.get(
        "source_question_id",
        rule.source_question_id,
    )

    target_question_id = updates.get(
        "target_question_id",
        rule.target_question_id,
    )

    operator = updates.get(
        "operator",
        rule.operator,
    )

    validate_rule(
        form_id=rule.form_id,
        source_question_id=source_question_id,
        target_question_id=target_question_id,
        operator=operator,
        db=db,
    )

    if "source_question_id" in updates:
        rule.source_question_id = (
            updates["source_question_id"]
        )

    if "operator" in updates:
        rule.operator = updates["operator"]

    if "value" in updates:
        rule.value = updates["value"]

    if "target_question_id" in updates:
        rule.target_question_id = (
            updates["target_question_id"]
        )

    db.commit()
    db.refresh(rule)

    return rule


@router.delete(
    "/api/logic-rules/{rule_id}"
)
def delete_logic_rule(
    rule_id: int,
    db: Session = Depends(get_db),
):
    rule = (
        db.query(LogicRule)
        .filter(LogicRule.id == rule_id)
        .first()
    )

    if not rule:
        raise HTTPException(
            status_code=404,
            detail="Logic rule not found",
        )

    db.delete(rule)
    db.commit()

    return {
        "message": "Logic rule deleted successfully"
    }