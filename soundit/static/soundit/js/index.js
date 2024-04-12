// Clone music services twice so it slides smoothly 
const copy = document.querySelector('.logos-track').cloneNode(true);
document.querySelector('.logos-div').appendChild(copy);
document.querySelector('.logos-div').appendChild(copy.cloneNode(true));

// Available conversions
for (let i = 0; i < 5; i++) {
    const copy2 = document.querySelector('.service-link').cloneNode(true);
    document.querySelector('.services-div').appendChild(copy2);
}
