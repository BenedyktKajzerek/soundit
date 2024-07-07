from django.utils import timezone
from datetime import timedelta
from requests import get, post, put
import requests
import math

from .models import SpotifyToken, YouTubeToken

# Get credentials from .env
from dotenv import load_dotenv
import os

load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

API_KEY_YT = os.getenv("API_KEY_YT")
CLIENT_ID_YT = os.getenv("CLIENT_ID_YT")
CLIENT_SECRET_YT = os.getenv("CLIENT_SECRET_YT")

BASE_URL_SPOTIFY = "https://api.spotify.com/v1/"
BASE_URL_YOUTUBE = "https://youtube.googleapis.com/youtube/v3/"

token_classes = {
    "spotify": SpotifyToken,
    "youtube": YouTubeToken,
}

##### Authentication / Tokens #####

def get_user_token(user, service):
    TokenClass = token_classes[service]
    user_token = TokenClass.objects.filter(user=user)

    # Check if user already has a token
    if user_token.exists():
        return user_token[0]
    else:
        return None


def create_or_update_user_token(user, service, access_token, token_type, expires_in, refresh_token):
    token = get_user_token(user, service)
    # Convert seconds to date if needed
    if type(expires_in) is int:
        expires_in = timezone.now() + timedelta(seconds=expires_in)

    if token:
        # Update
        token.access_token = access_token
        token.save()
        token.token_type = token_type
        token.save()
        token.expires_in = expires_in
        token.save()
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

    # check if user revoked access
    if service == "youtube":
        response = requests.get(f'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token={token}')
    elif service == "spotify":
        response = requests.get('https://api.spotify.com/v1/me', headers={
            "Authorization": f"Bearer {token}"
        })

    # if user has indeed revoked access
    if response.status_code != 200:
        return False

    if token:
        if token.expires_in <= timezone.now():
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
    elif service == "youtube":
        response = post('https://oauth2.googleapis.com/token', data={
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': CLIENT_ID_YT,
            'client_secret': CLIENT_SECRET_YT
        }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')
    refresh_token = response.get('refresh_token')

    create_or_update_user_token(
        user, service, access_token, token_type, expires_in, refresh_token)
    
##### Using API #####

def api_request(user, service, endpoint):
    """
    Make an API request to the specified service.

    Args:
        user (User): The user object.
        service (str): The name of the service (e.g., "spotify", "youtube").
        endpoint (str): The API endpoint to call.

    Returns:
        dict: The JSON response from the API.
        
    Raises:
        requests.exceptions.RequestException: If an error occurs during the request.
    """
    token = get_user_token(user, service)
    headers = {'Authorization': f"Bearer {token.access_token}"}

    if service == "youtube":
        headers['Accept'] = 'application/json'

    try:
        url = BASE_URL_SPOTIFY + endpoint if service == "spotify" else BASE_URL_YOUTUBE + endpoint
        response = requests.get(url, {}, headers=headers)

        # Raise exception for 4xx or 5xx status codes
        response.raise_for_status()  

        return response.json()
    except requests.exceptions.RequestException as e:
        raise e


def get_every_youtube_playlist(user):
    """
    Retrieve all playlists for the given user from service.

    Args:
        user (User): The user object.

    Returns:
        dict: A dictionary containing all playlists.
        
    (same for get_every_spotify_playlist())
    """
    playlists = []
    next_page_token = None

    try:
        while True:
            endpoint = f'playlists?part=snippet%2CcontentDetails&mine=true&maxResults=50&key={API_KEY_YT}'
            if next_page_token:
                endpoint += f'&pageToken={next_page_token}'

            # Get another playlist
            response = api_request(user, "youtube", endpoint)
            playlists.extend(response.get('items', []))

            # Update values
            next_page_token = response.get('nextPageToken')

            # Check if there's more
            if not next_page_token:
                break

    except requests.exceptions.RequestException as e:
        print(f"Error retrieving YouTube playlists: {e}")

    return playlists


def get_every_spotify_playlist(user):
    playlists = []
    offset = 0
    limit = 50

    try:
        while True:
            endpoint = f'me/playlists?limit={limit}&offset={offset}'

            # Get another playlist
            response = api_request(user, "spotify", endpoint)
            playlists.extend(response.get('items', []))

            # Update values
            total = response.get('total', 0)
            offset += limit

            # Check if there's more
            if offset >= total:
                break

    except requests.exceptions.RequestException as e:
        print(f"Error retrieving Spotify playlists: {e}")

    return playlists
