import os
import sys
from django.apps import AppConfig


class JobsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'jobs'

    def ready(self):
        # Prevent starting scheduler twice during Django runserver autoreload
        if os.environ.get('RUN_MAIN') == 'true' or 'manage.py' not in sys.argv:
            try:
                from jobs.scheduler import start_scheduler
                start_scheduler()
            except Exception as e:
                import logging
                logging.getLogger("jobs").warning(f"Could not start APScheduler: {e}")

