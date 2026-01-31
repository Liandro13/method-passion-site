-- Seed data for Method Passion Booking System

-- Insert accommodations
INSERT INTO accommodations (name, description_pt, description_en, image_url, max_guests) VALUES
('Esperança Terrace', 'Wi-Fi Grátis, Vista Panorâmica, Terraço Privado', 'Free Wi-Fi, Panoramic View, Private Terrace', '/images/esperança.jpeg', 8),
('Nattura Gerês Village', 'Natureza Envolvente, Conforto Total, Parque Natural', 'Surrounding Nature, Total Comfort, Natural Park', '/images/geres.jpeg', 10),
('Douro & Sabor Escape', 'Região Vinhateira, Vista Rio, Tranquilidade', 'Wine Region, River View, Tranquility', '/images/moncorvo.jpeg', 8);

-- Insert default admin session (password: admin - will be validated in code)
-- Token is a placeholder, real tokens are generated on login
