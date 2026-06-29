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

// ─── VSO-detectie heuristiek ─────────────────────────────────────────────────

const VSO_KEYWORDS = [
  "vaststellingsovereenkomst",
  "vso",
  "beëindigingsovereenkomst",
  "transitievergoeding",
  "artikel 7:900",
  "finale kwijting",
  "einddatum dienstverband",
];

const isLikelyVSODocument = (text: string): boolean => {
  const lower = text.toLowerCase();
  const hits = VSO_KEYWORDS.filter((kw) => lower.includes(kw)).length;
  return hits >= 2 && text.length > 500;
};

// ─── Naam-extractie heuristiek ───────────────────────────────────────────────

const extractNameFromMessage = (text: string): string | null => {
  // "Ik ben [Naam]" / "Ik heet [Naam]" / "Mijn naam is [Naam]"
  const patterns = [
    /\bik\s+(?:ben|heet)\s+([A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜ][a-zàáâãäåæçèéêëìíîïðñòóôõöùúûüß]+(?:\s+[A-Z][a-z]+)*)/i,
    /\bmijn\s+naam\s+is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /\bhoi[,.]?\s+ik\s+ben\s+([A-Z][a-z]+)/i,
    /\bhallo[,.]?\s+ik\s+ben\s+([A-Z][a-z]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
};

// ─── Tekentermijn-extractie heuristiek ───────────────────────────────────────

const extractDeadlineFromMessage = (text: string): string | null => {
  // Zoek patronen als "maandag", "vrijdag", "10 juli", "15-07-2024", etc.
  const dayMatch = text.match(
    /\b(maandag|dinsdag|woensdag|donderdag|vrijdag|zaterdag|zondag)\b/i
  );
  if (dayMatch) return dayMatch[1];

  const dateMatch = text.match(
    /(\d{1,2})\s*(januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december)/i
  );
  if (dateMatch) return `${dateMatch[1]} ${dateMatch[2]}`;

  const isoMatch = text.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}-\d{1,2}-\d{4})/);
  if (isoMatch) return isoMatch[1];

  return null;
};

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [intakeState, setIntakeState] = useState<IntakeState>(
    initialIntakeState()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [savedIntakeId, setSavedIntakeId] = useState<string | null>(null);
  const initRef = useRef(false);

  // ─── Openingsbericht ophalen bij mount ────────────────────────────────────

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const openingMessages: Message[] = [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hoi! Ik ben Lisa van ZekerbijOntslag.nl. Ik help je vandaag met je situatie rondom ontslag of een vaststellingsovereenkomst.\n\nWat is er precies aan de hand? Vertel het me in je eigen woorden.",
        timestamp: new Date(),
      },
    ];
    setMessages(openingMessages);
    setIsInitialized(true);
  }, []);

  // ─── State bijwerken op basis van gebruikersbericht ──────────────────────

  const updateStateFromMessage = useCallback(
    (text: string, currentState: IntakeState): IntakeState => {
      const updated = { ...currentState };

      // Naam detecteren
      if (!updated.naam) {
        const naam = extractNameFromMessage(text);
        if (naam) {
          updated.naam = naam;
          const { geslacht, basis } = inferGender(naam);
          updated.geslacht = geslacht;
          updated.geslachtBasis = basis;
        }
      }

      // Tekentermijn detecteren
      if (!updated.tekentermijn) {
        const deadline = extractDeadlineFromMessage(text);
        if (deadline) {
          updated.tekentermijn = deadline;
          updated.urgentie = inferUrgentie(updated.tekentermijnDatum);
        }
      }

      // OOSV detecteren
      const lower = text.toLowerCase();
      if (
        lower.includes("ontslag op staande voet") ||
        lower.includes("op staande voet")
      ) {
        updated.oosv = true;
        updated.urgentie = "kritiek";
        updated.situatieType = "ontslag_staande_voet";
      }

      // VSO detecteren
      if (
        lower.includes("vaststellingsovereenkomst") ||
        lower.includes(" vso ")
      ) {
        if (!updated.situatieType) {
          updated.situatieType = "VSO_ontvangen";
        }
        if (!updated.documentenOntvangen.includes("VSO")) {
          updated.documentenOntvangen = [...updated.documentenOntvangen, "VSO"];
        }
      }

      // Reorganisatie detecteren
      if (lower.includes("reorganisatie") || lower.includes("collectief ontslag")) {
        updated.redenOntslag = "reorganisatie";
        if (!updated.situatieType) {
          updated.situatieType = "reorganisatie";
        }
      }

      // Ziekte detecteren
      if (
        lower.includes("ziek") ||
        lower.includes("ziekteverlof") ||
        lower.includes("arbeidsongeschikt")
      ) {
        updated.ziekBijOntslag = true;
        if (updated.situatieType === "VSO_ontvangen") {
          updated.situatieType = "ziekte_plus_VSO";
          updated.urgentie = updated.urgentie ?? "hoog";
        }
      }

      // Emotionele staat detecteren
      if (
        lower.includes("niet geslapen") ||
        lower.includes("overvallen") ||
        lower.includes("wist niet meer") ||
        lower.includes("in shock")
      ) {
        updated.emotioneleStaat = "gespannen";
      } else if (
        lower.match(/[A-Z]{4,}/) ||
        (text.match(/!/g) ?? []).length > 2
      ) {
        updated.emotioneleStaat = "boos";
      }

      return updated;
    },
    []
  );

  // ─── VSO-document verwerken ───────────────────────────────────────────────

  const processVSODocument = useCallback(
    async (text: string): Promise<IntakeState> => {
      try {
        const res = await fetch("/api/extract-vso", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentText: text }),
        });
        if (!res.ok) throw new Error("Extract-VSO API fout");
        const { vsoAnalyse } = await res.json();

        setIntakeState((prev) => ({
          ...prev,
          vsoAnalyse,
          vsoTekstVerwerkt: true,
          urgentie: vsoAnalyse.tekentermijn
            ? inferUrgentie(vsoAnalyse.tekentermijn)
            : prev.urgentie,
          tekentermijnDatum: vsoAnalyse.tekentermijn ?? prev.tekentermijnDatum,
          documentenOntvangen: prev.documentenOntvangen.includes("VSO")
            ? prev.documentenOntvangen
            : [...prev.documentenOntvangen, "VSO"],
          situatieType: prev.situatieType ?? "VSO_ontvangen",
        }));

        // Return bijgewerkte state voor meesturen aan chat-API
        return {
          ...intakeState,
          vsoAnalyse,
          vsoTekstVerwerkt: true,
          urgentie: vsoAnalyse.tekentermijn
            ? inferUrgentie(vsoAnalyse.tekentermijn)
            : intakeState.urgentie,
          tekentermijnDatum:
            vsoAnalyse.tekentermijn ?? intakeState.tekentermijnDatum,
          documentenOntvangen: intakeState.documentenOntvangen.includes("VSO")
            ? intakeState.documentenOntvangen
            : [...intakeState.documentenOntvangen, "VSO"],
          situatieType: intakeState.situatieType ?? "VSO_ontvangen",
        };
      } catch (err) {
        console.error("VSO extractie fout:", err);
        return intakeState;
      }
    },
    [intakeState]
  );

  // ─── Intake opslaan in Supabase ───────────────────────────────────────────

  const saveIntake = useCallback(
    async (state: IntakeState) => {
      if (savedIntakeId) return; // Niet dubbel opslaan

      try {
        const conversationLog = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/save-intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            intakeState: state,
            aandachtspunten: [],
            conversationLog,
          }),
        });

        if (res.ok) {
          const { id } = await res.json();
          setSavedIntakeId(id);
          console.info("Intake opgeslagen met ID:", id);
        }
      } catch (err) {
        console.error("Opslaan intake mislukt:", err);
      }
    },
    [messages, savedIntakeId]
  );

  // ─── Bericht versturen ────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // 1. State bijwerken op basis van dit bericht
        let updatedState = updateStateFromMessage(text, intakeState);

        // 2. VSO-document detecteren → twee-staps verwerking
        if (isLikelyVSODocument(text) && !intakeState.vsoTekstVerwerkt) {
          updatedState = await processVSODocument(text);
        } else {
          setIntakeState(updatedState);
        }

        // 3. Gesprek ophalen voor API (user + assistant beurten zonder systeem-berichten)
        const apiHistory = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // 4. Chat API aanroepen
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: apiHistory,
            intakeState: updatedState,
          }),
        });

        if (!res.ok) throw new Error("Chat API fout");
        const { reply } = await res.json();

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // 5. Controleer of intake klaar is voor opslaan
        const score = getCompletenessScore(updatedState);
        if (score >= 1.0 && !savedIntakeId) {
          await saveIntake(updatedState);
        }
      } catch (err) {
        console.error("sendMessage fout:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Sorry, er is even iets misgegaan aan mijn kant. Kun je dat nog een keer sturen?",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      intakeState,
      isLoading,
      messages,
      processVSODocument,
      savedIntakeId,
      saveIntake,
      updateStateFromMessage,
    ]
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-sm">Laden…</div>
      </div>
    );
  }

  // Bevestigingspagina tonen zodra de intake is opgeslagen
  if (savedIntakeId) {
    return (
      <div className="flex flex-col h-[calc(100vh-57px)]">
        <Bevestiging intakeState={intakeState} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Voortgangsbalk */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-500"
              style={{
                width: `${Math.round(getCompletenessScore(intakeState) * 100)}%`,
                backgroundColor: "var(--brand)",
              }}
            />
          </div>
          {intakeState.urgentie === "kritiek" && (
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              Urgentie: kritiek
            </span>
          )}
          {intakeState.urgentie === "hoog" && (
            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              Urgentie: hoog
            </span>
          )}
        </div>
      </div>

      {/* Berichten */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Invoer */}
      <InputArea onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
