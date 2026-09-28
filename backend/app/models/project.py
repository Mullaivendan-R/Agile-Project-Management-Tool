from sqlalchemy import Column, Integer, String, Text, Enum as SQLEnum, DateTime, func
from sqlalchemy.orm import relationship
from backend.app.database import Base
from backend.app.models.enums import ProjectStatus


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ProjectStatus), default=ProjectStatus.PLANNING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Cascade delete stories when project is deleted
    stories = relationship("Story", back_populates="project", cascade="all, delete-orphan", passive_deletes=True)
