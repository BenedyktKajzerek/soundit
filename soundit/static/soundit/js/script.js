document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('.hamburger').addEventListener('click', btn => {
        document.querySelector('.nav').classList.toggle('display-block');
    })

});