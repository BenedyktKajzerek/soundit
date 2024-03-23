from django.utils import timezone
from datetime import timedelta
from requests import get, post, put
import requests

from .models import SpotifyToken

# Get credentials from .env
from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")


BASE_URL = "https://api.spotify.com/v1/me/"

# ===== Authentication / Tokens =====

def get_user_token(user):
    user_token = SpotifyToken.objects.filter(user=user)
    
    # Check if user already has a token
    if user_token.exists():
        return user_token[0]
    else:
        return None


def spotify_create_or_update_user_token(user, access_token, token_type, expires_in, refresh_token):
    token = get_user_token(user)
    # Convert 3600s to date
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    # Update/create token
    if token:
        # token.save() -> then change values -> then update_fields
        token.access_token = access_token
        token.save()
        token.token_type = token_type
        token.save()
        token.expires_in = expires_in
        token.save()
        token.refresh_token = refresh_token
        token.save()
        # This leaves an error (why?)
        # token.save(update_fields=['access_token', 'token_type', 'expires_in', 'refresh_token'])
    else:
        token = SpotifyToken(
            user=user, 
            access_token=access_token, 
            token_type=token_type, 
            expires_in=expires_in, 
            refresh_token=refresh_token
        )
        token.save()
        

def spotify_is_authenticated(user):
    token = get_user_token(user)

    if token:
        expires = token.expires_in
        if expires <= timezone.now():
            refresh_token(user)

        return True

    return False


def refresh_token(user):
    refresh_token = get_user_token(user).refresh_token

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

    spotify_create_or_update_user_token(
        user, access_token, token_type, expires_in, refresh_token)
    
# ===== Using API =====

def spotify_api_request(user, endpoint, post_=False, put_=False):
    token = get_user_token(user)
    headers = {'Authorization': f"Bearer {token.access_token}"}

    response = requests.get(BASE_URL + endpoint, {}, headers=headers)

    try:
        return response.json()
    except:
        return {'Error': 'Error'}