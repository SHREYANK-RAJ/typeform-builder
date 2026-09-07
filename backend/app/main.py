from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine

# Import all models so SQLAlchemy knows about every table
from app.models.form import Form
from app.models.question import Question
from app.models.response import FormResponse, Answer
from app.models.logic_rule import LogicRule

# Import all route routers
from app.routes.forms import router as forms_router
from app.routes.questions import router as questions_router
from app.routes.responses import router as responses_router
from app.routes.logic_rules import router as logic_rules_router


# Create all database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Typeform Clone API",
    description="Backend API for the Typeform Builder clone",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTES
# =========================================================

app.include_router(forms_router)
app.include_router(questions_router)
app.include_router(responses_router)
app.include_router(logic_rules_router)


# =========================================================
# ROOT ROUTE
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Typeform Clone API is running"
    }