from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect
from django.db import IntegrityError
from django.shortcuts import render
from django.urls import reverse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from requests import Request, post

from .models import User, SpotifyToken, YouTubeToken

# Get credentials from .env
from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = "http://127.0.0.1:8000/"


# Request authorization to access data (Spotify)
class AuthURL(APIView):
    def get(self, request, format=None):
        # Everything a user is allowing us to do with his account
        scope = 'playlist-read-private playlist-read-collaborative playlist-modify-private playlist-modify-public'

        url = Request('GET', 'https://accounts.spotify.com/authorize', parama={
            'client_id': CLIENT_ID,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'scope': scope,
        }).prepare().url # extract url of the prepared request

        return Response({'url': url}, status=status.HTTP_200_OK)


# Request access and refresh token (Spotify)
def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error') # (e.g. access_denied)

    # Call post request and get response
    response = post('https://accounts.spotify.com/api/token', data={
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')
    refresh_token = response.get('refresh_token')
    error = response.get('error')


def index(request):
    if request.user.is_authenticated:
        return HttpResponseRedirect(reverse('webapp'))

    return render(request, "soundit/index.html")


def login(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)

        # Check if authentication was successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "soundit/login.html", {
                'error': "Invalid username and/or password."
            })
    else:
        return render(request, "soundit/login.html")


def logout(request):
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


# @login_required
def profile(request):
    return render(request, "soundit/profile.html")

def about(request):
    return render(request, "soundit/about.html")


def transfer(request):
    return render(request, "soundit/transfer.html")
