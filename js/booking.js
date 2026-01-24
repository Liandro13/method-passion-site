// Method & Passion - Booking System with WhatsApp Integration

// Configuration
const WHATSAPP_NUMBER = '351968950410';
let selectedAccommodation = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAccommodationSelection();
    initializeNameInputs();
    initializeDateValidation();
    initializeFormSubmission();
    setMinDates();
});

// Set minimum dates (today for check-in, tomorrow for check-out)
function setMinDates() {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    document.getElementById('checkin').setAttribute('min', today);
    document.getElementById('checkout').setAttribute('min', tomorrow);
}

// Accommodation card selection
function initializeAccommodationSelection() {
    const cards = document.querySelectorAll('.accommodation-card');
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove selection from all cards
            cards.forEach(c => c.classList.remove('selected'));
            
            // Add selection to clicked card
            this.classList.add('selected');
            
            // Store selected accommodation
            selectedAccommodation = this.dataset.accommodation;
            
            // Clear any previous error
            const formGroup = this.closest('.accommodations').parentElement;
            if (formGroup) {
                formGroup.classList.remove('error');
            }
        });
    });
}

// Name inputs management (add/remove)
function initializeNameInputs() {
    const addButton = document.getElementById('addName');
    const namesContainer = document.getElementById('namesContainer');
    
    addButton.addEventListener('click', function() {
        const nameWrapper = document.createElement('div');
        nameWrapper.className = 'name-input-wrapper';
        nameWrapper.innerHTML = `
            <input type="text" class="guest-name" placeholder="Nome adicional">
            <button type="button" class="btn-remove" onclick="removeNameInput(this)">Remover</button>
        `;
        namesContainer.appendChild(nameWrapper);
    });
}

// Remove name input
function removeNameInput(button) {
    button.parentElement.remove();
}

// Date validation (check-out must be after check-in)
function initializeDateValidation() {
    const checkinInput = document.getElementById('checkin');
    const checkoutInput = document.getElementById('checkout');
    
    checkinInput.addEventListener('change', function() {
        const checkinDate = new Date(this.value);
        const minCheckout = new Date(checkinDate.getTime() + 86400000); // +1 day
        checkoutInput.setAttribute('min', minCheckout.toISOString().split('T')[0]);
        
        // If checkout is before new min, clear it
        if (checkoutInput.value && new Date(checkoutInput.value) <= checkinDate) {
            checkoutInput.value = '';
        }
    });
}

// Form submission and WhatsApp redirect
function initializeFormSubmission() {
    const form = document.getElementById('bookingForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Collect form data
        const formData = collectFormData();
        
        // Build WhatsApp message
        const message = buildWhatsAppMessage(formData);
        
        // Redirect to WhatsApp
        redirectToWhatsApp(message);
    });
}

// Validate all form fields
function validateForm() {
    let isValid = true;
    
    // Check accommodation selection
    if (!selectedAccommodation) {
        alert('Por favor, selecione um alojamento.');
        document.querySelector('.accommodations').scrollIntoView({ behavior: 'smooth' });
        return false;
    }
    
    // Check check-in date
    const checkin = document.getElementById('checkin');
    if (!checkin.value) {
        showError(checkin, 'Por favor, selecione a data de check-in.');
        isValid = false;
    } else {
        clearError(checkin);
    }
    
    // Check check-out date
    const checkout = document.getElementById('checkout');
    if (!checkout.value) {
        showError(checkout, 'Por favor, selecione a data de check-out.');
        isValid = false;
    } else if (new Date(checkout.value) <= new Date(checkin.value)) {
        showError(checkout, 'Check-out deve ser depois do check-in.');
        isValid = false;
    } else {
        clearError(checkout);
    }
    
    // Check number of guests
    const guests = document.getElementById('guests');
    if (!guests.value || guests.value < 1) {
        showError(guests, 'Por favor, indique o número de hóspedes.');
        isValid = false;
    } else {
        clearError(guests);
    }
    
    // Check primary name
    const primaryName = document.getElementById('primaryName');
    if (!primaryName.value.trim()) {
        showError(primaryName, 'Por favor, indique o nome do responsável.');
        isValid = false;
    } else {
        clearError(primaryName);
    }
    
    return isValid;
}

// Show error message
function showError(input, message) {
    const formGroup = input.closest('.form-group');
    formGroup.classList.add('error');
    
    let errorDiv = formGroup.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        input.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

// Clear error message
function clearError(input) {
    const formGroup = input.closest('.form-group');
    formGroup.classList.remove('error');
    
    const errorDiv = formGroup.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Collect form data
function collectFormData() {
    const checkin = document.getElementById('checkin').value;
    const checkout = document.getElementById('checkout').value;
    const guests = document.getElementById('guests').value;
    
    // Collect all names
    const names = [];
    const primaryName = document.getElementById('primaryName').value.trim();
    if (primaryName) names.push(primaryName);
    
    const additionalNames = document.querySelectorAll('.guest-name');
    additionalNames.forEach(input => {
        const name = input.value.trim();
        if (name) names.push(name);
    });
    
    return {
        accommodation: selectedAccommodation,
        checkin: formatDate(checkin),
        checkout: formatDate(checkout),
        guests: guests,
        names: names
    };
}

// Format date to Portuguese format (DD/MM/YYYY)
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate() + 1).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Build WhatsApp message
function buildWhatsAppMessage(data) {
    let message = `Olá! Gostaria de fazer uma reserva:\n\n`;
    message += `🏠 *Alojamento:* ${data.accommodation}\n`;
    message += `📅 *Check-in:* ${data.checkin}\n`;
    message += `📅 *Check-out:* ${data.checkout}\n`;
    message += `👥 *Número de hóspedes:* ${data.guests}\n`;
    message += `\n👤 *Responsável(is):*\n`;
    
    data.names.forEach((name, index) => {
        message += `${index + 1}. ${name}\n`;
    });
    
    message += `\nAguardo confirmação. Obrigado!`;
    
    return message;
}

// Redirect to WhatsApp
function redirectToWhatsApp(message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Open WhatsApp in new window
    window.open(whatsappUrl, '_blank');
}
