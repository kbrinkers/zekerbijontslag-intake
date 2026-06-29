import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, IntakeRow } from "@/lib/supabase";
import {
  IntakeState,
  buildHandoverJson,
  getCompletenessScore,
  calcTransitievergoeding,
  calcWWDuur,
} from "@/lib/intake-state";

export interface SaveIntakeRequest {
  intakeState: IntakeState;
  aandachtspunten: string[];
  conversationLog: { role: string; content: string }[];
}

/**
 * Sla de afgeronde intake op in Supabase.
 * Aanroepen aan het einde van het gesprek nadat alle verplichte velden zijn ingevuld.
 */
export async function POST(req: NextRequest) {
  try {
    const body: SaveIntakeRequest = await req.json();
    const { intakeState: s, aandachtspunten, conversationLog } = body;

    const handoverJson = buildHandoverJson(s, aandachtspunten, conversationLog);

    const row: IntakeRow = {
      urgentie: s.urgentie,
      status: "nieuw",
      completeness_score: getCompletenessScore(s),

      situatie_type: s.situatieType,
      reden_ontslag: s.redenOntslag,
      tekentermijn: s.tekentermijnDatum ?? undefined,

      dienstverband_jaren: s.dienstverbandJaren,
      contract_type: s.contractType,
      sector: s.sector,
      cao_naam: s.caoNaam,
      bruto_maandsalaris: s.brutoMaandsalaris,

      naam: s.naam,
      geslacht: s.geslacht,
      geslacht_basis: s.geslachtBasis,
      leeftijd: s.leeftijd,
      emotionele_staat: s.emotioneleStaat,
      email: s.email,
      telefoon: s.telefoon,
      contact_voorkeur: s.contactVoorkeur,

      vso_verwerkt: s.vsoTekstVerwerkt,
      vso_vergoeding: s.vsoAnalyse.vergoedingAangeboden,
      vso_ontbrekende_elementen: s.vsoAnalyse.ontbrekendeStandaardElementen,
      vso_opvallende_clausules: s.vsoAnalyse.opvallendeClausules,

      tv_indicatie:
        s.brutoMaandsalaris && s.dienstverbandJaren
          ? calcTransitievergoeding(s.brutoMaandsalaris, s.dienstverbandJaren)
          : null,
      ww_indicatie_maanden: s.dienstverbandJaren
        ? calcWWDuur(s.dienstverbandJaren)
        : null,

      aandachtspunten,
      handover_json: handoverJson as Record<string, unknown>,
      gesprek_log: conversationLog,
    };

    const { data, error } = await supabaseAdmin
      .from("intakes")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("[/api/save-intake] Supabase fout:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data?.id, handoverJson });
  } catch (error) {
    console.error("[/api/save-intake] Fout:", error);
    return NextResponse.json(
      { error: "Opslaan mislukt. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
