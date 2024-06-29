from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect
from django.db import IntegrityError
from django.shortcuts import render, redirect
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from requests import Request, post
from django.contrib.auth.mixins import LoginRequiredMixin
import google.oauth2.credentials
import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
from django.http import JsonResponse
import json

from django.utils import timezone
from datetime import timedelta

from .utils import *
from .models import User, SpotifyToken, YouTubeToken, AppStats

# Get credentials from .env
from dotenv import load_dotenv
import os

# Disable OAuthlib's HTTPS verification when running locally.
# *DO NOT* leave this option enabled in production.
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

load_dotenv()

# Spotify credentials
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = "http://127.0.0.1:8000/profile/spotify/callback"

# YouTube credentials
API_KEY_YT = os.getenv("API_KEY_YT")
SCOPES = 'https://www.googleapis.com/auth/youtube'
FLOW = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
    'client_secret.json',
    scopes=[SCOPES])
FLOW.redirect_uri = 'http://127.0.0.1:8000/profile/youtube/callback'

##### Spotify Authorization funtions #####

# Request authorization to access data
class SpotifyAuthURL(LoginRequiredMixin, APIView):
    def get(self, request, format=None):
        # Everything a user is allowing us to do with his account
        scope = 'playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public'

        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'response_type': 'code',
            'client_id': CLIENT_ID,
            'scope': scope,
            'redirect_uri': REDIRECT_URI
        }).prepare().url # extract url of the prepared request

        # Display scopes and prompt user to login
        return Response({'url': url}, status=status.HTTP_200_OK)


# Request access and refresh token
def spotify_callback(request, format=None):
    # An authorization code that can be exchanged for an access token.
    code = request.GET.get('code')
    error = request.GET.get('error') 

    if error: # (e.g. access_denied)
        return redirect(reverse('index'))

    # Return access and refresh tokens
    response = post('https://accounts.spotify.com/api/token', data={
        'code': code,
        'grant_type': 'authorization_code',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'redirect_uri': REDIRECT_URI,
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')
    refresh_token = response.get('refresh_token')
    error = response.get('error')

    create_or_update_user_token(
        request.user, "spotify", access_token, token_type, expires_in, refresh_token)

    return redirect(reverse('index'))


class SpotifyIsAuthenticated(LoginRequiredMixin, APIView):
    def get(self, request, format=None):
        authenticated = is_authenticated(request.user, "spotify")
        return Response({'status': authenticated}, status=status.HTTP_200_OK)

##### YouTube Authorization funtions #####

# Request authorization to access data
class YouTubeAuthURL(LoginRequiredMixin, APIView):
    def get(self, request, format=None):
        authorization_url = FLOW.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
        )
        print(authorization_url)
        return Response({'url': authorization_url}, status=status.HTTP_200_OK)
    
# Request access and refresh token
def youtube_callback(request, format=None):
    # An authorization code that can be exchanged for an access token.
    code = request.GET.get('code')
    error = request.GET.get('error') 

    if error: # (e.g. access_denied)
        return redirect(reverse('index'))

    # Return access and refresh tokens
    authorization_response = request.build_absolute_uri()
    FLOW.fetch_token(authorization_response=authorization_response)

    credentials = FLOW.credentials
    access_token = credentials.token
    token_type = "Bearer"
    expires_in = credentials.expiry
    refresh_token = credentials.refresh_token

    create_or_update_user_token(
        request.user, "youtube", access_token, token_type, expires_in, refresh_token)

    return redirect(reverse('index'))


class YouTubeIsAuthenticated(LoginRequiredMixin, APIView):
    def get(self, request, format=None):
        authenticated = is_authenticated(request.user, "youtube")
        return Response({'status': authenticated}, status=status.HTTP_200_OK)


def index(request):
    # Redirect to profile if logged in
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse('profile'))
    
    data = AppStats.objects.first()
    app_stats = {
        "tracks": data.transfered_tracks,
        "playlists": data.transfered_playlists, 
        "deleted": data.deleted_playlists
    }

    return render(request, "soundit/index.html", {
        'app_stats': app_stats
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        # Check if authentication was successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse('index'))
        else:
            return render(request, "soundit/login.html", {
                'error': "Invalid username and/or password."
            })
    else:
        return render(request, "soundit/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":

        email = request.POST['email']
        username = request.POST['username']
        password = request.POST['password']
        confirmation = request.POST['confirmation']
        
        # Ensure passwords are matching
        if password != confirmation:
            return render(request, "soundit/register.html", {
                'error': "Passwords not matching."
            })
        
        # Atempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "soundit/register.html", {
                'error': "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "soundit/register.html")
    

def about(request):
    return render(request, "soundit/about.html")


def faq(request):
    return render(request, "soundit/faq.html")


@login_required
def profile(request):
    is_spotify_connected = SpotifyToken.objects.only('user').filter(user=request.user).exists()
    is_youtube_connected = YouTubeToken.objects.only('user').filter(user=request.user).exists()
    
    data = User.objects.get(username=request.user.username)
    general = {
        'user': {
            'username': request.user.username,
            'tracks': data.transfered_tracks,
            'playlists': data.transfered_playlists,
            'deleted': data.deleted_playlists
        },
        'services': {
            'is_spotify_connected': is_spotify_connected,
            'is_youtube_connected': is_youtube_connected,
        },
        'total': {
            'playlists': 0,
            'tracks': 0,
        },
        'spotify': {
            'playlists': 0,
            'tracks': 0,
        },
        'youtube': {
            'playlists': 0,
            'tracks': 0,
        }
    }

    # Update Spotify statistics if connected
    spotify_playlists = youtube_playlists = None
    if is_spotify_connected:
        is_authenticated(request.user, "spotify")
        spotify_playlists = get_every_spotify_playlist(request.user)
        update_general_statistics(spotify_playlists, 'spotify', general)

    # Update YouTube statistics if connected
    if is_youtube_connected:
        is_authenticated(request.user, "youtube")
        youtube_playlists = get_every_youtube_playlist(request.user)
        update_general_statistics(youtube_playlists, 'youtube', general)

    return render(request, "soundit/profile.html", {
        'general': general,
        'playlists_spotify': spotify_playlists,
        'playlists_youtube': youtube_playlists
    })


# Function to update general statistics
def update_general_statistics(playlists, service_name, general_stats):
    total_playlists = len(playlists)
    total_tracks = sum(playlist['tracks']['total'] if service_name == 'spotify' else playlist['contentDetails']['itemCount'] for playlist in playlists)
    
    general_stats['total']['playlists'] += total_playlists
    general_stats[service_name]['playlists'] = total_playlists
    general_stats['total']['tracks'] += total_tracks
    general_stats[service_name]['tracks'] += total_tracks


def get_user_access_token(request, service):
    response = {'access_token': get_user_token(request.user, service).access_token}

    if service == "youtube":
        response['api_key_yt'] = API_KEY_YT

    return JsonResponse(response)


def update_appstats(request):
    if request.method == 'POST':
            try:
                data = json.loads(request.body)
                action = data.get('action', 0)
                value = data.get('value', 0)

                user_stats = User.objects.get(username=request.user.username)
                app_stats = AppStats.objects.first()

                if not app_stats:
                    app_stats = AppStats() # Create a new instance if it doesn't exist

                # Update the fields
                if action == "tracks":
                    app_stats.transfered_tracks += value
                    user_stats.transfered_tracks += value
                elif action == "playlists":
                    app_stats.transfered_playlists += value
                    user_stats.transfered_playlists += value
                elif action == "delete":
                    app_stats.deleted_playlists += value
                    user_stats.deleted_playlists += value

                user_stats.save()
                app_stats.save()
            
                return JsonResponse({'status': 'success'})
            except Exception as e:
                return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'invalid method'}, status=405)
