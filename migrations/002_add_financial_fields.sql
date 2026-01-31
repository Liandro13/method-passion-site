-- Migration: Add financial fields to bookings table
-- Run with: npx wrangler d1 execute method-passion-db --remote --file=./migrations/002_add_financial_fields.sql

-- Add financial columns to bookings
ALTER TABLE bookings ADD COLUMN valor REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN imposto_municipal REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN comissao REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN taxa_bancaria REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN valor_sem_comissoes REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN valor_sem_iva REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN iva REAL DEFAULT 0;
ALTER TABLE bookings ADD COLUMN plataforma TEXT DEFAULT '';
