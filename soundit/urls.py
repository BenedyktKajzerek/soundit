from django.urls import path
from . import views
from .views import AuthURL

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login, name='login'),
    path('logout', views.logout, name='logout'),
    path('register', views.register, name='register'),
    path('about', views.about, name='about'),
    path('transfer', views.transfer, name='transfer'),
    path('get-auth-url', AuthURL.as_view()),
    
    # WebApp (when user is logged in)
    path('profile/', views.profile, name='profile'),
]