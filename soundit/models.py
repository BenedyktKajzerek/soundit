from django.contrib.auth.models import AbstractUser
from django.db import models

class AppStats(models.Model):
    transfered_tracks = models.IntegerField(default=0)
    transfered_playlists = models.IntegerField(default=0)
    deleted_playlists = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.transfered_tracks} {self.transfered_playlists} {self.deleted_playlists}'

class User(AbstractUser):
    transfered_tracks = models.IntegerField(default=0)
    transfered_playlists = models.IntegerField(default=0)
    deleted_playlists = models.IntegerField(default=0)

    def __str__(self):
        return f'{self.id} {self.username}'
    
class SpotifyToken(models.Model):
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="spotify")
    access_token = models.CharField(max_length=255)
    token_type = models.CharField(max_length=50)
    expires_in = models.DateTimeField()
    refresh_token = models.CharField(max_length=255)

    def __str__(self):
        return f'{self.user}'

class YouTubeToken(models.Model):
    user = models.ForeignKey(User, null=True, on_delete=models.CASCADE, related_name="youtube")
    access_token = models.CharField(max_length=255)
    token_type = models.CharField(max_length=50)
    expires_in = models.DateTimeField()
    refresh_token = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f'{self.user}'