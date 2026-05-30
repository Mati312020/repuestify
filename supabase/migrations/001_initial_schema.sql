-- ============================================================
-- REPUESTIFY — Schema inicial
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensiones ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- búsqueda fuzzy de texto


-- ════════════════════════════════════════════════════════════
-- CATÁLOGO VEHICULAR
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS brands (
  id   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  country text,          -- 'china', 'japón', 'alemania', etc.
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS models (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name     text NOT NULL,
  segment  text,         -- 'suv', 'sedan', 'pickup', 'electrico', etc.
  active   boolean DEFAULT true,
  UNIQUE (brand_id, name)
);

CREATE TABLE IF NOT EXISTS model_years (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id     uuid NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  year         integer NOT NULL CHECK (year BETWEEN 1980 AND 2030),
  engine_types text[],  -- ej: ['1.5T', '2.0', 'EV']
  UNIQUE (model_id, year)
);

-- Índices catálogo
CREATE INDEX IF NOT EXISTS idx_models_brand    ON models(brand_id);
CREATE INDEX IF NOT EXISTS idx_model_years_model ON model_years(model_id);


-- ════════════════════════════════════════════════════════════
-- BÚSQUEDAS Y RESULTADOS
-- ════════════════════════════════════════════════════════════

-- Logs de búsquedas (analytics)
CREATE TABLE IF NOT EXISTS searches (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand          text NOT NULL,
  model          text NOT NULL,
  year           integer NOT NULL,
  parts_searched text NOT NULL,
  result_count   integer DEFAULT 0,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at     timestamptz DEFAULT now()
);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_searches_brand_model ON searches(brand, model);
CREATE INDEX IF NOT EXISTS idx_searches_created_at  ON searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_parts       ON searches USING gin(to_tsvector('spanish', parts_searched));


-- ════════════════════════════════════════════════════════════
-- FUENTES DE PRECIOS (resultados cacheados/scrapeados)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS part_sources (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Vehículo compatible
  brand           text NOT NULL,
  model           text NOT NULL,
  year_from       integer,
  year_to         integer,
  -- Producto
  source_name     text NOT NULL,  -- 'mercadolibre' | 'repuestera' | 'marketplace'
  external_id     text,           -- ID en la plataforma externa
  title           text NOT NULL,
  part_query      text NOT NULL,  -- el repuesto que se buscó
  price           numeric(12,2) NOT NULL,
  currency        char(3) NOT NULL DEFAULT 'ARS',
  price_ars       numeric(12,2),
  availability    text NOT NULL DEFAULT 'unknown'
                  CHECK (availability IN ('in_stock','out_of_stock','unknown')),
  condition       text NOT NULL DEFAULT 'new'
                  CHECK (condition IN ('new','used','refurbished')),
  url             text NOT NULL,
  thumbnail_url   text,
  seller_name     text,
  seller_rating   numeric(3,1),
  -- Control
  last_updated    timestamptz DEFAULT now(),
  created_at      timestamptz DEFAULT now(),
  UNIQUE (source_name, external_id)
);

-- Índices para búsquedas de precios
CREATE INDEX IF NOT EXISTS idx_part_sources_vehicle  ON part_sources(brand, model);
CREATE INDEX IF NOT EXISTS idx_part_sources_query    ON part_sources USING gin(to_tsvector('spanish', part_query));
CREATE INDEX IF NOT EXISTS idx_part_sources_source   ON part_sources(source_name);
CREATE INDEX IF NOT EXISTS idx_part_sources_price    ON part_sources(price_ars ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_part_sources_updated  ON part_sources(last_updated DESC);


-- ════════════════════════════════════════════════════════════
-- VALIDACIÓN COMUNITARIA
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS part_validations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  part_source_id  uuid NOT NULL REFERENCES part_sources(id) ON DELETE CASCADE,
  vehicle_brand   text NOT NULL,
  vehicle_model   text NOT NULL,
  vehicle_year    integer NOT NULL,
  notes           text,
  validated_at    timestamptz DEFAULT now(),
  -- Un usuario solo puede validar cada repuesto una vez
  UNIQUE (user_id, part_source_id)
);

CREATE INDEX IF NOT EXISTS idx_validations_part   ON part_validations(part_source_id);
CREATE INDEX IF NOT EXISTS idx_validations_user   ON part_validations(user_id);

-- Vista: conteo de validaciones por repuesto
CREATE OR REPLACE VIEW part_validation_counts AS
SELECT
  part_source_id,
  COUNT(*) AS validation_count,
  bool_or(true) AS is_validated
FROM part_validations
GROUP BY part_source_id;


-- ════════════════════════════════════════════════════════════
-- HISTORIAL DE PRECIOS
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS price_history (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  part_source_id uuid NOT NULL REFERENCES part_sources(id) ON DELETE CASCADE,
  price          numeric(12,2) NOT NULL,
  currency       char(3) NOT NULL DEFAULT 'ARS',
  price_ars      numeric(12,2),
  recorded_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_source ON price_history(part_source_id, recorded_at DESC);

-- Función: registrar automáticamente cambios de precio
CREATE OR REPLACE FUNCTION record_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price THEN
    INSERT INTO price_history (part_source_id, price, currency, price_ars)
    VALUES (NEW.id, NEW.price, NEW.currency, NEW.price_ars);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_price_change
  AFTER UPDATE ON part_sources
  FOR EACH ROW EXECUTE FUNCTION record_price_change();


-- ════════════════════════════════════════════════════════════
-- PERFILES DE USUARIO
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text,
  validation_count integer DEFAULT 0,  -- cache del total de validaciones
  is_expert     boolean DEFAULT false, -- badge: >10 validaciones
  created_at    timestamptz DEFAULT now()
);

-- Auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Actualizar validation_count y badge experto al validar
CREATE OR REPLACE FUNCTION update_expert_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    validation_count = validation_count + 1,
    is_expert = (validation_count + 1) >= 10
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validation_count
  AFTER INSERT ON part_validations
  FOR EACH ROW EXECUTE FUNCTION update_expert_status();


-- ════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE brands            ENABLE ROW LEVEL SECURITY;
ALTER TABLE models            ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_years       ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches          ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_sources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_validations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;

-- ── Catálogo: público para lectura ─────────────────────────
CREATE POLICY "brands_public_read"       ON brands       FOR SELECT USING (true);
CREATE POLICY "models_public_read"       ON models       FOR SELECT USING (true);
CREATE POLICY "model_years_public_read"  ON model_years  FOR SELECT USING (true);
CREATE POLICY "part_sources_public_read" ON part_sources FOR SELECT USING (true);
CREATE POLICY "price_history_public_read" ON price_history FOR SELECT USING (true);

-- ── Catálogo: solo service_role puede escribir ──────────────
-- (El backend usa createServiceClient que bypasea RLS, no necesita policy de escritura)

-- ── Búsquedas: público puede insertar, solo lectura propia ──
CREATE POLICY "searches_public_insert"  ON searches FOR INSERT WITH CHECK (true);
CREATE POLICY "searches_own_read"       ON searches FOR SELECT USING (
  user_id IS NULL OR auth.uid() = user_id
);

-- ── Validaciones: solo el dueño puede ver y crear ───────────
CREATE POLICY "validations_own_read"    ON part_validations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "validations_own_insert"  ON part_validations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "validations_own_delete"  ON part_validations FOR DELETE USING (auth.uid() = user_id);

-- ── Perfil: cada usuario ve y edita el suyo ─────────────────
CREATE POLICY "profiles_public_read"    ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update"     ON profiles FOR UPDATE USING (auth.uid() = id);


-- ════════════════════════════════════════════════════════════
-- DATOS SEMILLA: MARCAS
-- ════════════════════════════════════════════════════════════

INSERT INTO brands (name, country) VALUES
  -- Europeas / americanas / japonesas
  ('Toyota',      'japón'),
  ('Ford',        'estados unidos'),
  ('Chevrolet',   'estados unidos'),
  ('Volkswagen',  'alemania'),
  ('Renault',     'francia'),
  ('Peugeot',     'francia'),
  ('Fiat',        'italia'),
  ('Honda',       'japón'),
  ('Nissan',      'japón'),
  ('Hyundai',     'corea del sur'),
  ('Kia',         'corea del sur'),
  ('Mercedes',    'alemania'),
  ('BMW',         'alemania'),
  ('Audi',        'alemania'),
  ('Citroen',     'francia'),
  ('Mitsubishi',  'japón'),
  ('Subaru',      'japón'),
  ('Jeep',        'estados unidos'),
  ('Dodge',       'estados unidos'),
  ('Suzuki',      'japón'),
  -- Chinas
  ('Chery',       'china'),
  ('BAIC',        'china'),
  ('BYD',         'china'),
  ('JAC',         'china'),
  ('Haval / GWM', 'china'),
  ('MG',          'china'),
  ('Changan',     'china'),
  ('Geely',       'china'),
  ('DFSK',        'china'),
  ('Omoda',       'china'),
  ('Jetour',      'china'),
  ('FAW',         'china')
ON CONFLICT (name) DO NOTHING;
