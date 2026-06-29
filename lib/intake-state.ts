// ─── Types ────────────────────────────────────────────────────────────────────

export type Urgentie = "kritiek" | "hoog" | "middel" | "laag" | null;
export type Geslacht = "man" | "vrouw" | "onbekend";
export type EmotioneleStaat = "gespannen" | "verdrietig" | "boos" | "onzeker" | "kalm" | null;
export type SituatieType =
  | "VSO_ontvangen"
  | "ontslag_aangezegd"
  | "ontslag_staande_voet"
  | "reorganisatie"
  | "ziekte_plus_VSO"
  | "conflict"
  | "anders"
  | null;
export type RedenOntslag =
  | "reorganisatie"
  | "disfunctioneren"
  | "ziekte"
  | "conflict"
  | "geen_reden"
  | "anders"
  | null;
export type ContractType = "onbepaald" | "bepaald" | null;
export type ContactVoorkeur = "terugbelverzoek" | "email" | "afspraak" | null;

export interface VSOAnalyse {
  vergoedingAangeboden: number | null;
  einddatum: string | null;          // YYYY-MM-DD
  concurrentiebedingAanwezig: boolean | null;
  relatiebedingAanwezig: boolean | null;
  neutraleReferentie: boolean | null;
  wwVeiligGeformuleerd: boolean | null;
  finaleKwijtingType: "wederzijds" | "eenzijdig" | null;
  bedenktijdVermeld: boolean | null;
  ontbrekendeStandaardElementen: string[];
  opvallendeClausules: string[];
}

export interface IntakeState {
  // VERPLICHT
  situatieType: SituatieType;
  tekentermijn: string | null;           // ISO date string or description
  tekentermijnDatum: string | null;      // YYYY-MM-DD if parsed
  dienstverbandJaren: number | null;
  dienstverbandMaanden: number | null;
  contractType: ContractType;
  leeftijd: number | null;
  brutoMaandsalaris: number | null;

  // BELANGRIJK
  redenOntslag: RedenOntslag;
  sector: string | null;
  caoAanwezig: boolean | null;
  caoNaam: string | null;
  documentenOntvangen: string[];
  vsoTekstVerwerkt: boolean;
  verbetertrajectAanwezig: boolean | null;
  ziekBijOntslag: boolean | null;

  // AFGELEID
  geslacht: Geslacht;
  geslachtBasis: "naam-inferentie" | "zelf_aangegeven" | "onbekend";
  urgentie: Urgentie;
  emotioneleStaat: EmotioneleStaat;

  // VSO analyse (ingevuld na document-verwerking)
  vsoAnalyse: VSOAnalyse;

  // CONTACT
  naam: string | null;
  email: string | null;
  telefoon: string | null;
  contactVoorkeur: ContactVoorkeur;

  // Meta
  oosv: boolean;                         // ontslag op staande voet protocol actief
  afgerond: boolean;
}

// ─── Initiële lege state ──────────────────────────────────────────────────────

export const initialIntakeState = (): IntakeState => ({
  situatieType: null,
  tekentermijn: null,
  tekentermijnDatum: null,
  dienstverbandJaren: null,
  dienstverbandMaanden: null,
  contractType: null,
  leeftijd: null,
  brutoMaandsalaris: null,

  redenOntslag: null,
  sector: null,
  caoAanwezig: null,
  caoNaam: null,
  documentenOntvangen: [],
  vsoTekstVerwerkt: false,
  verbetertrajectAanwezig: null,
  ziekBijOntslag: null,

  geslacht: "onbekend",
  geslachtBasis: "onbekend",
  urgentie: null,
  emotioneleStaat: null,

  vsoAnalyse: {
    vergoedingAangeboden: null,
    einddatum: null,
    concurrentiebedingAanwezig: null,
    relatiebedingAanwezig: null,
    neutraleReferentie: null,
    wwVeiligGeformuleerd: null,
    finaleKwijtingType: null,
    bedenktijdVermeld: null,
    ontbrekendeStandaardElementen: [],
    opvallendeClausules: [],
  },

  naam: null,
  email: null,
  telefoon: null,
  contactVoorkeur: null,

  oosv: false,
  afgerond: false,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const REQUIRED_FIELDS: (keyof IntakeState)[] = [
  "situatieType",
  "tekentermijn",
  "dienstverbandJaren",
  "contractType",
  "leeftijd",
  "brutoMaandsalaris",
];

export const getCompletenessScore = (state: IntakeState): number => {
  const filled = REQUIRED_FIELDS.filter(
    (f) => state[f] !== null && state[f] !== undefined
  ).length;
  return filled / REQUIRED_FIELDS.length;
};

/** Indicatieve transitievergoeding (wettelijk minimum) in euro's */
export const calcTransitievergoeding = (
  brutoMaandsalaris: number,
  dienstverbandJaren: number
): number => (brutoMaandsalaris * dienstverbandJaren) / 3;

/** Indicatieve WW-duur in maanden */
export const calcWWDuur = (dienstverbandJaren: number): number =>
  Math.min(dienstverbandJaren, 24);

/** Urgentie afleiden uit tekentermijn-datum (t.o.v. vandaag) */
export const inferUrgentie = (tekentermijnDatum: string | null): Urgentie => {
  if (!tekentermijnDatum) return "laag";
  const dagen = Math.round(
    (new Date(tekentermijnDatum).getTime() - Date.now()) / 86_400_000
  );
  if (dagen < 3) return "kritiek";
  if (dagen <= 7) return "hoog";
  if (dagen <= 14) return "middel";
  return "laag";
};

// ─── Handover JSON builder ────────────────────────────────────────────────────

export const buildHandoverJson = (
  state: IntakeState,
  aandachtspunten: string[] = [],
  conversationLog: { role: string; content: string }[] = []
) => ({
  intake_meta: {
    datum: new Date().toISOString(),
    versie: "2.0",
    urgentie: state.urgentie ?? "laag",
    completeness_score: getCompletenessScore(state),
  },
  client: {
    naam: state.naam,
    geslacht: state.geslacht,
    geslacht_basis: state.geslachtBasis,
    leeftijd: state.leeftijd,
    emotionele_staat: state.emotioneleStaat,
    email: state.email,
    telefoon: state.telefoon,
    contact_voorkeur: state.contactVoorkeur,
  },
  situatie: {
    type: state.situatieType,
    reden_werkgever: state.redenOntslag,
    tekentermijn_datum: state.tekentermijnDatum,
    tekentermijn_beschrijving: state.tekentermijn,
    oosv_datum: state.oosv ? state.tekentermijn : null,
  },
  dienstverband: {
    duur_jaren: state.dienstverbandJaren,
    duur_maanden: state.dienstverbandMaanden,
    contract_type: state.contractType,
    sector: state.sector,
    cao: state.caoAanwezig,
    cao_naam: state.caoNaam,
    bruto_maandsalaris: state.brutoMaandsalaris,
  },
  documenten: {
    vso_concept: state.documentenOntvangen.includes("VSO"),
    vso_tekst_verwerkt: state.vsoTekstVerwerkt,
    ontslagbrief: state.documentenOntvangen.includes("ontslagbrief"),
    pip_verbetertraject: state.verbetertrajectAanwezig ?? false,
    ziekmelding: state.ziekBijOntslag ?? false,
    andere: state.documentenOntvangen
      .filter((d) => d !== "VSO" && d !== "ontslagbrief")
      .join(", "),
  },
  vso_analyse: {
    vergoeding_aangeboden: state.vsoAnalyse.vergoedingAangeboden,
    einddatum: state.vsoAnalyse.einddatum,
    concurrentiebeding_aanwezig: state.vsoAnalyse.concurrentiebedingAanwezig,
    relatiebeding_aanwezig: state.vsoAnalyse.relatiebedingAanwezig,
    neutrale_referentie: state.vsoAnalyse.neutraleReferentie,
    ww_veilig_geformuleerd: state.vsoAnalyse.wwVeiligGeformuleerd,
    finale_kwijting_type: state.vsoAnalyse.finaleKwijtingType,
    bedenktijd_vermeld: state.vsoAnalyse.bedenktijdVermeld,
    ontbrekende_standaard_elementen:
      state.vsoAnalyse.ontbrekendeStandaardElementen,
  },
  indicaties:
    state.brutoMaandsalaris && state.dienstverbandJaren
      ? {
          tv_indicatie_euro: calcTransitievergoeding(
            state.brutoMaandsalaris,
            state.dienstverbandJaren
          ),
          tv_basis: "wettelijk minimum",
          ww_indicatie_maanden: calcWWDuur(state.dienstverbandJaren),
        }
      : null,
  aandachtspunten,
  inferenties: {
    geslacht_afgeleid_van: state.geslachtBasis,
    urgentie_afgeleid_van: state.tekentermijnDatum ? "tekentermijn" : "onbekend",
  },
  gesprek_log: conversationLog,
});
