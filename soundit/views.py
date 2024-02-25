from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

# from .models import ...


def index(request):
    return HttpResponse("Hi, mom!")


def login(request):
    if request.method == "POST":
        return render(request, "soundit/login.html")
    
    else:
        return render(request, "soundit/login.html")


def logout(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        return render(request, "soundit/register.html")

    else:
        return render(request, "soundit/register.html")
