from sqlalchemy import Column, Integer, String, Enum as SQLEnum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from backend.app.database import Base
from backend.app.models.enums import NotificationType


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    message = Column(String(500), nullable=False)
    type = Column(SQLEnum(NotificationType), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)

    task = relationship("Task", back_populates="notifications")
