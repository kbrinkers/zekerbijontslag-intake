import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export type IntakeRow = {
  id?: string;
  created_at?: string;
  urgentie: string | null;
  status: string;
  completeness_score: number | null;
  situatie_type: string | null;
  reden_ontslag: string | null;
  tekentermijn: string | null | undefined;
  dienstverband_jaren: number | null;
  contract_type: string | null;
  sector: string | null;
  cao_naam: string | null;
  bruto_maandsalaris: number | null;
  naam: string | null;
  geslacht: string | null;
  geslacht_basis: string | null;
  leeftijd: number | null;
  emotionele_staat: string | null;
  email: string | null;
  telefoon: string | null;
  contact_voorkeur: string | null;
  vso_verwerkt: boolean;
  vso_vergoeding: number | null;
  vso_ontbrekende_elementen: string[] | null;
  vso_opvallende_clausules: string[] | null;
  tv_indicatie: number | null;
  ww_indicatie_maanden: number | null;
  aandachtspunten: string[] | null;
  handover_json: Record<string, unknown> | null;
  gesprek_log: { role: string; content: string }[] | null;
};
