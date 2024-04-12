// ##### API Connection for Spotify/Youtube #####
export function authenticateService(service) {
    fetch(`/profile/${service}/is-authenticated`)
    .then(response => response.json())
    .then(data => {

        if (!data.status) {
            fetch(`/profile/${service}/get-auth-url`)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                // Open prepared url from class AuthURL
                if (service === "spotify") window.location.replace(data.url);
                else if (service === "youtube") window.location.replace(data.url[0]);
            });
        }
    });
}

export function getPlaylistItems(service, playlistId) {
    // get user access token
    fetch(`get_user_access_token/${service}`)
    .then(response => response.json())
    .then(data => {
        
        // retrieve playlist items
        fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            method: 'GET',
            headers: {'Authorization': `Bearer ` + data['access_token']},
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        });
    });
}
