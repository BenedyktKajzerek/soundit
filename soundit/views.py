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

from django.utils import timezone
from datetime import timedelta

from .utils import *
from .models import User, SpotifyToken, YouTubeToken

# Get credentials from .env
from dotenv import load_dotenv
import os

# Disable OAuthlib's HTTPS verification when running locally.
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

load_dotenv()

# Spotify credentials
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = "http://127.0.0.1:8000/profile/spotify/callback"

# YouTube credentials
API_KEY_YT = 'AIzaSyCpse0zzLUChnmgqsVzGwK2Q3aEQAlcsPM'
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
        request.user, access_token, token_type, expires_in, refresh_token, "spotify")

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
        request.user, access_token, token_type, expires_in, refresh_token, "youtube")

    return redirect(reverse('index'))


class YouTubeIsAuthenticated(LoginRequiredMixin, APIView):
    def get(self, request, format=None):
        authenticated = is_authenticated(request.user, "youtube")
        return Response({'status': authenticated}, status=status.HTTP_200_OK)


def index(request):
    # Redirect to profile if logged in
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse('profile'))

    return render(request, "soundit/index.html")


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


@login_required
def profile(request):
    # Check if needed to refresh token
    # loop over services and call function
    # on which he's connected with
    is_authenticated(request.user, "spotify")
    is_authenticated(request.user, "youtube")

    endpoint = 'playlists'
    response_spotify = api_request(request.user, "spotify", endpoint)
    endpoint = f'playlists?part=snippet%2CcontentDetails&mine=true&key={API_KEY_YT}'
    response_youtube = api_request(request.user, "youtube", endpoint)

    if response_youtube['pageInfo']['totalResults'] > 5:
        nextPageToken = response_youtube['nextPageToken']
        endpoint = f'playlists?part=snippet%2CcontentDetails&mine=true&key={API_KEY_YT}&pageToken={nextPageToken}'
        response_youtube2 = api_request(request.user, "youtube", endpoint)
    print(response_youtube)
    print("==================")
    print(response_youtube2)
    print("==================")
    for x in response_youtube2['items']:
        response_youtube['items'].append(x)
    print(response_youtube)
        

    total_playlists = response_spotify['total'] + response_youtube['pageInfo']['totalResults']
    total_tracks = 0
    total_albums = 0
    total_artists = 0

    for playlist in response_spotify['items']:
        total_tracks += playlist['tracks']['total']

    for playlist in response_youtube['items']:
        total_tracks += playlist['contentDetails']['itemCount']

    general = {
        'total': {
            'playlists': total_playlists,
            'tracks': total_tracks,
            'albums': total_albums,
            'artists': total_artists,
        }
    }

    return render(request, "soundit/profile.html", {
        'general': general,
        'playlists_spotify': response_spotify,
        'playlists_youtube': response_youtube
    })

def about(request):
    return render(request, "soundit/about.html")


def transfer(request):
    return render(request, "soundit/transfer.html")
