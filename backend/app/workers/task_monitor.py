import asyncio
import logging
from typing import Optional
from backend.app.config import settings
from backend.app.database import SessionLocal
from backend.app.services.notification_service import NotificationService

logger = logging.getLogger("task_monitor_worker")


class TaskMonitorWorker:
    def __init__(self, interval_seconds: Optional[int] = None, max_retries: int = 3):
        self.interval_seconds = interval_seconds or settings.WORKER_INTERVAL_SECONDS
        self.max_retries = max_retries
        self._is_running = False
        self._task: Optional[asyncio.Task] = None

    def run_check_cycle(self) -> tuple[int, int]:
        """
        Executes a single check cycle using an isolated database session.
        Applies a retry strategy for database transient failures.
        """
        attempt = 0
        while attempt < self.max_retries:
            db = SessionLocal()
            try:
                checked, created = NotificationService.check_and_create_notifications(
                    db=db,
                    due_soon_hours=settings.TASK_DUE_SOON_HOURS,
                )
                logger.debug(f"Worker cycle completed: {checked} tasks checked, {created} notifications created.")
                return checked, created
            except Exception as exc:
                attempt += 1
                logger.error(
                    f"Task monitor worker error (attempt {attempt}/{self.max_retries}): {exc}",
                    exc_info=True,
                )
                if attempt < self.max_retries:
                    # Brief backoff before retry within the cycle
                    import time
                    time.sleep(1.0 * attempt)
                else:
                    logger.critical("Task monitor worker reached max retries for current cycle. Skipping to next interval.")
            finally:
                db.close()
        return 0, 0

    async def _worker_loop(self):
        logger.info(f"Background Task Monitor Worker started (polling interval: {self.interval_seconds}s)")
        while self._is_running:
            try:
                # Run the synchronous DB operations in threadpool so it doesn't block FastAPI event loop
                await asyncio.to_thread(self.run_check_cycle)
            except Exception as e:
                logger.error(f"Unexpected error in background worker loop: {e}", exc_info=True)

            # Wait for next interval or until stopped
            try:
                await asyncio.sleep(self.interval_seconds)
            except asyncio.CancelledError:
                break
        logger.info("Background Task Monitor Worker stopped.")

    def start(self):
        if not self._is_running:
            self._is_running = True
            self._task = asyncio.create_task(self._worker_loop())

    async def stop(self):
        if self._is_running:
            self._is_running = False
            if self._task:
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass


# Singleton worker instance
task_monitor = TaskMonitorWorker()
