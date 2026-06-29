import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT } from "@/lib/system-prompt";
import { IntakeState } from "@/lib/intake-state";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  intakeState: IntakeState;
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { messages, intakeState } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Geen berichten meegegeven" },
        { status: 400 }
      );
    }

    // Voeg interne state toe als systeem-context die niet zichtbaar is voor de klant.
    // We injecteren het als een extra user-bericht vlak voor het laatste bericht.
    const stateContext: ChatMessage = {
      role: "user",
      content: `[SYSTEEM — NIET TONEN AAN KLANT]
Huidige intake state (bijgewerkt na het vorige bericht):
${JSON.stringify(intakeState, null, 2)}

Gebruik deze state om:
1. Nooit te vragen naar informatie die al bekend is
2. Inferenties toe te passen (geslacht, urgentie, TV/WW indicaties)
3. De meest urgente ontbrekende vraag te stellen

Het volgende bericht is van de klant:`,
    };

    // Berichten-array opbouwen: alles t/m op één na laatste + state-context + laatste bericht
    const lastMessage = messages[messages.length - 1];
    const precedingMessages = messages.slice(0, -1);

    const apiMessages: ChatMessage[] = [
      ...precedingMessages,
      stateContext,
      lastMessage,
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: apiMessages,
    });

    const assistantText =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply: assistantText });
  } catch (error) {
    console.error("[/api/chat] Fout:", error);
    return NextResponse.json(
      { error: "Er is een serverfout opgetreden. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
