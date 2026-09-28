from sqlalchemy import Column, Integer, String, Text, Enum as SQLEnum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.app.database import Base
from backend.app.models.enums import StoryStatus, Priority


class Story(Base):
    __tablename__ = "stories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(StoryStatus), default=StoryStatus.BACKLOG, nullable=False)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    project = relationship("Project", back_populates="stories")
    tasks = relationship("Task", back_populates="story", cascade="all, delete-orphan", passive_deletes=True)
