from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login', views.login_view, name='login'),
    path('logout', views.logout_view, name='logout'),
    path('register', views.register, name='register'),
    path('about', views.about, name='about'),

    # WebApp (when user is logged in)
    path('profile/', views.profile, name='profile'),
    path('profile/get_user_access_token/<str:service>', views.get_user_access_token),
 
    # API related (Spotify)
    path('profile/spotify/get-auth-url', views.SpotifyAuthURL.as_view()),
    path('profile/spotify/callback', views.spotify_callback),
    path('profile/spotify/is-authenticated', views.SpotifyIsAuthenticated.as_view()),

    # API related (YouTube)
    path('profile/youtube/get-auth-url', views.YouTubeAuthURL.as_view()),
    path('profile/youtube/callback', views.youtube_callback),
    path('profile/youtube/is-authenticated', views.YouTubeIsAuthenticated.as_view()),

    # Update AppStats
    path('profile/update_appstats', views.update_appstats),
]