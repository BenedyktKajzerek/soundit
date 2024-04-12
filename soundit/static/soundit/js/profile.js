import { authenticateService, getPlaylistItems } from "/static/soundit/js/utils.js";
    
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
const checkboxes = document.querySelectorAll('.playlist-checkbox');

// modal
const modal = document.querySelector('.modal-overlay');
const closeBtns = document.querySelectorAll('.modal-close-btn');
const modalContainerConvert = document.querySelector('#modal-container-convert');
const modalContainerTracks = document.querySelector('#modal-container-tracks');
const modalContainerFailed = document.querySelector('#modal-container-failed');
const modalContainerDelete = document.querySelector('.modal-container-delete');

const titleInput = document.querySelector('#title');
const descriptionInput = document.querySelector('#description');

const modalDeleteBtn = document.querySelector('.modal-delete-btn');

const modalBtns = document.querySelectorAll('.modal-confirm-btn');

let checked = [];

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

checkboxes.forEach(function(checkbox) {
    // style checkboxes and update checked list
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
        checkSelectedCheckboxes();
    });
});

// select all playlists at once
selectAllBtn.addEventListener('change', function() {
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
    checkSelectedCheckboxes();
});

// update currently available playlist options (convert, delete)
function checkSelectedCheckboxes() {
    const len = checked.length;

    // disable/enable convert button
    if (len !== 1) {
        convertBtn.disabled = true;
        convertBtn.classList.add('btn-disabled');
    }
    else {
        convertBtn.disabled = false;
        convertBtn.classList.remove('btn-disabled');
    }
    // disable/enable delete button
    if (len === 0) {
        deleteBtn.disabled = true;
        deleteBtn.classList.add('btn-disabled');
    }
    else {
        deleteBtn.disabled = false;
        deleteBtn.classList.remove('btn-disabled');
    }

    numberOfSelected.innerHTML = len;
}
checkSelectedCheckboxes();

// ##### Modal - converting/deleting playlists #####

function showTracksBeforeConverting() {
    // save users configuration 
    const service = "spotify";
    const title = document.querySelector('#title').value;
    const description = document.querySelector('#description').value;
    const privacyStatus = document.querySelector('#privacy-status').checked;
    const playlistId = checked[0].parentElement.parentElement.parentElement.dataset.playlistid;

    modalContainerConvert.classList.remove('display-block');
    modalContainerTracks.classList.add('display-block');


    getPlaylistItems(service, playlistId);
}

function convertPlaylist() {
    modalContainerTracks.classList.remove('display-block');
    modalContainerFailed.classList.add('display-block');
    console.log("CONVERT PLAYLIST");
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
    const playlist = checked[0].parentElement.parentElement.parentElement;

    // use title and description from current playlist
    titleInput.value = playlist.dataset.playlistname;
    descriptionInput.value = playlist.dataset.playlistdescription;

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
        // show playlist's tracks (step 2)
        if (btn.value === "next") showTracksBeforeConverting();
        // convert then show tracks that failed to transfer (step 3)
        else if (btn.value === "convert") convertPlaylist();
        // close modal
        else {
            modal.classList.remove('open-modal');
            modalContainerFailed.classList.remove('display-block');
        }
    });
});

// delete playlist
modalDeleteBtn.addEventListener('click', () => {
    deletePlaylist();
});
