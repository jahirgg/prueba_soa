# api/urls.py

from django.conf.urls import url, include
from django.urls import path
from rest_framework.urlpatterns import format_suffix_patterns


from .views import ClientView, NetCashflowView, MovingAverageView, ClientListView
from . import views

app_name = 'api'
urlpatterns = {
    url(r'^api/client/(?P<pk>[0-9]+)/$',ClientView.as_view(), name="client"),
    url(r'^api/client/net/(?P<pk>[0-9]+)/$',NetCashflowView.as_view(), name="client_cash_flow"),
    url(r'^api/client/sma/(?P<pk>[0-9]+)/$',MovingAverageView.as_view(), name="client_sma"),
    url(r'^api/client/list/$',ClientListView.as_view(), name="client_list"),
    path('api/transaction/csv', views.import_db, name='import_db'),
}

urlpatterns = format_suffix_patterns(urlpatterns)