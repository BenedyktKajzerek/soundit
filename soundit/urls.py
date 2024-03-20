from django.urls import path
from . import views
from .views import AuthURL, spotify_callback, IsAuthenticated

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('register', views.register, name='register'),
    path('about', views.about, name='about'),
    path('transfer', views.transfer, name='transfer'),

    # API related
    path('profile/get-auth-url', AuthURL.as_view()),
    path('profile/redirect', spotify_callback),
    path('profile/is-authenticated', IsAuthenticated.as_view()),
    
    # WebApp (when user is logged in)
    path('profile/', views.profile, name='profile'),
]