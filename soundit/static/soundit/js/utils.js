// ##### API Connection for Spotify/Youtube #####
export function authenticateService(service) {
    fetch(`/profile/${service}/is-authenticated`)
    .then(response => response.json())
    .then(data => {

        if (!data.status) {
            fetch(`/profile/${service}/get-auth-url`)
            .then(response => response.json())
            .then(data => {
                
                // Open prepared url from class AuthURL
                if (service === "spotify") window.location.replace(data.url);
                else if (service === "youtube") window.location.replace(data.url[0]);
            });
        }
    })
    .catch(error => console.log(error));
}

export async function getPlaylistItems(service, playlistId) {
    // Step 1: get user access token
    const response = await fetch(`get_user_access_token/${service}`)
    .catch(error => console.log(error)); // errors strictly in promises

    // Check server HTTP response (status code 200-299)
    if (!response.ok) {
        throw new Error(`An error has occured: ${response.status}`);
    }

    const access_token = await response.json();


    // Step 2: retrieve playlist items
    let response2;
    if (service === "spotify") {
        response2 = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + access_token['access_token']},
        }).catch(error => console.log(error)); // errors strictly in promises
    }
    else if (service === "youtube") {
        response2 = await fetch('https://youtube.googleapis.com/youtube/v3/playlistItems?' + new URLSearchParams({
            'part': 'snippet,contentDetails,status',
            'maxResults': 50,
            'playlistId': playlistId,
            'key': access_token['api_key_yt']
        }), {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + access_token['access_token'],
                'Accept': 'application/json',
            },
        }).catch(error => console.log(error)); // errors strictly in promises
    }

    // Check server HTTP response (status code 200-299)
    if (!response2.ok) {
        throw new Error(`An error has occured: ${response.status}`);
    }

    const tracks = await response2.json();

    return tracks;
}
