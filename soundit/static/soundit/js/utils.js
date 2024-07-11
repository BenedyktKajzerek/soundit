const BASE_URL_SPOTIFY = "https://api.spotify.com/v1/";
const BASE_URL_YOUTUBE = "https://www.googleapis.com/youtube/v3/";

// ##### API Connection for Spotify/Youtube #####
export function authenticateService(service) {
    // fetch(`/profile/${service}/is-authenticated`)
    // .then(response => response.json())
    // .then(data => {

    //     if (!data.status) {
            fetch(`/profile/${service}/get-auth-url`)
            .then(response => response.json())
            .then(data => {
                
                // Open prepared url from class AuthURL
                if (service === "spotify") window.location.replace(data.url);
                else if (service === "youtube") window.location.replace(data.url[0]);
                else throw new Error("Unsupported service type");
            });
    //     }
    // })
    // .catch(error => console.error("Failed to authenticate service."));
}

// Get user's access token (needed for api calls)
async function getUserAccessToken(service) {
    const response = await fetch(`get_user_access_token/${service}`)
    .catch(error => console.error("Failed to get user access token.")); // errors strictly in promises

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
    }).catch(error => console.error("Failed to get user profile id for YouTube.")); // errors strictly in promises
    
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
        }).catch(error => console.error(`Failed to get playlist items for ${service}.`)); // errors strictly in promises
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
        }).catch(error => console.error(`Failed to get playlist items for ${service}.`)); // errors strictly in promises
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

    try {
        if (service === "spotify") {
            let offset = 0;
            const limit = 100;
    
            while (true) {
                const endpoint = `?offset=${offset}&limit=${limit}`;
                const response = await getPlaylistItems(service, playlistId, endpoint);

                tracks = tracks.concat(response['items'], []);
                
                offset += limit;
                if (offset >= response['total']) break;
            }
        }
        else if (service === "youtube") {
            let nextPageToken = null;

            do {
                const endpoint = nextPageToken ? `&pageToken=${nextPageToken}` : '';
                const response = await getPlaylistItems(service, playlistId, endpoint);

                tracks = tracks.concat(response['items'], []);
                nextPageToken = response['nextPageToken'];
            } while (nextPageToken);
        } else {
            throw new Error("Unsupported service type.");
        }
    } catch (error) {
        console.error(`Failed to get playlist items for service ${service}.`)
    }

    return tracks;
}

// ##### create playlist #####
export async function createPlaylist(service, title, description, isSetToPublic) {
    let createdPlaylist;

    const access_token = await getUserAccessToken(service === "youtube" ? "spotify" : "youtube");
    
    try {
        if (service === "youtube") { // create playlist on spotify
            const userId = await getUserProfileId("spotify");
    
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
            }).catch(error => console.error("Failed to create playlist.")); // errors strictly in promises
        }
        else if (service === "spotify") { // create playlist on youtube
            const privacyStatus = isSetToPublic ? "public" : "private";
    
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
            }).catch(error => console.error("Failed to create playlist.")); // errors strictly in promises
        } else {
            throw new Error("Unsupported service type");
        }

        await updateAppStats("playlists", 1);
    } catch (error) {
        console.error('Failed to create a playlist.');
    }
    
    const playlistData = await createdPlaylist.json();
    return playlistData['id'];
}

// ##### get ID for every searched track/video #####
export async function searchTracksForItsId(service, items) {
    let tracks = {
        'searchedTracks': [],
        'failedTracks': [],
    };

    try {
        const access_token = await getUserAccessToken(service === "youtube" ? "spotify" : "youtube");

        for (const item of items) {
            if (!item['isChecked']) continue;

            // Create a query
            let query, url, headers;
            if (service === "youtube") {
                query = new URLSearchParams({
                    'type': 'track',
                    'limit': 1,
                    'q': `${item['title']} ${item['artist']}`,
                });
                url = BASE_URL_SPOTIFY + 'search?' + query.toString();
                headers = {
                    'Authorization': 'Bearer ' + access_token['access_token'],
                    'Content-Type': 'application/json'
                };
            } else if (service === "spotify") {
                query = new URLSearchParams({
                    'part': 'snippet',
                    'maxResults': 1,
                    'type': 'video',
                    'q': `${item['title']} ${item['artist']}`,
                    'key': access_token['api_key_yt']
                });
                url = BASE_URL_YOUTUBE + 'search?' + query.toString();
                headers = {
                    'Authorization': 'Bearer ' + access_token['access_token'],
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                };
            } else {
                throw new Error("Unsupported service type");
            }

            // Call the API
            try {
                const response = await fetch(url, { method: 'GET', headers });

                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                
                const responseData = await response.json();
                
                if (service === "youtube") {
                    const trackId = responseData['tracks']['items'][0]['id'];
                    tracks['searchedTracks'].push('spotify:track:' + trackId);
                } else if (service === "spotify") {
                    tracks['searchedTracks'].push(responseData);
                }
            } catch (error) {
                console.error(`Failed to search track for ${item['title']} by ${item['artist']}: ${error.message}`);
                tracks['failedTracks'].push(item);
            }
        }
    } catch (error) {
        console.error(`Failed to get access token for service ${service}: ${error.message}`);
    }

    return tracks;
}

// ##### add tracks/videos to playlist #####
export async function addItemsToPlaylist(service, playlistId, tracks) {
    
    // convertion progress
    const progressNominator = document.querySelector('#progress-nominator');
    const progressDenominator = document.querySelector('#progress-denominator');
    const progressPercentage = document.querySelector('#progress-percentage');
    
    progressDenominator.innerHTML = tracks.length;

    let track, response;
    const access_token = await getUserAccessToken(service === "youtube" ? "spotify" : "youtube");

    try {
        if (service === "youtube") {
            // Add tracks on spotify (100 per 1 api call)
            const chunkSize = 100;
    
            for (let i = 0, l = tracks.length; i < l; i += chunkSize) {
                const items = tracks.slice(i, i + chunkSize);
                
                response = await fetch(BASE_URL_SPOTIFY + `playlists/${playlistId}/tracks`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + access_token['access_token'],
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 'uris': items })
                }).catch(error => console.error("Failed to add items to playlist.")); // errors strictly in promises
            }
        }
        if (service === "spotify") {
            // Add tracks on youtube
            for (const item in tracks) {
                track = tracks[item];
                const trackId = track['items'][0]['id']['videoId'];
    
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
                }).catch(error => console.error("Failed to add items to playlist.")); // errors strictly in promises

                // update convertion progress
                progressNominator.innerHTML = parseInt(item) + 1;
                progressPercentage.innerHTML = Math.round(100 * (parseInt(item) + 1) / tracks.length);
            }
        }

        await updateAppStats("tracks", tracks.length);
    } catch (error) {
        console.error("Failed to add items to playlist.");
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
        }).catch(error => console.error("Failed to delete playlist.")); // errors strictly in promises
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
        }).catch(error => console.error("Failed to delete playlist.")); // errors strictly in promises
    }

    await updateAppStats("delete", 1);
}

async function updateAppStats(action, value) {
    await fetch('/profile/update_appstats', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'), // Function to get the CSRF token from cookies
        },
        body: JSON.stringify({
            action: action,
            value: value
        }),
        dataType: "json"
    }).catch(error => console.error("Failed to update app stats."))
}

// Function to get CSRF token from cookies
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
