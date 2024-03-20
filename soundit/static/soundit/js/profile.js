document.addEventListener('DOMContentLoaded', () => {

    const nav = document.querySelector('.responsive-nav');
    const navBtn = document.querySelector('.hamburger');

    // responsive navbar
    window.addEventListener('click', function(e){
        if (navBtn.contains(e.target)) {
            nav.classList.add('display-nav');
        }
        else if (!nav.contains(e.target) && !navBtn.contains(e.target)){
            nav.classList.remove('display-nav');
        }
      });

      document.querySelector('.add-service').addEventListener('click', () => {
        authenticateSpotify()
      })

      let spotifyAuthenticated = false;

      function authenticateSpotify() {
        fetch('/profile/is-authenticated')
        .then(response => response.json())
        .then(data => {
            spotifyAuthenticated = data.status;

            if (!data.status) {
                fetch('/profile/get-auth-url')
                .then(response => response.json())
                .then(data => {
                    // Open prepared url from class AuthURL
                    window.location.replace(data.url);
                })
            }
        })
    }

});