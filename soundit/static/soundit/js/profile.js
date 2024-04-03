document.addEventListener('DOMContentLoaded', () => {

    // ##### responsive navbar #####
    const nav = document.querySelector('.responsive-nav');
    const navBtn = document.querySelector('.hamburger');

    window.addEventListener('click', function(e) {
        if (navBtn.contains(e.target)) {
            nav.classList.add('display-nav');
        }
        else if (!nav.contains(e.target) && !navBtn.contains(e.target)){
            nav.classList.remove('display-nav');
        }
    });

    // ##### settings #####
    const settingsBtn = document.querySelector('#settings-btn');

    settingsBtn.addEventListener('click', () => {
        // document.querySelector('.settings').classList.toggle('display-block');        
        console.log("settings");
    });

    // ##### search playlist #####
    const playlists = document.querySelectorAll('.playlist');

    // search playlists by title
    document.querySelector('#searchPlaylist').addEventListener('input', function() {
        const searchValue = this.value.toLowerCase();

        playlists.forEach(function(playlist) {
            const playlistName = playlist.getAttribute('data-playlistname').toLowerCase();
            
            if (playlistName.includes(searchValue)) {
                playlist.style.display = 'flex';
            }
            else {
                playlist.style.display = 'none';
            }

        });

    });

    // ##### selecting playlists #####
    let checkboxes = document.querySelectorAll('input[type=checkbox]');

    console.log(checkboxes);

    checkboxes.forEach(function(checkbox) {
        
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // this.parentElement.classList.add('display-block')
                console.log('checked');
            }
            else {
                // this.parentElement.classList.remove('display-block')
                console.log('not checked');
            }
        })
    });

    // ##### connecting to services #####
    const addSpotify = document.querySelector('#add-spotify');
    const addYouTube = document.querySelector('#add-youtube');

    document.querySelector('.add-service').addEventListener('click', () => {
        document.querySelector('.services-to-connect').classList.toggle('display-block');
    });

    addSpotify.addEventListener('click', () => {
        authenticateSpotify();
    });

    addYouTube.addEventListener('click', () => {
        authenticateYouTube();
    });

    // ##### Spotify API Connection #####
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
    
    // ##### YouTube API Connection #####
    function authenticateYouTube() {
        fetch('/profile/youtube/is-authenticated')
        .then(response => response.json())
        .then(data => {

            if (!data.status) {
                fetch('/profile/youtube/get-auth-url')
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    // Open prepared url from class AuthURL
                    window.location.replace(data.url[0]);
                })
            }
        })
    }

});
