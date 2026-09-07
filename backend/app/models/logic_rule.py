from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LogicRule(Base):
    __tablename__ = "logic_rules"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    form_id: Mapped[int] = mapped_column(
        ForeignKey("forms.id", ondelete="CASCADE"),
        nullable=False
    )

    source_question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False
    )

    operator: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )

    value: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    target_question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False
    )

    form = relationship("Form", back_populates="logic_rules")

    source_question = relationship(
        "Question",
        foreign_keys=[source_question_id]
    )

    target_question = relationship(
        "Question",
        foreign_keys=[target_question_id]
    )