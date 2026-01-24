// Method & Passion - Booking System with WhatsApp Integration

// Configuration
const WHATSAPP_NUMBER = '351968950410';
let selectedAccommodation = null;
let currentLanguage = 'pt';

// Translations
const translations = {
    pt: {
        title: 'Method & Passion',
        subtitle: 'Alojamento Local de Confiança',
        trustBadge: 'Reserva Segura e Certificada',
        chooseAccommodation: 'Escolha o Seu Alojamento',
        esperancaDesc: 'Um refúgio tranquilo com vistas deslumbrantes e todas as comodidades para uma estadia inesquecível.',
        natturaDesc: 'Em plena natureza do Gerês, perfeito para quem procura paz, natureza e conforto excepcional.',
        wifiFree: 'Wi-Fi Grátis',
        panoramicView: 'Vista Panorâmica',
        privateTerrace: 'Terraço Privado',
        natureView: 'Natureza Envolvente',
        totalComfort: 'Conforto Total',
        naturalPark: 'Parque Natural',
        makeReservation: 'Faça a Sua Reserva',
        checkin: 'Data de Check-in',
        checkout: 'Data de Check-out',
        guests: 'Número de Hóspedes',
        guestsPlaceholder: 'Ex: 2',
        nationality: 'Nacionalidade',
        nationalityPlaceholder: 'Selecione a nacionalidade',
        responsibleName: 'Nome do Responsável',
        namePlaceholder: 'Nome completo do responsável pela reserva',
        addMoreNames: 'Adicionar mais nomes',
        additionalNamePlaceholder: 'Nome adicional',
        remove: 'Remover',
        bookWhatsapp: 'Reservar via WhatsApp',
        footer: '© 2026 Method & Passion - Alojamento Local. Todos os direitos reservados.',
        // Validation messages
        selectAccommodation: 'Por favor, selecione um alojamento.',
        selectCheckin: 'Por favor, selecione a data de check-in.',
        selectCheckout: 'Por favor, selecione a data de check-out.',
        checkoutAfterCheckin: 'Check-out deve ser depois do check-in.',
        selectGuests: 'Por favor, indique o número de hóspedes.',
        selectNationality: 'Por favor, selecione a nacionalidade.',
        enterName: 'Por favor, indique o nome do responsável.',
        // WhatsApp message
        whatsappGreeting: 'Olá! Gostaria de fazer uma reserva:',
        whatsappAccommodation: 'Alojamento',
        whatsappCheckin: 'Check-in',
        whatsappCheckout: 'Check-out',
        whatsappGuests: 'Número de hóspedes',
        whatsappNationality: 'Nacionalidade',
        whatsappResponsible: 'Responsável(is)',
        whatsappClosing: 'Aguardo confirmação. Obrigado!'
    },
    en: {
        title: 'Method & Passion',
        subtitle: 'Trusted Local Accommodation',
        trustBadge: 'Secure & Certified Booking',
        chooseAccommodation: 'Choose Your Accommodation',
        esperancaDesc: 'A peaceful retreat with stunning views and all amenities for an unforgettable stay.',
        natturaDesc: 'In the heart of Gerês nature, perfect for those seeking peace, nature and exceptional comfort.',
        wifiFree: 'Free Wi-Fi',
        panoramicView: 'Panoramic View',
        privateTerrace: 'Private Terrace',
        natureView: 'Surrounded by Nature',
        totalComfort: 'Total Comfort',
        naturalPark: 'Natural Park',
        makeReservation: 'Make Your Reservation',
        checkin: 'Check-in Date',
        checkout: 'Check-out Date',
        guests: 'Number of Guests',
        guestsPlaceholder: 'Ex: 2',
        nationality: 'Nationality',
        nationalityPlaceholder: 'Select nationality',
        responsibleName: 'Responsible Person Name',
        namePlaceholder: 'Full name of the person responsible for the booking',
        addMoreNames: 'Add more names',
        additionalNamePlaceholder: 'Additional name',
        remove: 'Remove',
        bookWhatsapp: 'Book via WhatsApp',
        footer: '© 2026 Method & Passion - Local Accommodation. All rights reserved.',
        selectAccommodation: 'Please select an accommodation.',
        selectCheckin: 'Please select check-in date.',
        selectCheckout: 'Please select check-out date.',
        checkoutAfterCheckin: 'Check-out must be after check-in.',
        selectGuests: 'Please indicate the number of guests.',
        selectNationality: 'Please select nationality.',
        enterName: 'Please enter the responsible person name.',
        whatsappGreeting: 'Hello! I would like to make a reservation:',
        whatsappAccommodation: 'Accommodation',
        whatsappCheckin: 'Check-in',
        whatsappCheckout: 'Check-out',
        whatsappGuests: 'Number of guests',
        whatsappNationality: 'Nationality',
        whatsappResponsible: 'Responsible person(s)',
        whatsappClosing: 'Awaiting confirmation. Thank you!'
    },
    fr: {
        title: 'Method & Passion',
        subtitle: 'Hébergement Local de Confiance',
        trustBadge: 'Réservation Sécurisée et Certifiée',
        chooseAccommodation: 'Choisissez Votre Hébergement',
        esperancaDesc: 'Un refuge paisible avec des vues imprenables et toutes les commodités pour un séjour inoubliable.',
        natturaDesc: 'Au cœur de la nature du Gerês, parfait pour ceux qui recherchent la paix, la nature et un confort exceptionnel.',
        wifiFree: 'Wi-Fi Gratuit',
        panoramicView: 'Vue Panoramique',
        privateTerrace: 'Terrasse Privée',
        natureView: 'Entouré de Nature',
        totalComfort: 'Confort Total',
        naturalPark: 'Parc Naturel',
        makeReservation: 'Faites Votre Réservation',
        checkin: 'Date d\'Arrivée',
        checkout: 'Date de Départ',
        guests: 'Nombre de Personnes',
        guestsPlaceholder: 'Ex: 2',
        nationality: 'Nationalité',
        nationalityPlaceholder: 'Sélectionner la nationalité',
        responsibleName: 'Nom du Responsable',
        namePlaceholder: 'Nom complet du responsable de la réservation',
        addMoreNames: 'Ajouter plus de noms',
        additionalNamePlaceholder: 'Nom supplémentaire',
        remove: 'Supprimer',
        bookWhatsapp: 'Réserver via WhatsApp',
        footer: '© 2026 Method & Passion - Hébergement Local. Tous droits réservés.',
        selectAccommodation: 'Veuillez sélectionner un hébergement.',
        selectCheckin: 'Veuillez sélectionner la date d\'arrivée.',
        selectCheckout: 'Veuillez sélectionner la date de départ.',
        checkoutAfterCheckin: 'Le départ doit être après l\'arrivée.',
        selectGuests: 'Veuillez indiquer le nombre de personnes.',
        selectNationality: 'Veuillez sélectionner la nationalité.',
        enterName: 'Veuillez indiquer le nom du responsable.',
        whatsappGreeting: 'Bonjour! Je voudrais faire une réservation:',
        whatsappAccommodation: 'Hébergement',
        whatsappCheckin: 'Arrivée',
        whatsappCheckout: 'Départ',
        whatsappGuests: 'Nombre de personnes',
        whatsappNationality: 'Nationalité',
        whatsappResponsible: 'Responsable(s)',
        whatsappClosing: 'En attente de confirmation. Merci!'
    },
    de: {
        title: 'Method & Passion',
        subtitle: 'Vertrauenswürdige Lokale Unterkunft',
        trustBadge: 'Sichere & Zertifizierte Buchung',
        chooseAccommodation: 'Wählen Sie Ihre Unterkunft',
        esperancaDesc: 'Ein ruhiger Rückzugsort mit atemberaubender Aussicht und allen Annehmlichkeiten für einen unvergesslichen Aufenthalt.',
        natturaDesc: 'Mitten in der Natur von Gerês, perfekt für diejenigen, die Ruhe, Natur und außergewöhnlichen Komfort suchen.',
        wifiFree: 'Kostenloses WLAN',
        panoramicView: 'Panoramablick',
        privateTerrace: 'Private Terrasse',
        natureView: 'Von Natur Umgeben',
        totalComfort: 'Totaler Komfort',
        naturalPark: 'Naturpark',
        makeReservation: 'Machen Sie Ihre Reservierung',
        checkin: 'Check-in Datum',
        checkout: 'Check-out Datum',
        guests: 'Anzahl der Gäste',
        guestsPlaceholder: 'Bsp: 2',
        nationality: 'Nationalität',
        nationalityPlaceholder: 'Nationalität wählen',
        responsibleName: 'Name der Verantwortlichen Person',
        namePlaceholder: 'Vollständiger Name der für die Buchung verantwortlichen Person',
        addMoreNames: 'Weitere Namen hinzufügen',
        additionalNamePlaceholder: 'Zusätzlicher Name',
        remove: 'Entfernen',
        bookWhatsapp: 'Über WhatsApp Buchen',
        footer: '© 2026 Method & Passion - Lokale Unterkunft. Alle Rechte vorbehalten.',
        selectAccommodation: 'Bitte wählen Sie eine Unterkunft.',
        selectCheckin: 'Bitte wählen Sie das Check-in Datum.',
        selectCheckout: 'Bitte wählen Sie das Check-out Datum.',
        checkoutAfterCheckin: 'Check-out muss nach Check-in sein.',
        selectGuests: 'Bitte geben Sie die Anzahl der Gäste an.',
        selectNationality: 'Bitte wählen Sie die Nationalität.',
        enterName: 'Bitte geben Sie den Namen der verantwortlichen Person ein.',
        whatsappGreeting: 'Hallo! Ich möchte eine Reservierung vornehmen:',
        whatsappAccommodation: 'Unterkunft',
        whatsappCheckin: 'Check-in',
        whatsappCheckout: 'Check-out',
        whatsappGuests: 'Anzahl der Gäste',
        whatsappNationality: 'Nationalität',
        whatsappResponsible: 'Verantwortliche Person(en)',
        whatsappClosing: 'Warte auf Bestätigung. Danke!'
    },
    es: {
        title: 'Method & Passion',
        subtitle: 'Alojamiento Local de Confianza',
        trustBadge: 'Reserva Segura y Certificada',
        chooseAccommodation: 'Elija Su Alojamiento',
        esperancaDesc: 'Un refugio tranquilo con vistas impresionantes y todas las comodidades para una estancia inolvidable.',
        natturaDesc: 'En plena naturaleza de Gerês, perfecto para quienes buscan paz, naturaleza y confort excepcional.',
        wifiFree: 'Wi-Fi Gratis',
        panoramicView: 'Vista Panorámica',
        privateTerrace: 'Terraza Privada',
        natureView: 'Rodeado de Naturaleza',
        totalComfort: 'Confort Total',
        naturalPark: 'Parque Natural',
        makeReservation: 'Haga Su Reserva',
        checkin: 'Fecha de Entrada',
        checkout: 'Fecha de Salida',
        guests: 'Número de Huéspedes',
        guestsPlaceholder: 'Ej: 2',
        nationality: 'Nacionalidad',
        nationalityPlaceholder: 'Seleccione la nacionalidad',
        responsibleName: 'Nombre del Responsable',
        namePlaceholder: 'Nombre completo del responsable de la reserva',
        addMoreNames: 'Agregar más nombres',
        additionalNamePlaceholder: 'Nombre adicional',
        remove: 'Eliminar',
        bookWhatsapp: 'Reservar vía WhatsApp',
        footer: '© 2026 Method & Passion - Alojamiento Local. Todos los derechos reservados.',
        selectAccommodation: 'Por favor, seleccione un alojamiento.',
        selectCheckin: 'Por favor, seleccione la fecha de entrada.',
        selectCheckout: 'Por favor, seleccione la fecha de salida.',
        checkoutAfterCheckin: 'La salida debe ser después de la entrada.',
        selectGuests: 'Por favor, indique el número de huéspedes.',
        selectNationality: 'Por favor, seleccione la nacionalidad.',
        enterName: 'Por favor, indique el nombre del responsable.',
        whatsappGreeting: '¡Hola! Me gustaría hacer una reserva:',
        whatsappAccommodation: 'Alojamiento',
        whatsappCheckin: 'Entrada',
        whatsappCheckout: 'Salida',
        whatsappGuests: 'Número de huéspedes',
        whatsappNationality: 'Nacionalidad',
        whatsappResponsible: 'Responsable(s)',
        whatsappClosing: 'Esperando confirmación. ¡Gracias!'
    }
};

// Nationalities list
const nationalities = [
    { code: 'PT', name: { pt: 'Portuguesa', en: 'Portuguese', fr: 'Portugaise', de: 'Portugiesisch', es: 'Portuguesa' } },
    { code: 'ES', name: { pt: 'Espanhola', en: 'Spanish', fr: 'Espagnole', de: 'Spanisch', es: 'Española' } },
    { code: 'FR', name: { pt: 'Francesa', en: 'French', fr: 'Française', de: 'Französisch', es: 'Francesa' } },
    { code: 'DE', name: { pt: 'Alemã', en: 'German', fr: 'Allemande', de: 'Deutsch', es: 'Alemana' } },
    { code: 'UK', name: { pt: 'Britânica', en: 'British', fr: 'Britannique', de: 'Britisch', es: 'Británica' } },
    { code: 'US', name: { pt: 'Americana', en: 'American', fr: 'Américaine', de: 'Amerikanisch', es: 'Americana' } },
    { code: 'IT', name: { pt: 'Italiana', en: 'Italian', fr: 'Italienne', de: 'Italienisch', es: 'Italiana' } },
    { code: 'NL', name: { pt: 'Holandesa', en: 'Dutch', fr: 'Néerlandaise', de: 'Niederländisch', es: 'Holandesa' } },
    { code: 'BE', name: { pt: 'Belga', en: 'Belgian', fr: 'Belge', de: 'Belgisch', es: 'Belga' } },
    { code: 'BR', name: { pt: 'Brasileira', en: 'Brazilian', fr: 'Brésilienne', de: 'Brasilianisch', es: 'Brasileña' } },
    { code: 'OTHER', name: { pt: 'Outra', en: 'Other', fr: 'Autre', de: 'Andere', es: 'Otra' } }
];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeLanguageSelector();
    initializeAccommodationSelection();
    initializeNameInputs();
    initializeDateValidation();
    initializeFormSubmission();
    initializeNationalitySelect();
    setMinDates();
    updatePageLanguage();
});

// Initialize language selector
function initializeLanguageSelector() {
    const languageSelect = document.getElementById('languageSelect');
    
    languageSelect.addEventListener('change', function() {
        currentLanguage = this.value;
        updatePageLanguage();
        updateNationalityOptions();
    });
}

// Update page language
function updatePageLanguage() {
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translations[currentLanguage][key];
            } else {
                element.textContent = translations[currentLanguage][key];
            }
        }
    });
}

// Initialize nationality select options
function initializeNationalitySelect() {
    const nationalitySelect = document.getElementById('nationality');
    
    nationalities.forEach(nat => {
        const option = document.createElement('option');
        option.value = nat.code;
        option.textContent = nat.name[currentLanguage];
        nationalitySelect.appendChild(option);
    });
}

// Update nationality options when language changes
function updateNationalityOptions() {
    const nationalitySelect = document.getElementById('nationality');
    const selectedValue = nationalitySelect.value;
    
    // Clear all options except the first (placeholder)
    while (nationalitySelect.options.length > 1) {
        nationalitySelect.remove(1);
    }
    
    // Add options in new language
    nationalities.forEach(nat => {
        const option = document.createElement('option');
        option.value = nat.code;
        option.textContent = nat.name[currentLanguage];
        nationalitySelect.appendChild(option);
    });
    
    // Restore selected value
    if (selectedValue) {
        nationalitySelect.value = selectedValue;
    }
    
    // Update placeholder
    nationalitySelect.options[0].textContent = translations[currentLanguage].nationalityPlaceholder;
}

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
            <input type="text" class="guest-name" placeholder="${translations[currentLanguage].additionalNamePlaceholder}">
            <button type="button" class="btn-remove" onclick="removeNameInput(this)">${translations[currentLanguage].remove}</button>
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
        alert(translations[currentLanguage].selectAccommodation);
        document.querySelector('.accommodations').scrollIntoView({ behavior: 'smooth' });
        return false;
    }
    
    // Check check-in date
    const checkin = document.getElementById('checkin');
    if (!checkin.value) {
        showError(checkin, translations[currentLanguage].selectCheckin);
        isValid = false;
    } else {
        clearError(checkin);
    }
    
    // Check check-out date
    const checkout = document.getElementById('checkout');
    if (!checkout.value) {
        showError(checkout, translations[currentLanguage].selectCheckout);
        isValid = false;
    } else if (new Date(checkout.value) <= new Date(checkin.value)) {
        showError(checkout, translations[currentLanguage].checkoutAfterCheckin);
        isValid = false;
    } else {
        clearError(checkout);
    }
    
    // Check number of guests
    const guests = document.getElementById('guests');
    if (!guests.value || guests.value < 1) {
        showError(guests, translations[currentLanguage].selectGuests);
        isValid = false;
    } else {
        clearError(guests);
    }
    
    // Check nationality
    const nationality = document.getElementById('nationality');
    if (!nationality.value) {
        showError(nationality, translations[currentLanguage].selectNationality);
        isValid = false;
    } else {
        clearError(nationality);
    }
    
    // Check primary name
    const primaryName = document.getElementById('primaryName');
    if (!primaryName.value.trim()) {
        showError(primaryName, translations[currentLanguage].enterName);
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
    const nationalityCode = document.getElementById('nationality').value;
    
    // Get nationality name in current language
    const nationalityObj = nationalities.find(n => n.code === nationalityCode);
    const nationalityName = nationalityObj ? nationalityObj.name[currentLanguage] : '';
    
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
        nationality: nationalityName,
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
    const t = translations[currentLanguage];
    
    let message = `${t.whatsappGreeting}\n\n`;
    message += `*${t.whatsappAccommodation}:* ${data.accommodation}\n`;
    message += `*${t.whatsappCheckin}:* ${data.checkin}\n`;
    message += `*${t.whatsappCheckout}:* ${data.checkout}\n`;
    message += `*${t.whatsappGuests}:* ${data.guests}\n`;
    message += `*${t.whatsappNationality}:* ${data.nationality}\n`;
    message += `\n*${t.whatsappResponsible}:*\n`;
    
    data.names.forEach((name, index) => {
        message += `${index + 1}. ${name}\n`;
    });
    
    message += `\n${t.whatsappClosing}`;
    
    return message;
}

// Redirect to WhatsApp
function redirectToWhatsApp(message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Open WhatsApp in new window
    window.open(whatsappUrl, '_blank');
}
