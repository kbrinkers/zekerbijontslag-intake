"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Intake = {
  id: string;
  created_at: string;
  naam: string | null;
  geslacht: string | null;
  leeftijd: number | null;
  email: string | null;
  telefoon: string | null;
  contact_voorkeur: string | null;
  emotionele_staat: string | null;
  urgentie: string | null;
  status: string;
  situatie_type: string | null;
  reden_ontslag: string | null;
  tekentermijn: string | null;
  dienstverband_jaren: number | null;
  contract_type: string | null;
  sector: string | null;
  cao_naam: string | null;
  bruto_maandsalaris: number | null;
  vso_verwerkt: boolean;
  vso_vergoeding: number | null;
  vso_ontbrekende_elementen: string[] | null;
  vso_opvallende_clausules: string[] | null;
  tv_indicatie: number | null;
  ww_indicatie_maanden: number | null;
  aandachtspunten: string[] | null;
  gesprek_log: { role: string; content: string }[] | null;
};

const STATUS_OPTIONS = [
  { value: "nieuw", label: "Nieuw" },
  { value: "in_behandeling", label: "In behandeling" },
  { value: "wacht_op_klant", label: "Wacht op klant" },
  { value: "afgerond", label: "Afgerond" },
  { value: "niet_doorgegaan", label: "Niet doorgegaan" },
];

const URGENTIE_STYLES: Record<string, string> = {
  kritiek: "bg-red-100 text-red-700",
  hoog: "bg-orange-100 text-orange-700",
  middel: "bg-yellow-100 text-yellow-700",
  laag: "bg-gray-100 text-gray-600",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <dt className="w-44 flex-shrink-0 text-xs text-gray-400 pt-0.5">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
}

export default function DossierPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [intake, setIntake] = useState<Intake | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/juristen/intake/${id}`)
      .then((r) => r.json())
      .then(({ intake }) => setIntake(intake))
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!intake) return;
    setStatusUpdating(true);
    await fetch("/api/juristen/update-status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: intake.id, status: newStatus }),
    });
    setIntake((prev) => prev ? { ...prev, status: newStatus } : prev);
    setStatusUpdating(false);
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-400 text-sm">Laden…</div>;
  }

  if (!intake) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">Dossier niet gevonden.</p>
        <Link href="/juristen" className="text-sm text-green-700 hover:underline">← Terug naar overzicht</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Terug + header */}
      <div>
        <Link href="/juristen" className="text-sm text-gray-400 hover:text-gray-600 transition">
          ← Terug naar overzicht
        </Link>
        <div className="flex items-start justify-between mt-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {intake.naam ?? "Onbekende klant"}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Intake ontvangen op {new Date(intake.created_at).toLocaleDateString("nl-NL", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit"
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {intake.urgentie && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${URGENTIE_STYLES[intake.urgentie]}`}>
                {intake.urgentie.charAt(0).toUpperCase() + intake.urgentie.slice(1)}
              </span>
            )}
            <select
              value={intake.status}
              onChange={(e) => updateStatus(e.target.value)}
              disabled={statusUpdating}
              className="text-sm rounded-lg border border-gray-200 px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contact */}
      <Section title="Contact">
        <Row label="Naam" value={intake.naam} />
        <Row label="Geslacht" value={intake.geslacht} />
        <Row label="Leeftijd" value={intake.leeftijd ? `${intake.leeftijd} jaar` : null} />
        <Row label="E-mail" value={intake.email ? <a href={`mailto:${intake.email}`} className="text-green-700 hover:underline">{intake.email}</a> : null} />
        <Row label="Telefoon" value={intake.telefoon} />
        <Row label="Contact voorkeur" value={intake.contact_voorkeur} />
        <Row label="Emotionele staat" value={intake.emotionele_staat} />
      </Section>

      {/* Situatie */}
      <Section title="Situatie">
        <Row label="Type situatie" value={intake.situatie_type?.replace(/_/g, " ")} />
        <Row label="Reden ontslag" value={intake.reden_ontslag} />
        <Row label="Tekentermijn" value={intake.tekentermijn
          ? new Date(intake.tekentermijn).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
          : null} />
      </Section>

      {/* Dienstverband */}
      <Section title="Dienstverband">
        <Row label="Duur" value={intake.dienstverband_jaren ? `${intake.dienstverband_jaren} jaar` : null} />
        <Row label="Contract" value={intake.contract_type} />
        <Row label="Sector" value={intake.sector} />
        <Row label="CAO" value={intake.cao_naam} />
        <Row label="Bruto maandsalaris" value={intake.bruto_maandsalaris
          ? `€${intake.bruto_maandsalaris.toLocaleString("nl-NL")}`
          : null} />
      </Section>

      {/* Indicaties */}
      {(intake.tv_indicatie || intake.ww_indicatie_maanden) && (
        <Section title="Indicaties (automatisch berekend)">
          <div className="flex gap-4">
            {intake.tv_indicatie && (
              <div className="flex-1 bg-green-50 rounded-xl p-4">
                <p className="text-xs text-green-600 mb-1">Transitievergoeding (min.)</p>
                <p className="text-2xl font-bold text-green-800">
                  €{intake.tv_indicatie.toLocaleString("nl-NL")}
                </p>
              </div>
            )}
            {intake.ww_indicatie_maanden && (
              <div className="flex-1 bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-600 mb-1">WW-aanspraak</p>
                <p className="text-2xl font-bold text-blue-800">
                  {intake.ww_indicatie_maanden} mnd
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* VSO analyse */}
      {intake.vso_verwerkt && (
        <Section title="VSO analyse">
          <Row label="Aangeboden vergoeding" value={intake.vso_vergoeding
            ? `€${intake.vso_vergoeding.toLocaleString("nl-NL")}`
            : null} />
          {intake.vso_ontbrekende_elementen && intake.vso_ontbrekende_elementen.length > 0 && (
            <div className="py-2.5 border-b border-gray-50">
              <dt className="text-xs text-gray-400 mb-2">Ontbrekende elementen</dt>
              <dd className="space-y-1">
                {intake.vso_ontbrekende_elementen.map((el, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-red-700">
                    <span>✗</span> {el}
                  </div>
                ))}
              </dd>
            </div>
          )}
          {intake.vso_opvallende_clausules && intake.vso_opvallende_clausules.length > 0 && (
            <div className="py-2.5">
              <dt className="text-xs text-gray-400 mb-2">Aandachtspunten VSO</dt>
              <dd className="space-y-1">
                {intake.vso_opvallende_clausules.map((cl, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-amber-700">
                    <span>⚠</span> {cl}
                  </div>
                ))}
              </dd>
            </div>
          )}
        </Section>
      )}

      {/* Aandachtspunten */}
      {intake.aandachtspunten && intake.aandachtspunten.length > 0 && (
        <Section title="Aandachtspunten voor jurist">
          <ul className="space-y-1.5">
            {intake.aandachtspunten.map((punt, i) => (
              <li key={i} className="text-sm text-gray-800 flex gap-2">
                <span className="text-green-600 mt-0.5">→</span> {punt}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Gesprekslog */}
      {intake.gesprek_log && intake.gesprek_log.length > 0 && (
        <Section title="Gesprekslog">
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {intake.gesprek_log.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-full bg-green-700 flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold">L</div>
                )}
                <div className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-gray-900 text-white rounded-br-sm"
                    : "bg-gray-50 text-gray-800 border border-gray-100 rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h2>
      <dl>{children}</dl>
    </div>
  );
          }
