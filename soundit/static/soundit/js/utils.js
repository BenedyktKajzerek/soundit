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
    let tracks = [];
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
                        'q': track['title'],
                    }), {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + access_token['access_token'],
                            'Content-Type': 'application/json'
                        }
                    }).catch(error => console.error(error)); // errors strictly in promises
                
                    let responseJson = await response.json();

                    responseJson = responseJson['tracks']['items'][0]['id'];

                    tracks.push('spotify:track:' + responseJson);
                }
                catch (error) {
                    console.error(error);
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
                        'q': track['title'],
                        'key': access_token['api_key_yt']
                    }), {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + access_token['access_token'],
                            'Accept': 'application/json',
                        }
                    }).catch(error => console.error(error)); // errors strictly in promises
                
                    const responseJson = await response.json();

                    tracks.push(responseJson)
                }
                catch (error) {
                    console.error(error);
                }
            }
        }
    }

    return tracks;
}

// ##### add tracks/videos to playlist #####
export async function addItemsToPlaylist(service, playlistId, tracks) {
    let track, response, access_token;

    if (service === "youtube") access_token = await getUserAccessToken("spotify");
    else if (service === "spotify") access_token = await getUserAccessToken("youtube");

    if (service === "youtube") { // add tracks on spotify
        // max size of items to add to playlist at once
        let chunkSize = 100;
        
        if (tracks.length > 100) {
            tracks = splitArray(tracks, chunkSize)
        }

        for (const item in tracks) {
            track = tracks[item];

            try {
                response = await fetch(BASE_URL_SPOTIFY + `playlists/${playlistId}/tracks?`, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + access_token['access_token'],
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'uris': track
                    })
                }).catch(error => console.error(error)); // errors strictly in promises
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    if (service === "spotify") { // add tracks on youtube
        for (const item in tracks) {
            track = tracks[item];
            console.log(track);
            console.log(track['items'][0]['id']['videoId']);
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
                            'resourceId': trackId,
                        },
                    })
                }).catch(error => console.error(error)); // errors strictly in promises
            }
            catch (error) {
                console.error(error);
            }
        }
    }
}

// divide array into smaller (100 items) arrays
function splitArray(array, chunkSize) {
    let result = [];
    let len = array.length;
    for (let i = 0; i < len; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}