# Soundit - CS50 Web's Final Project

Soundit is a web application that allows you to seamlessly transfer your playlists between different streaming services, currently supporting YouTube and Spotify. Users can select the playlist they wish to transfer, edit details such as the title and description, and choose specific songs to include in the transfer. The intuitive interface ensures a smooth and user-friendly experience, making it easy for anyone to use. Future updates will expand support to more streaming services, offering even greater flexibility.

# Distinctiveness and Complexity

Soundit provides a unique functionality which is transfering playlists between streaming services. It allows users to edit playlist details, select specific songs for transfer, and manage API tokens.

Soundit stands out for its focus on user security and data privacy. By leveraging OAuth 2.0, the application ensures secure authentication and authorization processes, allowing users to safely connect their YouTube and Spotify accounts without compromising their credentials.

Soundit uses Django for authentication with OAuth to integrate with streaming services. Permissions and access control are implemented to ensure users can only manage their own data and perform authorized actions. Functions in utils.py manage API interactions, including fetching user playlists, verifying token validity, and ensuring secure communication with external services.

The front-end includes a lot of dynamic functionalities and user interactions. It involves complex API interactions for user authentication and playlist fetching from connected services. Soundit is designed to be mobile-responsive, ensuring a seamless user experience on various devices.

# Features

- **Transferring Playlists**: Users can select any playlist from their library on YouTube or Spotify by searching its title. They can then edit the playlist details such as the title or description and choose which songs to transfer. With a single click, users can move their modified playlist from one service to another. If an error occurs, a list of songs that couldn't be transferred will be provided.
- **Deleting Playlists**: Users can select multiple playlists and delete them all at once.
- **Statistics**: Users can view statistics of their activities, including the number of playlists and songs transferred or deleted. A summary of these statistics is available on the homepage, showing combined data from all Soundit users. 
- **User-Friendly Interface**: The app features a simple and intuitive interface, making it easy to navigate. Soundit is fully responsive, ensuring an excellent experience on all devices.
- **FAQ Page**: Users can access a FAQ page that provides answers to common questions, helping them make the most of the app's features.

# Technologies

The Soundit web applications was built using following technologies:
- **HTML, CSS, JavaScript**: For the structure, styling, and interactivity of the web pages.
- **Python, Django, SQLite3**: For the backend logic, framework, and database management.
- **YouTube and Spotify API**: To access and manage user playlists on these platforms.
- **Additional**: OAuth 2.0, JSON

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
  - `.env` - API keys for Spotify and YouTube.
    - CLIENT_ID="", CLIENT_SECRET="", CLIENT_ID_YT="", CLIENT_SECRET_YT="", API_KEY_YT = ''

# Installation
Soundit integrates with the Google (YouTube) and Spotify APIs. To enable the application to function and obtain API keys, you must create developer apps on both platforms. These keys are already stored in a `.env` file.
- Clone this repository
- Navigate to the project directory
- Install necessary packages: `pip install -r requirements.txt`
- run `python manage.py migrate`
- run `python manage.py runserver`

# Future Updates
Future updates to Soundit will focus on expanding support to additional streaming services such as Apple Music or Amazon Music providing even greater flexibility for users. We also plan to introduce advanced playlist customization options, and more detailed statistics for users. User feedback will play a big role in shaping these improvements. Thank you and please stay tuned for new features and enhancements!

### Video https://www.youtube.com/watch?v=Ie3oP42kSao
