import json
from datetime import datetime, timezone

from app.database import Base, engine, SessionLocal
from app.models.form import Form
from app.models.question import Question
from app.models.response import FormResponse, Answer
from app.models.logic_rule import LogicRule


Base.metadata.create_all(bind=engine)

db = SessionLocal()


def create_question(
    form_id,
    question_type,
    title,
    description=None,
    required=False,
    position=0,
    options=None,
):
    question = Question(
        form_id=form_id,
        type=question_type,
        title=title,
        description=description,
        required=required,
        position=position,
        options=json.dumps(options) if options else None,
    )

    db.add(question)
    db.flush()

    return question


def create_response(form_id, answers):
    response = FormResponse(
        form_id=form_id,
        submitted_at=datetime.now(timezone.utc),
    )

    db.add(response)
    db.flush()

    for question, value in answers:
        db.add(
            Answer(
                response_id=response.id,
                question_id=question.id,
                value=value,
            )
        )

    return response


try:
    # =====================================================
    # FORM 1 — Customer Feedback
    # =====================================================

    feedback = (
        db.query(Form)
        .filter(Form.title == "Customer Feedback")
        .first()
    )

    if not feedback:
        feedback = Form(
            title="Customer Feedback",
            description="Help us improve our product.",
            is_published=True,
            public_slug="customer-feedback",
        )

        db.add(feedback)
        db.flush()

        q1 = create_question(
            feedback.id,
            "multiple_choice",
            "How satisfied are you with our product?",
            "Choose the option that best describes your experience.",
            True,
            0,
            ["Very satisfied", "Satisfied", "Neutral", "Dissatisfied"],
        )

        q2 = create_question(
            feedback.id,
            "rating",
            "How would you rate your overall experience?",
            "1 is lowest and 5 is highest.",
            True,
            1,
        )

        q3 = create_question(
            feedback.id,
            "long_text",
            "What could we improve?",
            "Tell us anything that would make the experience better.",
            False,
            2,
        )

        q4 = create_question(
            feedback.id,
            "email",
            "What is your email?",
            "We'll only use this if we need to follow up.",
            False,
            3,
        )

        # Logic jump:
        # If user is very satisfied, jump directly to Q4.
        db.add(
            LogicRule(
                form_id=feedback.id,
                source_question_id=q1.id,
                operator="equals",
                value="Very satisfied",
                target_question_id=q4.id,
            )
        )

        create_response(
            feedback.id,
            [
                (q1, "Very satisfied"),
                (q2, "5"),
                (q3, "The product is simple and easy to use."),
                (q4, "alex@example.com"),
            ],
        )

        create_response(
            feedback.id,
            [
                (q1, "Satisfied"),
                (q2, "4"),
                (q3, "More customization options would be useful."),
                (q4, "sam@example.com"),
            ],
        )


    # =====================================================
    # FORM 2 — Job Application
    # =====================================================

    job = (
        db.query(Form)
        .filter(Form.title == "Software Engineer Application")
        .first()
    )

    if not job:
        job = Form(
            title="Software Engineer Application",
            description="Apply for our Software Engineer opportunity.",
            is_published=True,
            public_slug="software-engineer-application",
        )

        db.add(job)
        db.flush()

        j1 = create_question(
            job.id,
            "short_text",
            "What is your full name?",
            "Enter your first and last name.",
            True,
            0,
        )

        j2 = create_question(
            job.id,
            "email",
            "What is your email address?",
            "Use an email address we can contact you on.",
            True,
            1,
        )

        j3 = create_question(
            job.id,
            "dropdown",
            "How much professional experience do you have?",
            None,
            True,
            2,
            ["0-1 years", "1-3 years", "3-5 years", "5+ years"],
        )

        j4 = create_question(
            job.id,
            "multiple_choice",
            "Which area are you strongest in?",
            None,
            True,
            3,
            ["Frontend", "Backend", "Full Stack", "Data / AI"],
        )

        j5 = create_question(
            job.id,
            "long_text",
            "Tell us about your best project.",
            "Briefly describe the problem, your solution and your contribution.",
            True,
            4,
        )

        create_response(
            job.id,
            [
                (j1, "Priya Sharma"),
                (j2, "priya@example.com"),
                (j3, "1-3 years"),
                (j4, "Full Stack"),
                (j5, "I built a full-stack analytics dashboard using React and FastAPI."),
            ],
        )

        create_response(
            job.id,
            [
                (j1, "Arjun Mehta"),
                (j2, "arjun@example.com"),
                (j3, "0-1 years"),
                (j4, "Backend"),
                (j5, "I developed a REST API with Python, FastAPI and PostgreSQL."),
            ],
        )


    db.commit()

    print("")
    print("==============================================")
    print(" DATABASE SEED COMPLETE")
    print("==============================================")
    print("")
    print("Created sample forms:")
    print("1. Customer Feedback")
    print("2. Software Engineer Application")
    print("")
    print("Sample responses added.")
    print("Sample logic jump added.")
    print("")
    print("Public links:")
    print("http://localhost:3000/form/customer-feedback")
    print("http://localhost:3000/form/software-engineer-application")
    print("")

except Exception as error:
    db.rollback()
    print("")
    print("SEED FAILED")
    print(error)
    raise

finally:
    db.close()
