from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Form(Base):
    __tablename__ = "forms"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(255),
        default="Untitled form"
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    is_published: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    public_slug: Mapped[str | None] = mapped_column(
        String(100),
        unique=True,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    questions = relationship(
        "Question",
        back_populates="form",
        cascade="all, delete-orphan",
        order_by="Question.position",
    )

    responses = relationship(
        "FormResponse",
        back_populates="form",
        cascade="all, delete-orphan",
    )

    logic_rules = relationship(
        "LogicRule",
        back_populates="form",
        cascade="all, delete-orphan",
    )