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
    const checkboxes = document.querySelectorAll('.playlist-checkbox');
    
    let checked = [];
    
    checkboxes.forEach(function(checkbox) {

        checkbox.addEventListener('change', function() {
            if (this.checked) {
                // style checkbox (select-div and num-add)
                this.parentElement.style.display = 'block';
                this.parentElement.previousElementSibling.style.display = "none";
            
                // push selected playlist 
                checked.push(this);
            }
            else {
                this.parentElement.style.display = '';
                this.parentElement.previousElementSibling.style.display = "";
            
                let index = checked.indexOf(this);
                if (index !== -1) {
                    checked.splice(index, 1);
                }
            }
            checkSelectedCheckboxes()
        });
    });

    // select all playlists at once
    document.querySelector('.select-all').addEventListener('change', function() {
        if (this.checked) {
            checkboxes.forEach(function(checkbox) {
                checkbox.checked = true;
                checkbox.parentElement.style.display = 'block';
                checkbox.parentElement.previousElementSibling.style.display = "none";
            
                // add only if not already in list
                if (!checked.includes(checkbox)) {
                    checked.push(checkbox);
                }
            });
        }
        else {
            checkboxes.forEach(function(checkbox) {
                checkbox.checked = false;
                checkbox.parentElement.style.display = '';
                checkbox.parentElement.previousElementSibling.style.display = "";
            
                let index = checked.indexOf(checkbox);
                if (index !== -1) {
                    checked.splice(index, 1);
                }
            });        
        }
        checkSelectedCheckboxes()
    });

    // playlist options
    const convertBtn = document.querySelector('#convert-btn');
    const deleteBtn = document.querySelector('#delete-btn');

    function checkSelectedCheckboxes() {
        // disable/enable convert button
        if (checked.length !== 1) {
            convertBtn.disabled = true;
            convertBtn.classList.add('btn-disabled');
        }
        else {
            convertBtn.disabled = false;
            convertBtn.classList.remove('btn-disabled');
        }
        
        // disable/enable delete button
        if (checked.length === 0) {
            deleteBtn.disabled = true;
            deleteBtn.classList.add('btn-disabled');
        }
        else {
            deleteBtn.disabled = false;
            deleteBtn.classList.remove('btn-disabled');
        }
    }
    checkSelectedCheckboxes()

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
