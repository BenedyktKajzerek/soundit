from django.utils import timezone
from datetime import timedelta
from requests import get, post, put
import requests

from .models import SpotifyToken, YouTubeToken

# Get credentials from .env
from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

BASE_URL = "https://api.spotify.com/v1/me/"

token_classes = {
    "spotify": SpotifyToken,
    "youtube": YouTubeToken,
}

# ===== Authentication / Tokens =====

def get_user_token(user, service):
    TokenClass = token_classes[service]
    user_token = TokenClass.objects.filter(user=user)

    # if service == "spotify":
    #     user_token = SpotifyToken.objects.filter(user=user)
    # elif service == "youtube":
    #     user_token = YouTubeToken.objects.filter(user=user)

    # Check if user already has a token
    if user_token.exists():
        return user_token[0]
    else:
        return None


def create_or_update_user_token(user, access_token, token_type, expires_in, refresh_token, service):
    token = get_user_token(user, service)
    # Convert 3600s to date
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if token:
        # Update
        # token.save() -> then change values -> then update_fields
        # token.save()
        token.access_token = access_token
        token.save()
        token.token_type = token_type
        token.save()
        token.expires_in = expires_in
        token.save()
        # token.refresh_token = refresh_token
        # token.save()
        # This leaves an error (why?)
        # token.save(update_fields=['access_token', 'token_type', 'expires_in', 'refresh_token'])
    else: 
        # Create token
        if service in token_classes:
            TokenClass = token_classes[service]
            token = TokenClass(
                user=user, 
                access_token=access_token, 
                token_type=token_type, 
                expires_in=expires_in, 
                refresh_token=refresh_token
            )
            token.save()
        

def is_authenticated(user, service):
    token = get_user_token(user, service)

    if token:
        expires = token.expires_in
        if expires <= timezone.now():
            refresh_token(user, service)

        return True

    return False


def refresh_token(user, service):
    refresh_token = get_user_token(user, service).refresh_token

    if service == "spotify":
        response = post('https://accounts.spotify.com/api/token', data={
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }).json()

        access_token = response.get('access_token')
        token_type = response.get('token_type')
        expires_in = response.get('expires_in')
        refresh_token = response.get('refresh_token')
    
        create_or_update_user_token(
            user, access_token, token_type, expires_in, refresh_token, service)
    else:
        pass
    
# ===== Using API =====

def spotify_api_request(user, endpoint, post_=False, put_=False):
    token = get_user_token(user, "spotify")
    headers = {'Authorization': f"Bearer {token.access_token}"}

    response = requests.get(BASE_URL + endpoint, {}, headers=headers)

    try:
        return response.json()
    except:
        return {'Error': 'Error'}