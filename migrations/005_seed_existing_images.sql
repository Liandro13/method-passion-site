-- Migration: Seed existing images into the new accommodation_images table
-- Migrates the 3 current accommodation images as primary images

-- Esperança Terrace (id: 1)
INSERT INTO accommodation_images (accommodation_id, image_url, display_order, caption, is_primary)
SELECT 1, '/images/esperanca.jpeg', 0, 'Vista principal', TRUE
WHERE EXISTS (SELECT 1 FROM accommodations WHERE id = 1);

-- Nattura Gerês Village (id: 2)
INSERT INTO accommodation_images (accommodation_id, image_url, display_order, caption, is_primary)
SELECT 2, '/images/geres.jpeg', 0, 'Vista principal', TRUE
WHERE EXISTS (SELECT 1 FROM accommodations WHERE id = 2);

-- Douro & Sabor Escape (id: 3)
INSERT INTO accommodation_images (accommodation_id, image_url, display_order, caption, is_primary)
SELECT 3, '/images/moncorvo.jpeg', 0, 'Vista principal', TRUE
WHERE EXISTS (SELECT 1 FROM accommodations WHERE id = 3);
