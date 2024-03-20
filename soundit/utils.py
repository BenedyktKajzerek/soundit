from django.utils import timezone
from datetime import timedelta
from requests import post

from .models import SpotifyToken, YouTubeToken

# Get credentials from .env
from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")


def get_user_token(session_id):
    user_token = SpotifyToken.objects.filter(user=session_id)
    
    # Check if user already has a token
    if user_token.exists():
        return user_token[0]
    else:
        return None


def create_or_update_user_token(session_key, access_token, token_type, expires_in, refresh_token):
    token = get_user_token(session_key)
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    # Update/create token
    if token:
        token.access_token = access_token
        token.type = token_type
        token.expires_in = expires_in
        token.refresh_token = refresh_token
        token.save(update_fields=['access_token', 'type', 'expires_in', 'refresh_token'])
    else:
        token = SpotifyToken(
            user=session_key, 
            access_token=access_token, 
            token_type=token_type, 
            expires_in=expires_in, 
            refresh_token=refresh_token
        )
        token.save()
        

def is_spotify_authenticated(session_key):
    token = get_user_token(session_key)
    
    if token:
        expires = token.expires_in
        if expires <= timezone.now():
            refresh_spotify_token(session_key)

        return True

    return False


def refresh_spotify_token(session_key):
    refresh_token = get_user_token(session_key).refresh_token

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
        session_key, access_token, token_type, expires_in, refresh_token)