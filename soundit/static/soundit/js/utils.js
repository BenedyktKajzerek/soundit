const BASE_URL_SPOTIFY = "https://api.spotify.com/v1/";
const BASE_URL_YOUTUBE = "https://youtube.googleapis.com/youtube/v3/";

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

// Get user's access token (needed for api calls)
async function getUserAccessToken(service) {
    const response = await fetch(`get_user_access_token/${service}`)
    .catch(error => console.log(error)); // errors strictly in promises

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
    }).catch(error => console.log(error)); // errors strictly in promises

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
    let response2;
    if (service === "spotify") {
        response2 = await fetch(BASE_URL_SPOTIFY + `playlists/${playlistId}/tracks` + endpoint, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + access_token['access_token']},
        }).catch(error => console.log(error)); // errors strictly in promises
    }
    else if (service === "youtube") {
        response2 = await fetch(BASE_URL_YOUTUBE + 'playlistItems?' + new URLSearchParams({
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
        }).catch(error => console.log(error)); // errors strictly in promises
    }

    // Check server HTTP response (status code 200-299)
    if (!response2.ok) {
        throw new Error(`An error has occured: ${response.status}`);
    }
    
    let tracks = await response2.json();

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
            console.log(error);
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
            console.log(error);
        }
    } 
    else {
        throw new Error("Unsupported service type");
    }

    return tracks;
}

// #####  #####
export async function createPlaylist(service, title, description, isSetToPublic) {
    let createdPlaylist;

    const access_token = await getUserAccessToken(service);

    const userId = await getUserProfileId(service);

    if (service === "spotify") {
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
            }).catch(error => console.log(error)); // errors strictly in promises
        }
        catch (error) {
            console.log(error);
        }
    }
    else if (service === "youtube") {
        try {

        }
        catch (error) {
            console.log(error);
        }
    } 
    else {
        throw new Error("Unsupported service type");
    }

    createdPlaylist = await createdPlaylist.json();

    return createdPlaylist['id'];
}

// #####  #####
export async function searchTracksForItsId(service) {

}

// #####  #####
export async function addItemsToPlaylist(service) {
    
}