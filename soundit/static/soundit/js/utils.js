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
    })
    .catch(error => console.log(error));
}

export async function getPlaylistItems(service, playlistId) {
    // Step 1: get user access token
    const response = await fetch(`get_user_access_token/${service}`);

    // handling an error
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
        }); 
    }
    else if (service === "youtube") {
        response2 = await fetch('https://www.googleapis.com/youtube/v3/playlistItems', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + access_token['access_token'],
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // 'part': [
                //     'snippet'
                //   ],
                'maxResults': 50,
                'playlistId': 'PL12as1GfI-WEWFw1nINKKoKL0QcEHr2Am'
            },
        });
    }

    // handling an error
    if (!response2.ok) {
        throw new Error(`An error has occured: ${response.status}`);
    }

    const tracks = await response2.json();

    return tracks;
}
