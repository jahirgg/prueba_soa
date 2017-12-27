import os
from celery import Celery
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rest_service.settings')

app = Celery('rest_service', broker='redis//127.0.0.1:6379')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()