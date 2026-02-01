-- Migration: Add accommodation_images table for multiple photos per accommodation
-- This allows unlimited images per accommodation with ordering and captions

CREATE TABLE IF NOT EXISTS accommodation_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  accommodation_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (accommodation_id) REFERENCES accommodations(id) ON DELETE CASCADE
);

-- Index for fast lookups by accommodation
CREATE INDEX IF NOT EXISTS idx_accommodation_images_accommodation ON accommodation_images(accommodation_id);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_accommodation_images_order ON accommodation_images(accommodation_id, display_order);
