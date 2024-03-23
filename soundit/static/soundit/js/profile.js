document.addEventListener('DOMContentLoaded', () => {
    
    // ===== responsive navbar =====
    const nav = document.querySelector('.responsive-nav');
    const navBtn = document.querySelector('.hamburger');

    window.addEventListener('click', function(e){
        if (navBtn.contains(e.target)) {
            nav.classList.add('display-nav');
        }
        else if (!nav.contains(e.target) && !navBtn.contains(e.target)){
            nav.classList.remove('display-nav');
        }
      });


      // ===== Spotify API =====
      document.querySelector('.add-service').addEventListener('click', () => {
        authenticateSpotify()
      })

      function authenticateSpotify() {
        fetch('/profile/spotify/is-authenticated')
        .then(response => response.json())
        .then(data => {

            if (!data.status) {
                fetch('/profile/spotify/get-auth-url')
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    // Open prepared url from class AuthURL
                    window.location.replace(data.url);
                })
            }
        })
    }


});
