document.addEventListener('DOMContentLoaded', () => {

    const nav = document.querySelector('.responsive-nav');
    const navBtn = document.querySelector('.hamburger');

    // responsive navbar
    window.addEventListener('click', function(e){
        if (navBtn.contains(e.target)) {
            nav.classList.add('display-nav');
        }
        else if (!nav.contains(e.target) && !navBtn.contains(e.target)){
            nav.classList.remove('display-nav');
        }
      });

});