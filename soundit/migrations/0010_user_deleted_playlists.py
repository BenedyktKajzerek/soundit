# Generated by Django 5.0.2 on 2024-06-28 14:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('soundit', '0009_appstats_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='deleted_playlists',
            field=models.IntegerField(default=0),
        ),
    ]
