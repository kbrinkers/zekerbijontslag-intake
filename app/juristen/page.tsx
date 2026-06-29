"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";

type Intake = {
  id: string;
  created_at: string;
  naam: string | null;
  urgentie: string | null;
  status: string;
  situatie_type: string | null;
  tekentermijn: string | null;
  completeness_score: number | null;
  tv_indicatie: number | null;
  sector: string | null;
  emotionele_staat: string | null;
};

const URGENTIE_STYLES: Record<string, string> = {
  kritiek: "bg-red-100 text-red-700",
  hoog: "bg-orange-100 text-orange-700",
  middel: "bg-yellow-100 text-yellow-700",
  laag: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  nieuw: "Nieuw",
  in_behandeling: "In behandeling",
  wacht_op_klant: "Wacht op klant",
  afgerond: "Afgerond",
  niet_doorgegaan: "Niet doorgegaan",
};

const SITUATIE_LABELS: Record<string, string> = {
  VSO_ontvangen: "VSO ontvangen",
  ontslag_aangezegd: "Ontslag aangezegd",
  ontslag_staande_voet: "Op staande voet",
  reorganisatie: "Reorganisatie",
  ziekte_plus_VSO: "Ziekte + VSO",
  conflict: "Conflict",
  anders: "Anders",
};

export default function JuristenOverzicht() {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("alle");

  useEffect(() => {
    fetch("/api/juristen/intakes")
      .then((r) => r.json())
      .then(({ intakes }) => setIntakes(intakes ?? []))
      .finally(() => setLoading(false));
  }, []);

  const urgentieVolgorde: Record<string, number> = { kritiek: 0, hoog: 1, middel: 2, laag: 3 };
  const sorted = [...intakes]
    .filter((i) => filter === "alle" || i.urgentie === filter || i.status === filter)
    .sort((a, b) => (urgentieVolgorde[a.urgentie ?? "laag"] ?? 3) - (urgentieVolgorde[b.urgentie ?? "laag"] ?? 3));

  const nieuweCount = intakes.filter((i) => i.status === "nieuw").length;
  const kritiekCount = intakes.filter((i) => i.urgentie === "kritiek").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Intakes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {intakes.length} totaal
            {nieuweCount > 0 && <span className="ml-2 text-green-700 font-medium">· {nieuweCount} nieuw</span>}
            {kritiekCount > 0 && <span className="ml-2 text-red-600 font-medium">· {kritiekCount} kritiek</span>}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {["alle", "kritiek", "hoog", "nieuw", "in_behandeling", "afgerond"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === f ? "bg-gray-900 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f === "alle" ? "Alle" : STATUS_LABELS[f] ?? f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Laden…</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Geen intakes gevonden</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Naam</th>
                <th className="text-left px-4 py-3 font-medium">Situatie</th>
                <th className="text-left px-4 py-3 font-medium">Urgentie</th>
                <th className="text-left px-4 py-3 font-medium">Termijn</th>
                <th className="text-left px-4 py-3 font-medium">TV indicatie</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Ontvangen</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((intake) => (
                <tr key={intake.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 font-medium text-gray-900">
                    {intake.naam ?? <span className="text-gray-400 italic">Onbekend</span>}
                    {intake.emotionele_staat === "gespannen" && <span className="ml-1.5 text-xs text-amber-600" title="Gespannen">⚠</span>}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{SITUATIE_LABELS[intake.situatie_type ?? ""] ?? intake.situatie_type ?? "—"}</td>
                  <td className="px-4 py-3.5">
                    {intake.urgentie ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${URGENTIE_STYLES[intake.urgentie] ?? "bg-gray-100 text-gray-600"}`}>
                        {intake.urgentie.charAt(0).toUpperCase() + intake.urgentie.slice(1)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">
                    {intake.tekentermijn ? new Date(intake.tekentermijn).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : "—"}
                  </td>
                  <td className="px-4 py-3.5 text-gray-900">{intake.tv_indicatie ? `€${intake.tv_indicatie.toLocaleString("nl-NL")}` : "—"}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      intake.status === "nieuw" ? "bg-blue-50 text-blue-700" :
                      intake.status === "in_behandeling" ? "bg-green-50 text-green-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {STATUS_LABELS[intake.status] ?? intake.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-400 text-xs">
                    {new Date(intake.created_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/juristen/${intake.id}`} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition">
                      Dossier →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
                    }
