import { 
    authenticateService, 
    getEveryPlaylistItem, 
    createPlaylist,
    searchTracksForItsId,
    addItemsToPlaylist 
} from "/static/soundit/js/utils.js";
    
// services
const addSpotify = document.querySelector('#add-spotify');
const addYouTube = document.querySelector('#add-youtube');

// navbar 
const nav = document.querySelector('.responsive-nav');
const navBtn = document.querySelector('.hamburger');
const settingsBtn = document.querySelector('#settings-btn');

// header - playlist options
const numberOfSelected = document.querySelector('#number-of-selected');
const selectAllBtn = document.querySelector('.select-all');
const convertBtn = document.querySelector('#convert-btn');
const deleteBtn = document.querySelector('#delete-btn');
const searchPlaylist = document.querySelector('#searchPlaylist')

// playlists
const playlists = document.querySelectorAll('.playlist');
const playlistsCheckboxes = document.querySelectorAll('.playlist-checkbox');

// modal
const modal = document.querySelector('.modal-overlay');
const closeBtns = document.querySelectorAll('.modal-close-btn');
const modalContainerConvert = document.querySelector('#modal-container-convert');
const modalContainerTracks = document.querySelector('#modal-container-tracks');
const modalContainerFailed = document.querySelector('#modal-container-failed');
const modalContainerDelete = document.querySelector('.modal-container-delete');

// Step 1: modal (convert)
const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');
const convertFromSpan = document.querySelector('#convert-from');
const convertToSpan = document.querySelector('#convert-to');

// Step 2: modal (convert)
const tracksTotal = document.querySelector('#tracks-total');
const tracksSelected = document.querySelector('#tracks-selected');
const tracksContainer = document.querySelector('#tracks-container');
const convertPlaylistBtn = document.querySelector('.modal-convert-btn');

// Step 3: modal (failed tracks)
const failedTracks = document.querySelector('#failed-tracks');
const failedTracksContainer = document.querySelector('#failed-tracks-container');

const modalDeleteBtn = document.querySelector('.modal-delete-btn');
const modalBtns = document.querySelectorAll('.modal-confirm-btn');

let checkedPlaylists = [];
let checkedTracks = [];

// ##### responsive navbar #####

window.addEventListener('click', function(e) {
    if (navBtn.contains(e.target)) {
        nav.classList.add('display-nav');
    }
    else if (!nav.contains(e.target) && !navBtn.contains(e.target)){
        nav.classList.remove('display-nav');
    }
});

// ##### settings #####

settingsBtn.addEventListener('click', () => {
    console.log("settings");
});

// ##### search playlist #####

// search playlists by title
searchPlaylist.addEventListener('input', function() {
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

playlistsCheckboxes.forEach(function(checkbox) {
    // style checkboxes and update checked list
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            // style checkbox (select-div and num-add)
            this.parentElement.style.display = 'block';
            this.parentElement.previousElementSibling.style.display = "none";
        
            // push selected playlist 
            checkedPlaylists.push(this);
        }
        else {
            this.parentElement.style.display = '';
            this.parentElement.previousElementSibling.style.display = "";
        
            let index = checkedPlaylists.indexOf(this);
            if (index !== -1) {
                checkedPlaylists.splice(index, 1);
            }
        }
        checkSelectedCheckboxes();
    });
});

// select all playlists at once
selectAllBtn.addEventListener('change', function() {
    if (this.checked) {
        playlistsCheckboxes.forEach(function(checkbox) {
            checkbox.checked = true;
            checkbox.parentElement.style.display = 'block';
            checkbox.parentElement.previousElementSibling.style.display = "none";
        
            // add only if not already in list
            if (!checkedPlaylists.includes(checkbox)) {
                checkedPlaylists.push(checkbox);
            }
        });
    }
    else {
        playlistsCheckboxes.forEach(function(checkbox) {
            checkbox.checked = false;
            checkbox.parentElement.style.display = '';
            checkbox.parentElement.previousElementSibling.style.display = "";
        
            let index = checkedPlaylists.indexOf(checkbox);
            if (index !== -1) {
                checkedPlaylists.splice(index, 1);
            }
        });        
    }
    checkSelectedCheckboxes();
});

// update currently available playlist options (convert, delete)
function checkSelectedCheckboxes() {
    const len = checkedPlaylists.length;

    // disable/enable convert button
    if (len !== 1) {
        convertBtn.disabled = true;
        convertBtn.classList.add('btn-disabled');
    } else {
        convertBtn.disabled = false;
        convertBtn.classList.remove('btn-disabled');
    }
    
    // disable/enable delete button
    if (len === 0) {
        deleteBtn.disabled = true;
        deleteBtn.classList.add('btn-disabled');
    } else {
        deleteBtn.disabled = false;
        deleteBtn.classList.remove('btn-disabled');
    }

    numberOfSelected.innerHTML = len;
}
checkSelectedCheckboxes();

// ##### Modal - converting/deleting playlists #####

// process every track from selected playlist
function processTrack(service, items, trackElem, tracksContainer, checkedTracks) {
    // count needed to not include unavailable videos on youtube
    let count = 1;

    for (const item in items) {
        let track, title, artist, image;

        if (service === "spotify") {
            track = items[item]['track'];
        } else if (service === "youtube") {
            // Ensure video is listed as public (available)
            if (items[item]['status']['privacyStatus'] !== "public") continue;
            track = items[item];
        }
    
        const clone = trackElem.cloneNode(true);
        tracksContainer.appendChild(clone);

        if (service === "spotify") {
            clone.dataset.trackid = track['id'];
            clone.querySelector('#track-number').innerHTML = parseInt(item) + 1;
            clone.querySelector('.track-checkbox').dataset.id = parseInt(item) + 1;
            title = track['name'];
            artist = track['artists'][0]['name'];
            image = track['album']['images'][0]['url'];
            clone.querySelector('#track-title').innerHTML = title;
            clone.querySelector('#track-artists').innerHTML = artist;
            clone.querySelector('#track-image').src = image;
        } else if (service === "youtube") {
            clone.dataset.trackid = track['contentDetails']['videoId'];
            clone.querySelector('#track-number').innerHTML = count;
            clone.querySelector('.track-checkbox').dataset.id = count;
            title = track['snippet']['title'];
            artist = track['snippet']['videoOwnerChannelTitle'];
            image = track['snippet']['thumbnails']['default']['url'];
            clone.querySelector('#track-title').innerHTML = title;
            clone.querySelector('#track-artists').innerHTML = artist;
            clone.querySelector('#track-image').src = image;
            count++;
        }

        clone.querySelector('.track-checkbox').checked = true;

        // add track to track list
        checkedTracks.push({
            'trackId': clone.dataset.trackid,
            'image': image,
            'artist': artist,
            'title': title,
            'isChecked': true,
        });
    }
}

async function showTrackListModal(service) {
    // save user configuration 
    const title = document.querySelector('#title').value;
    const description = document.querySelector('#description').value;
    const isSetToPublic = document.querySelector('#privacy-status').checked;

    const playlistId = checkedPlaylists[0].parentElement.parentElement.parentElement.dataset.playlistid;

    const items = await getEveryPlaylistItem(service, playlistId);

    const trackElem = document.querySelector('.track-container');

    // show "template" track element back (incase selecting different playlist to convert)
    trackElem.style.display = "";
    // clear tracks from previously selected playlist
    tracksContainer.innerHTML = ""; 
    // clear tracks list when selecting new playlist
    checkedTracks.length = 0;
    
    // iterate over every track and edit it
    processTrack(service, items, trackElem, tracksContainer, checkedTracks);
    
    let len = checkedTracks.length; 

    // update total and selected tracks
    tracksTotal.innerHTML = len;
    tracksSelected.innerHTML = len;

    // keep track of selected tracks
    const tracksCheckboxes = document.querySelectorAll('.track-checkbox');
    tracksCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            checkedTracks[this.dataset.id - 1].isChecked = this.checked;

            if (this.checked) len++;
            else if (!this.checked) len--;

            tracksSelected.innerHTML = len;
        });
    });

    // hide "template" track element
    trackElem.style.display = "none";

    // show current modal, hide previous one
    modalContainerConvert.classList.remove('display-block');
    modalContainerTracks.classList.add('display-block');

    convertPlaylistBtn.addEventListener('click', () => {
        convertPlaylist(service, title, description, isSetToPublic, checkedTracks);
    });
}

async function convertPlaylist(service, title, description, isSetToPublic, items) {

    // const playlistId = await createPlaylist(service, title, description, isSetToPublic);
    
    const tracks = await searchTracksForItsId(service, items);

    // await addItemsToPlaylist(service, playlistId, tracks['searchedTracks']);

    const trackElem = document.querySelector('.failed-track-container');

    // show "template" track element back (incase selecting different playlist to convert)
    trackElem.style.display = "";
    // clear tracks from previously selected playlist
    failedTracksContainer.innerHTML = ""; 

    for (const item in tracks['failedTracks']) {
        let track = tracks['failedTracks'][item];
    
        const clone = trackElem.cloneNode(true);
        failedTracksContainer.appendChild(clone);

        clone.querySelector('#track-number').innerHTML = parseInt(item) + 1;
        clone.querySelector('#track-image').src = track['image'];
        clone.querySelector('#track-title').innerHTML = track['title'];
        clone.querySelector('#track-artists').innerHTML = track['artist'];
    }

    // update total tracks
    failedTracks.innerHTML = tracks['failedTracks'].length;

    // hide "template" track element
    trackElem.style.display = "none";

    modalContainerTracks.classList.remove('display-block');
    modalContainerFailed.classList.add('display-block');
}

function deletePlaylist() {
    console.log("DELETE PLAYLIST");
}

// ##### EventListeners #####

// display services available to connect
document.querySelector('.add-service').addEventListener('click', () => {
    document.querySelector('.services-to-connect').classList.toggle('display-block');
});

// if not already connected with spotify/youtube
try {
    addSpotify.addEventListener('click', () => {
        authenticateService("spotify");
    });
} catch (err) { /* ignore err */ }

try {
    addYouTube.addEventListener('click', () => {
        authenticateService("youtube");
    });
} catch (err) { /* ignore err */ }

// open modal with settings
// settingsBtn.addEventListener('click', () => {
//     modal.classList.add('open-modal');
// })

// open convert modal
convertBtn.addEventListener('click', () => {
    const playlist = checkedPlaylists[0].parentElement.parentElement.parentElement;

    // use title and description from current playlist
    titleInput.value = playlist.dataset.playlistname;
    descriptionInput.value = playlist.dataset.playlistdescription;

    // style "transfer from .. to .." spans
    const service = playlist.dataset.service;
    
    const from = service === "spotify" ? "Spotify" : "YouTube";
    const to = service === "spotify" ? "YouTube" : "Spotify";
    convertFromSpan.innerHTML = from;
    convertFromSpan.style.color = `var(--${service})`;
    convertToSpan.innerHTML = to;
    convertToSpan.style.color = `var(--${to.toLowerCase()})`;

    // show modal
    modal.classList.add('open-modal');
    modalContainerConvert.classList.add('display-block');
});

// open delete modal
deleteBtn.addEventListener('click', () => {
    // show modal
    modal.classList.add('open-modal');
    modalContainerDelete.classList.add('display-block');
});

// close and hide modal
closeBtns.forEach(function (btn) {
    btn.addEventListener('click', function() {
        modal.classList.remove('open-modal');
        btn.parentElement.parentElement.classList.remove('display-block');
    });
});

// "confirmation" buttons in convert modal
modalBtns.forEach(function(btn) {
    btn.addEventListener('click', () => {
        if (btn.value === "next") {
            const service = convertFromSpan.innerHTML.toLowerCase();
            showTrackListModal(service);
        } else if (btn.value === "close") {
            modal.classList.remove('open-modal');
            modalContainerFailed.classList.remove('display-block');
        }
    });
});

// delete playlist
modalDeleteBtn.addEventListener('click', () => {
    deletePlaylist();
});
