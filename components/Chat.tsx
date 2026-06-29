"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  IntakeState,
  initialIntakeState,
  inferUrgentie,
  getCompletenessScore,
} from "@/lib/intake-state";
import { inferGender } from "@/lib/gender-inference";
import MessageList, { Message } from "./MessageList";
import InputArea from "./InputArea";
import Bevestiging from "./Bevestiging";
import IntakePanel, { PanelData, emptyPanelData } from "./IntakePanel";

// ─── DATA-blok parsering ──────────────────────────────────────────────────────

function extractIntakeData(text: string): { clean: string; data: PanelData | null } {
  const match = text.match(/\[INTAKE:(\{[\s\S]*?\})\]/);
  if (!match) return { clean: text.trim(), data: null };
  let data: PanelData | null = null;
  try {
    data = JSON.parse(match[1]) as PanelData;
  } catch {
    // ongeldige JSON
  }
  const clean = text.replace(/\[INTAKE:[\s\S]*?\]/, "").trim();
  return { clean, data };
}

// ─── VSO-detectie ─────────────────────────────────────────────────────────────

const VSO_KEYWORDS = [
  "vaststellingsovereenkomst", "vso", "beeindigingsovereenkomst",
  "transitievergoeding", "artikel 7:900", "finale kwijting", "einddatum dienstverband",
];

const isLikelyVSODocument = (text: string): boolean => {
  const lower = text.toLowerCase();
  const hits = VSO_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  return hits >= 2 && text.length > 500;
};

// ─── Naam-extractie ───────────────────────────────────────────────────────────

const extractNameFromMessage = (text: string): string | null => {
  const patterns = [
    /\bik\s+(?:ben|heet)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /\bmijn\s+naam\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /\bhoi[,.]?\s+ik\s+ben\s+([A-Z][a-z]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
};

// ─── Hoofd component ──────────────────────────────────────────────────────────

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [intakeState, setIntakeState] = useState<IntakeState>(initialIntakeState());
  const [panelData, setPanelData] = useState<PanelData>(emptyPanelData);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [savedIntakeId, setSavedIntakeId] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const initRef = useRef(false);

  // mergePanelData vóór useEffect zodat TypeScript geen hoisting-fout geeft
  const mergePanelData = useCallback((newData: PanelData) => {
    setPanelData((prev) => {
      const merged: PanelData = { ...prev };
      (Object.keys(newData) as (keyof PanelData)[]).forEach((key) => {
        if (newData[key] !== null && newData[key] !== undefined) {
          (merged as unknown as Record<string, unknown>)[key] = newData[key];
        }
      });
      return merged;
    });
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const init = async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [], intakeState: initialIntakeState() }),
        });
        if (!res.ok) throw new Error("Init mislukt");
        const { reply } = await res.json();
        const { clean, data } = extractIntakeData(reply);
        setMessages([{ id: crypto.randomUUID(), role: "assistant", content: clean, timestamp: new Date() }]);
        if (data) mergePanelData(data);
      } catch {
        setMessages([{ id: crypto.randomUUID(), role: "assistant", content: "Hoi! Ik ben Lisa van ZekerbijOntslag.nl. Vertel me eens wat er speelt.", timestamp: new Date() }]);
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, [mergePanelData]);

  const updateStateFromMessage = useCallback((text: string, current: IntakeState): IntakeState => {
    const lower = text.toLowerCase();
    const updated = { ...current };

    const naam = extractNameFromMessage(text);
    if (naam && !updated.naam) {
      updated.naam = naam;
      const { geslacht } = inferGender(naam);
      updated.geslacht = geslacht;
    }

    // Fix: brutoMaandsalaris (niet brutomMaandsalaris)
    const salarisMatch = text.match(/(\d{2,5})\s*(?:euro|\u20ac|eur)?\s*(?:per maand|\/maand|bruto|,-)?/i);
    if (salarisMatch) {
      const val = parseInt(salarisMatch[1]);
      if (val >= 1000 && val <= 30000) updated.brutoMaandsalaris = val;
    }

    const jarenMatch = text.match(/(\d+)\s*(?:jaar|jaren)/i);
    if (jarenMatch) {
      const val = parseInt(jarenMatch[1]);
      if (val >= 0 && val <= 50) updated.dienstverbandJaren = val;
    }

    const leeftijdMatch = text.match(/(\d{2})\s*(?:jaar oud|jaar|jarig)/i);
    if (leeftijdMatch) {
      const val = parseInt(leeftijdMatch[1]);
      if (val >= 16 && val <= 70) updated.leeftijd = val;
    }

    if (lower.includes("vso") || lower.includes("vaststellingsovereenkomst")) {
      updated.situatieType = updated.situatieType ?? "VSO_ontvangen";
    } else if (lower.includes("reorganisatie")) {
      updated.situatieType = "reorganisatie";
    } else if (lower.includes("op staande voet")) {
      updated.situatieType = "ontslag_staande_voet";
      updated.urgentie = "kritiek";
    } else if (lower.includes("ontslag")) {
      updated.situatieType = updated.situatieType ?? "ontslag_aangezegd";
    }

    if (lower.includes("bepaalde tijd") || lower.includes("tijdelijk")) {
      updated.contractType = "bepaald";
    } else if (lower.includes("vaste baan") || lower.includes("vast contract") || lower.includes("onbepaalde tijd")) {
      updated.contractType = "onbepaald";
    }

    if (lower.includes("ziek") && (lower.includes("vso") || lower.includes("ontslag"))) {
      if (updated.situatieType === "VSO_ontvangen") updated.situatieType = "ziekte_plus_VSO";
      updated.urgentie = updated.urgentie ?? "hoog";
    }

    if (lower.includes("niet geslapen") || lower.includes("overvallen") || lower.includes("in shock")) {
      updated.emotioneleStaat = "gespannen";
    }

    return updated;
  }, []);

  const processVSODocument = useCallback(async (text: string): Promise<IntakeState> => {
    try {
      const res = await fetch("/api/extract-vso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentText: text }),
      });
      if (!res.ok) throw new Error("Extract-VSO API fout");
      const { vsoAnalyse } = await res.json();
      const newState = {
        ...intakeState,
        vsoAnalyse,
        vsoTekstVerwerkt: true,
        urgentie: vsoAnalyse.tekentermijn ? inferUrgentie(vsoAnalyse.tekentermijn) : intakeState.urgentie,
        tekentermijnDatum: vsoAnalyse.tekentermijn ?? intakeState.tekentermijnDatum,
        documentenOntvangen: intakeState.documentenOntvangen.includes("VSO")
          ? intakeState.documentenOntvangen
          : [...intakeState.documentenOntvangen, "VSO"],
        situatieType: intakeState.situatieType ?? "VSO_ontvangen",
      };
      setIntakeState(newState);
      return newState;
    } catch {
      return intakeState;
    }
  }, [intakeState]);

  const saveIntake = useCallback(async (state: IntakeState) => {
    if (savedIntakeId) return;
    try {
      const res = await fetch("/api/save-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intakeState: state,
          aandachtspunten: [],
          conversationLog: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (res.ok) {
        const { id } = await res.json();
        setSavedIntakeId(id);
      }
    } catch {}
  }, [messages, savedIntakeId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    try {
      let updatedState = updateStateFromMessage(text, intakeState);
      if (isLikelyVSODocument(text) && !intakeState.vsoTekstVerwerkt) {
        updatedState = await processVSODocument(text);
      } else {
        setIntakeState(updatedState);
      }
      const apiHistory = [...messages, userMessage].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiHistory, intakeState: updatedState }),
      });
      if (!res.ok) throw new Error("Chat API fout");
      const { reply } = await res.json();
      const { clean, data } = extractIntakeData(reply);
      if (data) mergePanelData(data);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: clean, timestamp: new Date() }]);
      const score = getCompletenessScore(updatedState);
      if (score >= 1.0 && !savedIntakeId) await saveIntake(updatedState);
    } catch {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "Sorry, er ging iets mis. Kun je dat nog een keer sturen?", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  }, [intakeState, isLoading, messages, mergePanelData, processVSODocument, savedIntakeId, saveIntake, updateStateFromMessage]);

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Laden...</div>
      </div>
    );
  }

  if (savedIntakeId) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <Bevestiging intakeState={intakeState} />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-57px)]">
      <div className="flex flex-col flex-1 min-w-0">
        {(panelData.urgentie === "kritiek" || panelData.urgentie === "hoog") && (
          <div className={`px-4 py-2 text-xs font-medium text-center ${
            panelData.urgentie === "kritiek"
              ? "bg-red-50 text-red-700 border-b border-red-100"
              : "bg-orange-50 text-orange-700 border-b border-orange-100"
          }`}>
            {panelData.urgentie === "kritiek"
              ? "Er is spoed bij deze situatie - een jurist neemt zo snel mogelijk contact op"
              : "Er is enige tijdsdruk - een jurist neemt spoedig contact op"}
          </div>
        )}
        <MessageList messages={messages} isLoading={isLoading} />
        <InputArea onSend={sendMessage} isLoading={isLoading} />
      </div>

      <button
        onClick={() => setShowPanel((p) => !p)}
        className="lg:hidden fixed bottom-20 right-4 z-10 bg-white border border-gray-200 shadow-md rounded-full px-3 py-2 text-xs font-medium text-gray-600"
      >
        {showPanel ? "x Sluit" : "Jouw gegevens"}
      </button>

      <div className={`
        ${showPanel ? "fixed inset-0 z-20 pt-16" : "hidden"}
        lg:relative lg:block lg:inset-auto lg:z-auto lg:pt-0
        lg:w-72 xl:w-80 flex-shrink-0
      `}>
        <IntakePanel data={panelData} />
      </div>
    </div>
  );
}
