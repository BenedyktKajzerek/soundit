from django.contrib import admin

from .models import User, SpotifyToken, YouTubeToken

# Register your models here.
admin.site.register(User)
admin.site.register(SpotifyToken)
admin.site.register(YouTubeToken)