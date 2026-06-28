-- ==========================================================================
-- Santiago te Premia – Full database migration
-- ==========================================================================
-- Run this against a fresh Supabase/PostgreSQL database.
-- Requires: pgcrypto extension (for gen_random_uuid).
-- ==========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================================================
-- 1. ENUM TYPES
-- ==========================================================================

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'BUSINESS');

CREATE TYPE poi_type AS ENUM ('HOTEL', 'TOURIST_SPOT', 'COMMERCE', 'OTHER');

CREATE TYPE business_status AS ENUM ('ACTIVE', 'PAUSED', 'SUSPENDED');

CREATE TYPE promotion_type AS ENUM (
  'PERCENTAGE',
  'TWO_FOR_ONE',
  'GIFT',
  'SPECIAL',
  'EXCLUSIVE',
  'BY_DATE',
  'BY_CATEGORY'
);

CREATE TYPE redemption_status AS ENUM ('COMPLETED', 'CANCELLED');

CREATE TYPE campaign_segment AS ENUM (
  'ALL_TOURISTS',
  'BY_HOTEL',
  'BY_CATEGORY',
  'BY_BUSINESS',
  'CUSTOM'
);

CREATE TYPE campaign_status AS ENUM ('DRAFT', 'SENDING', 'SENT', 'FAILED');

-- ==========================================================================
-- 2. TABLES
-- ==========================================================================

-- ---- system_settings -----------------------------------------------------
CREATE TABLE system_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_api_token         TEXT NOT NULL DEFAULT '',
  whatsapp_verify_token      TEXT NOT NULL DEFAULT '',
  whatsapp_phone_number_id   TEXT NOT NULL DEFAULT '',
  whatsapp_business_account_id TEXT NOT NULL DEFAULT '',
  webhook_url                TEXT NOT NULL DEFAULT '',
  pin_expiration_seconds     INT  NOT NULL DEFAULT 20,
  welcome_message            TEXT NOT NULL DEFAULT '',
  main_menu_config           JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- categories ----------------------------------------------------------
CREATE TABLE categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  icon          TEXT NOT NULL DEFAULT '',
  description   TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- points_of_interest (Hotels / QR Points) -----------------------------
CREATE TABLE points_of_interest (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  type          poi_type NOT NULL DEFAULT 'OTHER',
  address       TEXT NOT NULL DEFAULT '',
  qr_identifier TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- businesses ----------------------------------------------------------
CREATE TABLE businesses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  trade_name          TEXT NOT NULL DEFAULT '',
  cuit                TEXT NOT NULL DEFAULT '',
  category_id         UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  logo_url            TEXT NOT NULL DEFAULT '',
  photos              TEXT[] NOT NULL DEFAULT '{}',
  address             TEXT NOT NULL DEFAULT '',
  latitude            DOUBLE PRECISION,
  longitude           DOUBLE PRECISION,
  phone               TEXT NOT NULL DEFAULT '',
  whatsapp            TEXT NOT NULL DEFAULT '',
  instagram           TEXT NOT NULL DEFAULT '',
  website             TEXT NOT NULL DEFAULT '',
  schedule            JSONB NOT NULL DEFAULT '{}',
  description         TEXT NOT NULL DEFAULT '',
  benefit_percentage  NUMERIC(5,2) NOT NULL DEFAULT 0,
  benefit_conditions  TEXT NOT NULL DEFAULT '',
  status              business_status NOT NULL DEFAULT 'ACTIVE',
  can_send_campaigns  BOOLEAN NOT NULL DEFAULT false,
  can_edit_offers     BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- users ---------------------------------------------------------------
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL DEFAULT '',
  role          user_role NOT NULL DEFAULT 'BUSINESS',
  business_id   UUID REFERENCES businesses(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- promotions ----------------------------------------------------------
CREATE TABLE promotions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  type           promotion_type NOT NULL DEFAULT 'PERCENTAGE',
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  conditions     TEXT NOT NULL DEFAULT '',
  max_uses       INT,
  current_uses   INT NOT NULL DEFAULT 0,
  start_date     TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date       TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- tourists ------------------------------------------------------------
CREATE TABLE tourists (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone          TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL DEFAULT '',
  last_name      TEXT NOT NULL DEFAULT '',
  birth_date     DATE,
  country        TEXT NOT NULL DEFAULT '',
  province       TEXT NOT NULL DEFAULT '',
  city           TEXT NOT NULL DEFAULT '',
  poi_id         UUID REFERENCES points_of_interest(id) ON DELETE SET NULL,
  pin_secret     TEXT NOT NULL DEFAULT '',
  is_subscribed  BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- redemptions (canjes) ------------------------------------------------
CREATE TABLE redemptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_id           UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
  promotion_id         UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  business_id          UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  pin_used             TEXT NOT NULL DEFAULT '',
  validated_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status               redemption_status NOT NULL DEFAULT 'COMPLETED',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---- campaigns -----------------------------------------------------------
CREATE TABLE campaigns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  template_name       TEXT NOT NULL DEFAULT '',
  template_params     JSONB NOT NULL DEFAULT '{}',
  segment             campaign_segment NOT NULL DEFAULT 'ALL_TOURISTS',
  segment_filter      JSONB NOT NULL DEFAULT '{}',
  status              campaign_status NOT NULL DEFAULT 'DRAFT',
  sent_count          INT NOT NULL DEFAULT 0,
  delivered_count     INT NOT NULL DEFAULT 0,
  read_count          INT NOT NULL DEFAULT 0,
  created_by_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_id         UUID REFERENCES businesses(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at             TIMESTAMPTZ
);

-- ==========================================================================
-- 3. INDEXES
-- ==========================================================================

CREATE INDEX idx_tourists_phone         ON tourists (phone);
CREATE INDEX idx_poi_qr_identifier      ON points_of_interest (qr_identifier);
CREATE INDEX idx_businesses_status      ON businesses (status);
CREATE INDEX idx_businesses_category    ON businesses (category_id);
CREATE INDEX idx_promotions_business    ON promotions (business_id);
CREATE INDEX idx_promotions_active      ON promotions (is_active);
CREATE INDEX idx_redemptions_tourist    ON redemptions (tourist_id);
CREATE INDEX idx_redemptions_business   ON redemptions (business_id);
CREATE INDEX idx_redemptions_promotion  ON redemptions (promotion_id);
CREATE INDEX idx_campaigns_status       ON campaigns (status);
CREATE INDEX idx_campaigns_business     ON campaigns (business_id);
CREATE INDEX idx_users_business         ON users (business_id);
CREATE INDEX idx_users_email            ON users (email);
CREATE INDEX idx_tourists_poi           ON tourists (poi_id);

-- ==========================================================================
-- 4. ROW LEVEL SECURITY (RLS) – enabled with permissive policies
-- ==========================================================================

ALTER TABLE system_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories           ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_of_interest   ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tourists             ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns            ENABLE ROW LEVEL SECURITY;

-- Permissive "allow all" policies (to be tightened in production)
CREATE POLICY "Allow all on system_settings"    ON system_settings    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories"         ON categories         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on points_of_interest" ON points_of_interest FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on businesses"         ON businesses         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on users"              ON users              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on promotions"         ON promotions         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tourists"           ON tourists           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on redemptions"        ON redemptions        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on campaigns"          ON campaigns          FOR ALL USING (true) WITH CHECK (true);

-- ==========================================================================
-- 5. UPDATED_AT TRIGGER (auto-update updated_at on row change)
-- ==========================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_system_settings_updated_at BEFORE UPDATE ON system_settings    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_poi_updated_at             BEFORE UPDATE ON points_of_interest FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_businesses_updated_at      BEFORE UPDATE ON businesses         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated_at           BEFORE UPDATE ON users              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_promotions_updated_at      BEFORE UPDATE ON promotions         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tourists_updated_at        BEFORE UPDATE ON tourists           FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==========================================================================
-- 6. SEED DATA
-- ==========================================================================

-- 6.1  Default system settings
INSERT INTO system_settings (
  whatsapp_api_token,
  whatsapp_verify_token,
  whatsapp_phone_number_id,
  whatsapp_business_account_id,
  webhook_url,
  pin_expiration_seconds,
  welcome_message,
  main_menu_config
) VALUES (
  '',
  '',
  '',
  '',
  '',
  20,
  '¡Bienvenido a Santiago te Premia! 🎉',
  '{}'::jsonb
);

-- 6.2  Categories
INSERT INTO categories (name, icon, description) VALUES
  ('Gastronomía',       '🍽️', 'Restaurantes, bares y servicios gastronómicos'),
  ('Hotelería',         '🏨', 'Hoteles, apart-hoteles y alojamientos'),
  ('Indumentaria',      '👗', 'Tiendas de ropa y accesorios'),
  ('Regionales',        '🎁', 'Productos regionales y artesanías'),
  ('Transporte',        '🚐', 'Servicios de transporte y traslados'),
  ('Turismo',           '🗺️', 'Agencias de turismo y excursiones'),
  ('Entretenimiento',   '🎭', 'Espectáculos, cines y recreación'),
  ('Perfumería',        '🧴', 'Perfumerías y cosméticos'),
  ('Salud y Bienestar', '💆', 'Spas, farmacias y bienestar');

-- 6.3  Point of Interest – Hotel NH
INSERT INTO points_of_interest (name, type, address, qr_identifier, description)
VALUES ('Hotel NH', 'HOTEL', 'Santiago del Estero', 'hotel-nh-sde', 'Hotel NH Santiago del Estero');

-- 6.4  Business – Marybe Perfumería (linked to Perfumería category)
INSERT INTO businesses (
  name, trade_name, cuit, category_id,
  logo_url, address, status
) VALUES (
  'Marybe',
  'Marybe Perfumería',
  '00-00000000-0',
  (SELECT id FROM categories WHERE name = 'Perfumería' LIMIT 1),
  '/comercios/marybe.jpeg',
  'Santiago del Estero',
  'ACTIVE'
);

-- 6.5  Super Admin user
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@camaracomercio.sde.gob.ar',
  -- bcrypt hash placeholder (change in production)
  '$2a$10$placeholder_hash_for_admin_password_replace_me',
  'Administrador',
  'SUPER_ADMIN'
);

-- 6.6  Business user – Marybe
INSERT INTO users (email, password_hash, name, role, business_id)
VALUES (
  'marybe@comercio.com',
  '$2a$10$placeholder_hash_for_marybe_password_replace_me',
  'Marybe Comercio',
  'BUSINESS',
  (SELECT id FROM businesses WHERE name = 'Marybe' LIMIT 1)
);

-- ---- reservations --------------------------------------------------------
CREATE TABLE reservations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tourist_id     UUID NOT NULL REFERENCES tourists(id) ON DELETE CASCADE,
  promotion_id   UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status         TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, EXPIRED
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

