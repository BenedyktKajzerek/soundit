document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('.hamburger').addEventListener('click', () => {
        document.querySelector('.nav').classList.toggle('display-block');
    });

});