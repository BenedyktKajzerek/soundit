document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('.hamburger').addEventListener('click', () => {
        document.querySelector('.nav').classList.toggle('display-block');
    });

    // Clone music services twice so it slides smoothly 
    const copy = document.querySelector('.logos-track').cloneNode(true);
    document.querySelector('.logos-div').appendChild(copy);
    document.querySelector('.logos-div').appendChild(copy.cloneNode(true));

});