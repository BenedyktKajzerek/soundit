from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):

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