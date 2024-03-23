from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('register', views.register, name='register'),
    path('about', views.about, name='about'),
    path('transfer', views.transfer, name='transfer'),

    # API related (Spotify)
    path('profile/spotify/get-auth-url', views.SpotifyAuthURL.as_view()),
    path('profile/spotify/callback', views.spotify_callback),
    path('profile/spotify/is-authenticated', views.SpotifyIsAuthenticated.as_view()),
    
    # API related (YouTube)

    # WebApp (when user is logged in)
    path('profile/', views.profile, name='profile'),
]