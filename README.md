# This is my submission for CS50 Web's Final Project: Capstone.

Soundit is a web application that allows you to seamlessly transfer your playlists between different streaming services, currently supporting YouTube and Spotify. Users can select the playlist they wish to transfer, edit details such as the title and description, and choose specific songs to include in the transfer. The intuitive interface ensures a smooth and user-friendly experience, making it easy for anyone to use. Future updates will expand support to more streaming services, offering even greater flexibility.

# Installation

# Files and directories
  - `capstone` - Project directory.
    - `settings.py` - Added a few lines.
  - `soundit` - Main application directory.
    - `migrations` - Database migrations.
    - `static/soundit` Contains all static content.
        - `css` Compiled CSS file.
            - `index.css` Styles for `index.html`.
            - `profile.css` Styles for `profile.html`.
            - `style.css` General  styles for `layout.html`.
            - `about.css, faq.css, sign.css` - Additional stylesheets.
        - `js` - JavaScript files used in the project.
            - `faq.js` - Script for faq.html.
            - `index.js` - Script for index.html (handles services animation and available conversions search).
            - `profile.js` - Main application code, runs in profile.html.
            - `script.js` - Navigation toggle script, used in every template with layout.html. 
            - `utils.js` - API-related functions for profile.html.
        - `media` - Images, logos, backgrounds, and SVGs.
    - `templates/djangoapp` Contains all application templates.
        - `about.html` - Information page.
        - `faq.html` - Frequently Asked Questions.
        - `index.html` - Homepage displayed when not logged in.
        - `layout.html` - Base template, primarily for header/navigation and footer.
        - `login.html` - Login form.
        - `profile.html` - Main application interface, displayed when logged in.
        - `register.html` - Registration form.
    - `admin.py` - Contains custom admin classes.
    - `models.py` - Contains four models:
      - `AppStats` - App statistics (e.g. total transfered playlists)
      - `User` - Extends the standard User model with additional statistics.
      - `SpotifyToken` and `YouTubeToken` - Stores user tokens for API access.
    - `urls.py` - Application URLs.
    - `utils.py` - Handles user authentication with streaming services and retrieves playlists from connected services.
    - `views.py` - Contains all application views and manages user authorization with streaming services.
  - `venv` - Virtual environment.

# Distinctiveness and Complexity

Soundit provides a unique functionality which is transfering playlists between streaming services. It allows users to edit playlist details, select specific songs for transfer, and manage API tokens.

Soundit uses Django for authentication with OAuth to integrate with streaming services. Permissions and access control are implemented to ensure users can only manage their own data and perform authorized actions. Functions in utils.py manage API interactions, including fetching user playlists, verifying token validity, and ensuring secure communication with external services.

The front-end includes a lot of dynamic functionalities and user interactions. It involves complex API interactions for user authentication and playlist fetching from connected services. Soundit is designed to be mobile-responsive, ensuring a seamless user experience on various devices.
