from sqlalchemy import JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from database import Base


class JsonEntity(Base):
    __abstract__ = True
    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)


class Complaint(JsonEntity):
    __tablename__ = "complaints"


class Policy(JsonEntity):
    __tablename__ = "policies"


class RuleMatrix(JsonEntity):
    __tablename__ = "rule_matrix"


class RegisteredUser(JsonEntity):
    __tablename__ = "registered_users"
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False, default="")


class PromptTemplate(JsonEntity):
    __tablename__ = "prompt_templates"
