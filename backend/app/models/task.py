from sqlalchemy import Column, Integer, String, Text, Enum as SQLEnum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.app.database import Base
from backend.app.models.enums import TaskStatus, Priority


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_story_id = Column(Integer, ForeignKey("stories.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO, nullable=False)
    priority = Column(SQLEnum(Priority), default=Priority.MEDIUM, nullable=False)
    assigned_to = Column(String(255), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    story = relationship("Story", back_populates="tasks")
    notifications = relationship("Notification", back_populates="task", cascade="all, delete-orphan", passive_deletes=True)
