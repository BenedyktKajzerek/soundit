// Clone music services twice so it slides smoothly 
const copy = document.querySelector('.logos-track').cloneNode(true);
document.querySelector('.logos-div').appendChild(copy);
document.querySelector('.logos-div').appendChild(copy.cloneNode(true));

// search for available conversions
const searchService = document.querySelector('#searchService');
const services = document.querySelectorAll('.service');

searchService.addEventListener('input', function() {
    const searchValue = this.value.toLowerCase();

    services.forEach(function(service) {
        const serviceName = service.getAttribute('data-servicename').toLowerCase();
        const shouldDisplay = serviceName.includes(searchValue); // Determine visibility

        service.style.display = shouldDisplay ? 'flex' : 'none'; // Set display property
    });
});
