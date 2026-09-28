from backend.app.routers.projects import router as projects_router
from backend.app.routers.stories import router as stories_router
from backend.app.routers.tasks import router as tasks_router
from backend.app.routers.notifications import router as notifications_router

__all__ = [
    "projects_router",
    "stories_router",
    "tasks_router",
    "notifications_router",
]
