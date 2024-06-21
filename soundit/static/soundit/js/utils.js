const BASE_URL_SPOTIFY = "https://api.spotify.com/v1/";
const BASE_URL_YOUTUBE = "https://www.googleapis.com/youtube/v3/";

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
                else throw new Error("Unsupported service type");
            });
        }
    })
    .catch(error => console.error(error));
}

// Get user's access token (needed for api calls)
async function getUserAccessToken(service) {
    const response = await fetch(`get_user_access_token/${service}`)
    .catch(error => console.error(error)); // errors strictly in promises

    // Check server HTTP response (status code 200-299)
    if (!response.ok) throw new Error(`An error has occured: ${response.status}`);
    
    const access_token = await response.json();

    return access_token;
}

// Get user's profile id (needed to create playlist)
async function getUserProfileId(service) {
    const access_token = await getUserAccessToken(service);

    const response = await fetch(BASE_URL_SPOTIFY + 'me', {
        method: 'GET',
        headers: {'Authorization': 'Bearer ' + access_token['access_token']}
    }).catch(error => console.error(error)); // errors strictly in promises
    
    // Check server HTTP response (status code 200-299)
    if (!response.ok) throw new Error(`An error has occured: ${response.status}`);

    const userProfile = await response.json();

    return userProfile['id'];
}

// ##### base function called multiple times by getEveryPlaylistItem() #####
async function getPlaylistItems(service, playlistId, endpoint) {
    // Step 1: get user access token
    const access_token = await getUserAccessToken(service); 
    
    // Step 2: retrieve playlist items
    let response;
    if (service === "spotify") {
        response = await fetch(BASE_URL_SPOTIFY + `playlists/${playlistId}/tracks` + endpoint, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + access_token['access_token']},
        }).catch(error => console.error(error)); // errors strictly in promises
    }
    else if (service === "youtube") {
        response = await fetch(BASE_URL_YOUTUBE + 'playlistItems?' + new URLSearchParams({
            'part': 'snippet,contentDetails,status',
            'maxResults': 50,
            'playlistId': playlistId,
            'key': access_token['api_key_yt']
        }) + endpoint, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + access_token['access_token'],
                'Accept': 'application/json',
            },
        }).catch(error => console.error(error)); // errors strictly in promises
    } else throw new Error("Unsupported service type");

    // Check server HTTP response (status code 200-299)
    if (!response.ok) {
        throw new Error(`An error has occured: ${response.status}`);
    }
    
    let tracks = await response.json();

    return tracks;
}

// ##### call getPlaylistItems() x times and return all the results #####
export async function getEveryPlaylistItem(service, playlistId) {
    let tracks = [];

    if (service === "spotify") {
        let offset = 0;
        let limit = 100;

        try {
            while (true) {
                let endpoint = `?offset=${offset}&limit=${limit}`;

                // Get another tracks
                let response = await getPlaylistItems(service, playlistId, endpoint);
                tracks = tracks.concat(response['items'], []);

                // Update values
                offset += limit;

                // Check if there's more
                if (offset >= response['total']) break;
             }
        }
        catch (error) {
            console.error(error);
        }
    }
    else if (service === "youtube") {
        let nextPageToken = null;

        try {
            while (true) {
                let endpoint = '';
                if (nextPageToken) {
                    endpoint += `&pageToken=${nextPageToken}`;
                }

                // Get another tracks
                let response = await getPlaylistItems(service, playlistId, endpoint);
                tracks = tracks.concat(response['items'], []);
                
                // Update values
                nextPageToken = response['nextPageToken'];
                
                // Check if there's more
                if (!nextPageToken) break;
             }
        }
        catch (error) {
            console.error(error);
        }
    } else throw new Error("Unsupported service type");

    return tracks;
}

// ##### create playlist #####
export async function createPlaylist(service, title, description, isSetToPublic) {
    let createdPlaylist, access_token;

    if (service === "youtube") access_token = await getUserAccessToken("spotify");
    else if (service === "spotify") access_token = await getUserAccessToken("youtube");
    
    if (service === "youtube") { // create playlist on spotify
        const userId = await getUserProfileId("spotify");

        try {
            createdPlaylist = await fetch(BASE_URL_SPOTIFY + `users/${userId}/playlists`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + access_token['access_token'],
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'name': title,
                    'description': description,
                    'public': isSetToPublic
                })
            }).catch(error => console.error(error)); // errors strictly in promises
        }
        catch (error) {
            console.error(error);
        }
    }
    else if (service === "spotify") { // create playlist on youtube
        let privacyStatus = (isSetToPublic === true) ? "public" : "private";

        try {
            createdPlaylist = await fetch(BASE_URL_YOUTUBE + 'playlists?' + new URLSearchParams({
                'part': 'snippet',
                'key': access_token['api_key_yt']
            }), {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + access_token['access_token'],
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "snippet": {
                        "title": title,
                        "description": description,
                    }, // status not working 
                    // "status": {
                    //     "privacyStatus": privacyStatus
                    // },
                })
            }).catch(error => console.error(error)); // errors strictly in promises
        }
        catch (error) {
            console.error(error);
        }
    } else throw new Error("Unsupported service type");

    createdPlaylist = await createdPlaylist.json();

    return createdPlaylist['id'];
}

// ##### get ID for every searched track/video #####
export async function searchTracksForItsId(service, items) {
    let tracks = {
        'searchedTracks': [],
        'failedTracks': [],
    };
    let track, response, access_token;

    if (service === "youtube") access_token = await getUserAccessToken("spotify");
    else if (service === "spotify") access_token = await getUserAccessToken("youtube");

    if (service === "youtube") { // search for spotify tracks
        for (const item in items) {
            track = items[item];

            if (track['isChecked']) {
                try {
                    response = await fetch(BASE_URL_SPOTIFY + 'search?' + new URLSearchParams({
                        'type': 'track',
                        'limit': 1,
                        'q': track['title'] + " " + track['artist'],
                    }), {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + access_token['access_token'],
                            'Content-Type': 'application/json'
                        }
                    }).catch(error => { // errors strictly in promises
                        console.error(error);
                        tracks['failedTracks'].push(track);
                    }); 
                    
                    let responseJson = await response.json();
                    
                    // create uris to add multiple track at once
                    responseJson = responseJson['tracks']['items'][0]['id'];
                    
                    tracks['searchedTracks'].push('spotify:track:' + responseJson);
                }
                catch (error) {
                    console.error(error);
                    tracks['failedTracks'].push(track);
                }
            }
        }
    }
    if (service === "spotify") { // search for youtube tracks
        for (const item in items) {
            track = items[item];

            if (track['isChecked']) {
                try {
                    response = await fetch(BASE_URL_YOUTUBE + 'search?' + new URLSearchParams({
                        'part': 'snippet',
                        'maxResults': 1,
                        'type': 'video',
                        'q': track['title'] + " " + track['artist'],
                        'key': access_token['api_key_yt']
                    }), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + access_token['access_token'],
                            'Accept': 'application/json',
                        }
                    }).catch(error => { // errors strictly in promises
                        console.error(error);
                        tracks['failedTracks'].push(track);
                    }); 
                
                    const responseJson = await response.json();

                    tracks['searchedTracks'].push(responseJson);
                }
                catch (error) {
                    console.error(error);
                    tracks['failedTracks'].push(track);
                }
            }
        }
    }

    return tracks;
}

// ##### add tracks/videos to playlist #####
export async function addItemsToPlaylist(service, playlistId, tracks) {

    // convertion progress
    const progressNominator = document.querySelector('#progress-nominator');
    const progressDenominator = document.querySelector('#progress-denominator');
    const progressPercentage = document.querySelector('#progress-percentage');

    const progressFrom = document.querySelector('#progress-from');
    const progressTo = document.querySelector('#progress-to');

    let track, response, access_token;

    if (service === "youtube") { 
        access_token = await getUserAccessToken("spotify");
    
        // from service to service (on progress modal)
        progressFrom.src = "{% static 'soundit/media/mini-logo/youtube-svgrepo-com.svg' %}";
        progressFrom.alt = "YouTube logo";
        
        progressTo.src = "{% static 'soundit/media/mini-logo/spotify-svgrepo-com.svg' %}";
        progressTo.alt = "Spotify logo";
    }
    else if (service === "spotify") access_token = await getUserAccessToken("youtube");

    progressDenominator.innerHTML = tracks.length;

    if (service === "youtube") { // add tracks on spotify
        // max size of items to add to playlist at once
        let chunkSize = 100;
        let items;

        for (let i = 0, l = tracks.length; i < l; i += chunkSize) {
            items = tracks.slice(i, i + chunkSize);
            
            try {
                response = await fetch(BASE_URL_SPOTIFY + `playlists/${playlistId}/tracks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + access_token['access_token'],
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'uris': items
                    })
                }).catch(error => console.error(error)); // errors strictly in promises
                console.log(response);
            }
            catch (error) {
                console.error(error);
            }

            // update convertion progress
            progressNominator.innerHTML = parseInt(items.length) + 1;
            progressPercentage.innerHTML = Math.round(100 * (parseInt(items.length) + 1) / l);
        }
    }
    if (service === "spotify") { // add tracks on youtube
        for (const item in tracks) {
            track = tracks[item];
            let trackId = track['items'][0]['id']['videoId'];

            try {
                response = await fetch(BASE_URL_YOUTUBE + 'playlistItems?' + new URLSearchParams({
                    'part': 'snippet',
                    'key': access_token['api_key_yt']
                }), {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + access_token['access_token'],
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'snippet': {
                            'playlistId': playlistId,
                            'resourceId': {
                                'kind': 'youtube#video',
                                'videoId': trackId
                            }
                        },
                    })
                }).catch(error => console.error(error)); // errors strictly in promises
            }
            catch (error) {
                console.error(error);
            }

            // update convertion progress
            progressNominator.innerHTML = parseInt(item) + 1;
            progressPercentage.innerHTML = Math.round(100 * (parseInt(item) + 1) / tracks.length);
        }
    }
}

// ##### delete multiple playlists at once #####
export async function deletePlaylistAPI(service, playlistId) {
    let response;
    let access_token = await getUserAccessToken(service);

    if (service === "spotify") {
        response = await fetch(BASE_URL_SPOTIFY + `playlists/${playlistId}/followers`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + access_token['access_token'],
            }
        }).catch(error => console.error(error)); // errors strictly in promises
    }
    else if (service === "youtube") {
        response = await fetch(BASE_URL_YOUTUBE + 'playlists?' + new URLSearchParams({
            'id': playlistId,
            'key': access_token['api_key_yt']
        }), {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + access_token['access_token'],
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        }).catch(error => console.error(error)); // errors strictly in promises
    }
}
