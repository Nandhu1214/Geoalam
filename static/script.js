// GeoAlarm Interactive JavaScript

const destinationInput = document.getElementById('destination');
const mapButton = document.querySelector('.map-button');
const currentLocationToggle = document.querySelector('.toggle-input');
const radiusSlider = document.getElementById('radius');
const radiusValue = document.getElementById('radius-value');
const toneSelect = document.getElementById('tone');
const setAlarmButton = document.querySelector('.primary-button');

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeEventListeners();
    updateRadiusDisplay();
    renderActiveAlarms();
    validateForm();
});

// Event Listeners
function initializeEventListeners() {
    radiusSlider.addEventListener('input', updateRadiusDisplay);
    setAlarmButton.addEventListener('click', handleSetAlarm);

    mapButton.addEventListener('mouseenter', function () {
        this.style.transform = 'scale(1.05)';
    });
    mapButton.addEventListener('mouseleave', function () {
        this.style.transform = 'scale(1)';
    });

    destinationInput.addEventListener('input', validateForm);
    toneSelect.addEventListener('change', validateForm);

    destinationInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleSetAlarm();
        }
    });

    document.addEventListener('keydown', function (e) {
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            destinationInput.focus();
        }
        if (e.key === 'Escape') {
            resetForm();
        }
    });

    const locationPin = document.querySelector('.location-pin');
    if (locationPin) {
        setInterval(() => {
            locationPin.style.transform = 'scale(1.05)';
            setTimeout(() => {
                locationPin.style.transform = 'scale(1)';
            }, 500);
        }, 3000);
    }
}

function updateRadiusDisplay() {
    radiusValue.textContent = radiusSlider.value;
}

function validateForm() {
    const destination = destinationInput.value.trim();
    const tone = toneSelect.value;

    if (destination && tone) {
        setAlarmButton.style.opacity = '1';
        setAlarmButton.style.cursor = 'pointer';
        setAlarmButton.disabled = false;
    } else {
        setAlarmButton.style.opacity = '0.7';
        setAlarmButton.style.cursor = 'not-allowed';
        setAlarmButton.disabled = true;
    }
}

function handleSetAlarm() {
    const destination = destinationInput.value.trim();
    const radius = parseInt(radiusSlider.value);
    const tone = toneSelect.selectedOptions[0]?.text;

    if (!destination) {
        showNotification('Please enter a destination', 'error');
        destinationInput.focus();
        return;
    }

    if (!tone || toneSelect.value === '') {
        showNotification('Please select an alarm tone', 'error');
        toneSelect.focus();
        return;
    }

    const newAlarm = {
        id: Date.now(),
        destination,
        radius,
        tone
    };

    fetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlarm)
    })
    .then(res => res.json())
    .then(() => {
        resetForm();
        renderActiveAlarms();
        showNotification(`Alarm set for ${destination}`, 'success');
    });

    setAlarmButton.style.transform = 'scale(0.95)';
    setTimeout(() => {
        setAlarmButton.style.transform = 'scale(1)';
    }, 100);
}

function resetForm() {
    destinationInput.value = '';
    toneSelect.value = '';
    radiusSlider.value = 500;
    updateRadiusDisplay();
    validateForm();
}

function renderActiveAlarms() {
    fetch('/api/alarms')
        .then(res => res.json())
        .then(alarms => {
            const alarmsContainer = document.querySelector('.card:last-of-type .card-content');
            const alarmCount = document.querySelector('.card:last-of-type .card-title');

            alarmCount.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
                Active Alarms (${alarms.length})
            `;

            if (alarms.length === 0) {
                alarmsContainer.innerHTML = `
                    <div style="text-align: center; padding: 2rem 0; color: #6b7280;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 1rem; opacity: 0.5;">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <p>No active alarms</p>
                        <p style="font-size: 0.875rem;">Create your first location-based alarm above!</p>
                    </div>
                `;
                return;
            }

            alarmsContainer.innerHTML = alarms.map(alarm => `
                <div class="alarm-item" data-alarm-id="${alarm.id}">
                    <div class="alarm-info">
                        <div class="alarm-destination">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                            ${alarm.destination}
                        </div>
                        <div class="alarm-details">${alarm.radius}m radius • ${alarm.tone}</div>
                    </div>
                    <button class="delete-button" type="button" onclick="deleteAlarm(${alarm.id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"/>
                            <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                    </button>
                </div>
            `).join('');
        });
}

function deleteAlarm(id) {
    fetch(`/api/alarms?id=${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            renderActiveAlarms();
            showNotification(data.message, 'info');
        });
}

function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            padding: 1rem 1.5rem;
            border-radius: 0.75rem;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            background: white;
            border-left: 4px solid;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
        }

        .notification.success {
            border-left-color: #10b981;
            background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
        }

        .notification.error {
            border-left-color: #ef4444;
            background: linear-gradient(135deg, #fef2f2, #fef7f7);
        }

        .notification.info {
            border-left-color: #3b82f6;
            background: linear-gradient(135deg, #eff6ff, #f0f9ff);
        }

        .notification-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }

        .notification-close {
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s ease;
        }

        .notification-close:hover {
            opacity: 1;
        }

        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;

    if (!document.querySelector('style[data-notification-styles]')) {
        style.setAttribute('data-notification-styles', 'true');
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

console.log('🌍 GeoAlarm initialized with Flask backend!');

let map;
let marker;
let geocoder;

function initMap() {
    const center = { lat: 8.5241, lng: 76.9366 }; // Default to Trivandrum

    map = new google.maps.Map(document.getElementById("map"), {
        center,
        zoom: 14,
    });

    geocoder = new google.maps.Geocoder();

    // Place a marker when the user clicks the map
    map.addListener("click", (e) => {
        placeMarker(e.latLng);
        reverseGeocode(e.latLng);
    });

    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        const circle = new google.maps.Circle({
            center: {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            },
            radius: position.coords.accuracy
        });
        autocomplete.setBounds(circle.getBounds());
    });
}


    const autocomplete = new google.maps.places.Autocomplete(destinationInput, {
    types: ['geocode'], // optional: can limit to only addresses
    fields: ['geometry', 'formatted_address']
});

autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (!place.geometry || !place.geometry.location) {
        alert("No details available for that location.");
        return;
    }

    // Set map center
    map.setCenter(place.geometry.location);
    map.setZoom(16);

    // Drop marker
    placeMarker(place.geometry.location);

    // Autofill destination input
    destinationInput.value = place.formatted_address;
    validateForm();
});

}

function placeMarker(location) {
    if (marker) {
        marker.setPosition(location);
    } else {
        marker = new google.maps.Marker({
            position: location,
            map,
        });
    }
}

function reverseGeocode(latlng) {
    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK") {
            if (results[0]) {
                destinationInput.value = results[0].formatted_address;
                validateForm();
            } else {
                alert("No results found");
            }
        } else {
            alert("Geocoder failed due to: " + status);
        }
    });
}

