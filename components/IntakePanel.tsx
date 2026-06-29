"use client";

import { useEffect, useRef, useState } from "react";

export interface PanelData {
  naam: string | null;
  situatie: string | null;
  urgentie: "kritiek" | "hoog" | "middel" | "laag" | null;
  tekentermijn: string | null;
  dienstjaren: number | null;
  salaris: number | null;
  leeftijd: number | null;
  sector: string | null;
  tv_indicatie: number | null;
  email: string | null;
  telefoon: string | null;
  terugbel_voorkeur: string | null;
}

export const emptyPanelData: PanelData = {
  naam: null, situatie: null, urgentie: null, tekentermijn: null,
  dienstjaren: null, salaris: null, leeftijd: null, sector: null,
  tv_indicatie: null, email: null, telefoon: null, terugbel_voorkeur: null,
};

const URGENTIE_COLORS = {
  kritiek: "bg-red-100 text-red-700 border-red-200",
  hoog: "bg-orange-100 text-orange-700 border-orange-200",
  middel: "bg-yellow-100 text-yellow-700 border-yellow-200",
  laag: "bg-green-100 text-green-700 border-green-200",
};

function Card({
  label, value, highlight, mono = false,
}: {
  label: string;
  value: string | null;
  highlight?: boolean;
  mono?: boolean;
}) {
  const [flash, setFlash] = useState(false);
  const prevValue = useRef<string | null>(null);

  useEffect(() => {
    if (value && value !== prevValue.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 600);
      prevValue.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 transition-all duration-300 ${
        value
          ? flash
            ? "border-green-300 bg-green-50"
            : "border-gray-100 bg-white"
          : "border-dashed border-gray-200 bg-gray-50"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">
        {label}
      </p>
      <p
        className={`text-sm leading-snug ${
          value
            ? mono
              ? "font-mono font-semibold text-gray-900"
              : "font-medium text-gray-900"
            : "text-gray-300 italic"
        }`}
      >
        {value ?? "—"}
      </p>
    </div>
  );
}

export default function IntakePanel({ data }: { data: PanelData }) {
  const hasAny = Object.values(data).some((v) => v !== null);

  return (
    <div className="flex flex-col h-full bg-gray-50 border-l border-gray-100">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Jouw gegevens
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Vult zich automatisch tijdens het gesprek
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Urgentie badge */}
        {data.urgentie && (
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${URGENTIE_COLORS[data.urgentie]}`}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-current" />
            {data.urgentie === "kritiek" && "Spoed — er is haast bij"}
            {data.urgentie === "hoog" && "Hoge urgentie"}
            {data.urgentie === "middel" && "Normale urgentie"}
            {data.urgentie === "laag" && "Geen directe tijdsdruk"}
          </div>
        )}

        {/* Naam */}
        <Card label="Naam" value={data.naam} />

        {/* Situatie */}
        <Card label="Situatie" value={data.situatie} />

        {/* Tekentermijn */}
        <Card label="Tekentermijn / deadline" value={data.tekentermijn} />

        {/* Dienstverband */}
        <div className="grid grid-cols-2 gap-2">
          <Card
            label="In dienst"
            value={data.dienstjaren !== null ? `${data.dienstjaren} jaar` : null}
          />
          <Card
            label="Leeftijd"
            value={data.leeftijd !== null ? `${data.leeftijd} jaar` : null}
          />
        </div>

        {/* Financieel */}
        <div className="grid grid-cols-2 gap-2">
          <Card
            label="Maandsalaris"
            value={data.salaris !== null ? `€${data.salaris.toLocaleString("nl-NL")}` : null}
            mono
          />
          <Card label="Sector / CAO" value={data.sector} />
        </div>

        {/* TV indicatie — highlight als bekend */}
        {data.tv_indicatie !== null && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 mb-0.5">
              Transitievergoeding (indicatie)
            </p>
            <p className="text-xl font-bold text-green-800">
              €{data.tv_indicatie.toLocaleString("nl-NL")}
            </p>
            <p className="text-[10px] text-green-600 mt-0.5">
              Minimale wettelijke berekening
            </p>
          </div>
        )}

        {/* Contact */}
        {(data.telefoon || data.email || data.terugbel_voorkeur) && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1">
              Terugbelafspraak
            </p>
            <Card label="Telefoonnummer" value={data.telefoon} mono />
            <Card label="E-mail" value={data.email} />
            <Card label="Wanneer terugbellen" value={data.terugbel_voorkeur} />
          </div>
        )}

        {/* Lege staat */}
        {!hasAny && (
          <div className="text-center py-8 px-4">
            <div className="w-8 h-8 rounded-full bg-gray-200 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <p className="text-xs text-gray-400">
              Zodra Lisa informatie ontvangt, verschijnt die hier
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
