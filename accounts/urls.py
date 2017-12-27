from django.urls import path, include
from django.conf.urls import url
from django.contrib.auth import views as auth_views

from django.views.generic.base import TemplateView


from . import views

app_name = 'accounts'
urlpatterns = [
    path('', include('django.contrib.auth.urls')),
    #url(r'login/$',TemplateView.as_view(template_name='login.html'), name="login"),
    url(r'login/$',auth_views.login,{'template_name':'registration/login.html'}, name="login"),
    url(r'logout/$',auth_views.login, name="logout"),
    #path('/login',auth_views.LoginView.as_view(),name='login')
]