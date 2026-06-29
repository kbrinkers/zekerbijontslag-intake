-- ZekerbijOntslag — Intake tabel
-- Run eenmalig in Supabase SQL editor (Frankfurt eu-central-1)

CREATE TABLE IF NOT EXISTS intakes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Urgentie en status
  urgentie TEXT CHECK (urgentie IN ('kritiek', 'hoog', 'middel', 'laag')),
  status TEXT DEFAULT 'nieuw',
  completeness_score NUMERIC(3,2),

  -- Situatie
  situatie_type TEXT,
  reden_ontslag TEXT,
  tekentermijn DATE,

  -- Dienstverband
  dienstverband_jaren NUMERIC,
  contract_type TEXT,
  sector TEXT,
  cao_naam TEXT,
  bruto_maandsalaris NUMERIC,

  -- Client
  naam TEXT,
  geslacht TEXT,
  geslacht_basis TEXT,
  leeftijd INTEGER,
  emotionele_staat TEXT,
  email TEXT,
  telefoon TEXT,
  contact_voorkeur TEXT,

  -- VSO analyse
  vso_verwerkt BOOLEAN DEFAULT false,
  vso_vergoeding NUMERIC,
  vso_ontbrekende_elementen TEXT[],
  vso_opvallende_clausules TEXT[],

  -- Indicaties
  tv_indicatie NUMERIC,
  ww_indicatie_maanden INTEGER,

  -- Vrije velden
  aandachtspunten TEXT[],
  handover_json JSONB,

  -- Gesprekslog (voor jurist)
  gesprek_log JSONB
);

-- Indexen
CREATE INDEX IF NOT EXISTS idx_intakes_urgentie_status
  ON intakes(urgentie, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intakes_tekentermijn
  ON intakes(tekentermijn) WHERE tekentermijn IS NOT NULL;

-- Row Level Security uitschakelen voor server-side service-role gebruik
ALTER TABLE intakes ENABLE ROW LEVEL SECURITY;

-- Alleen service-role key heeft toegang (geen publieke policies)
