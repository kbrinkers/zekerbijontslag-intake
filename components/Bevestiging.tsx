"use client";

import { IntakeState, calcTransitievergoeding, calcWWDuur } from "@/lib/intake-state";

interface BevestigingProps {
  intakeState: IntakeState;
}

export default function Bevestiging({ intakeState: s }: BevestigingProps) {
  const tvIndicatie =
    s.brutoMaandsalaris && s.dienstverbandJaren
      ? calcTransitievergoeding(s.brutoMaandsalaris, s.dienstverbandJaren)
      : null;
  const wwIndicatie = s.dienstverbandJaren ? calcWWDuur(s.dienstverbandJaren) : null;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center">
      {/* Vinkje */}
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: "#eef7f0" }}>
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke="#2d7a4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">
        Je aanvraag is ontvangen{s.naam ? `, ${s.naam.split(" ")[0]}` : ""}
      </h2>
      <p className="text-sm text-gray-500 text-center mb-8 max-w-xs">
        Eén van onze juristen neemt zo snel mogelijk contact met je op.
        {s.urgentie === "kritiek" || s.urgentie === "hoog"
          ? " Vanwege de korte termijn proberen we je vandaag nog te bereiken."
          : ""}
      </p>

      {/* Samenvatting */}
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          Jouw situatie op een rij
        </p>

        {s.situatieType && (
          <SummaryRow
            icon="📄"
            label={situatieLabel(s.situatieType)}
          />
        )}
        {s.dienstverbandJaren && (
          <SummaryRow
            icon="📅"
            label={`${s.dienstverbandJaren} jaar in dienst${s.sector ? ` · ${s.sector}` : ""}`}
          />
        )}
        {s.brutoMaandsalaris && (
          <SummaryRow
            icon="💶"
            label={`€${s.brutoMaandsalaris.toLocaleString("nl-NL")} bruto per maand`}
          />
        )}
        {s.tekentermijn && (
          <SummaryRow
            icon={s.urgentie === "kritiek" ? "🔴" : s.urgentie === "hoog" ? "🟠" : "📆"}
            label={`Tekentermijn: ${s.tekentermijn}`}
          />
        )}
      </div>

      {/* Indicaties */}
      {(tvIndicatie || wwIndicatie) && (
        <div className="w-full max-w-sm space-y-3 mb-6">
          <p className="text-xs text-gray-400 text-center">
            Indicatieve berekeningen — ter informatie, geen garantie
          </p>
          <div className="flex gap-3">
            {tvIndicatie && (
              <div className="flex-1 rounded-xl p-3.5 text-center" style={{ backgroundColor: "#eef7f0" }}>
                <p className="text-xs text-gray-500 mb-0.5">Transitievergoeding (min.)</p>
                <p className="text-xl font-bold" style={{ color: "#2d7a4f" }}>
                  €{tvIndicatie.toLocaleString("nl-NL")}
                </p>
              </div>
            )}
            {wwIndicatie && (
              <div className="flex-1 bg-blue-50 rounded-xl p-3.5 text-center">
                <p className="text-xs text-gray-500 mb-0.5">WW-aanspraak</p>
                <p className="text-xl font-bold text-blue-700">{wwIndicatie} mnd</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact */}
      {s.contactVoorkeur && (
        <p className="text-xs text-gray-400 text-center">
          We nemen contact op via{" "}
          <span className="font-medium text-gray-600">
            {s.contactVoorkeur === "terugbelverzoek"
              ? "telefoon"
              : s.contactVoorkeur === "email"
              ? "e-mail"
              : "een afspraak"}
          </span>
          {s.telefoon ? ` op ${s.telefoon}` : s.email ? ` op ${s.email}` : ""}.
        </p>
      )}

      <p className="text-xs text-gray-300 mt-8">ZekerbijOntslag.nl · Gratis juridische begeleiding</p>
    </div>
  );
}

function SummaryRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-700">
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function situatieLabel(type: string): string {
  const map: Record<string, string> = {
    VSO_ontvangen: "Vaststellingsovereenkomst ontvangen",
    ontslag_aangezegd: "Ontslag aangezegd",
    ontslag_staande_voet: "Ontslag op staande voet",
    reorganisatie: "Reorganisatie",
    ziekte_plus_VSO: "Ziek + VSO ontvangen",
    conflict: "Conflictsituatie",
    anders: "Andere ontslagsituatie",
  };
  return map[type] ?? type;
}
