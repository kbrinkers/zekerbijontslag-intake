import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { VSOAnalyse } from "@/lib/intake-state";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ExtractVSORequest {
  documentText: string;
}

/**
 * Stap 1 van de twee-staps document-verwerking:
 * Extraheer gestructureerde VSO-data uit een vrije tekst.
 * Het resultaat wordt gebruikt om intakeState.vsoAnalyse bij te werken.
 */
export async function POST(req: NextRequest) {
  try {
    const body: ExtractVSORequest = await req.json();
    const { documentText } = body;

    if (!documentText?.trim()) {
      return NextResponse.json(
        { error: "Geen documenttekst meegegeven" },
        { status: 400 }
      );
    }

    const prompt = `Analyseer de onderstaande vaststellingsovereenkomst (VSO) of ontslagdocument en retourneer UITSLUITEND geldige JSON — geen uitleg, geen markdown, geen codeblok.

Schema (gebruik null voor onbekende velden):
{
  "vergoedingAangeboden": number | null,
  "einddatum": "YYYY-MM-DD" | null,
  "tekentermijn": "YYYY-MM-DD" | null,
  "concurrentiebedingAanwezig": boolean | null,
  "relatiebedingAanwezig": boolean | null,
  "neutraleReferentie": boolean | null,
  "wwVeiligGeformuleerd": boolean | null,
  "finaleKwijtingType": "wederzijds" | "eenzijdig" | null,
  "bedenktijdVermeld": boolean | null,
  "ontbrekendeStandaardElementen": string[],
  "opvallendeClausules": string[]
}

Controleer op deze standaard VSO-elementen en voeg ontbrekende toe aan ontbrekendeStandaardElementen:
- Einddatum dienstverband
- Transitievergoeding (bedrag + berekening)
- Eindafrekening (vakantiedagen, variabele beloning)
- Finale kwijting
- Concurrentiebeding (aanwezig/afwezig + voorwaarden)
- Relatiebeding
- Geheimhoudingsbeding
- Outplacement/scholingsbudget
- Neutrale referentie
- WW-veiligheidsformulering
- Bedenktijd (14 dagen wettelijk)

Voeg bijzondere clausules toe aan opvallendeClausules (bv. eenzijdige kwijting, ruim geheimhoudingsbeding, behoud concurrentiebeding bij reorganisatie).

DOCUMENT:
${documentText}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";

    // JSON parsen — defensief
    let extracted: Partial<VSOAnalyse>;
    try {
      extracted = JSON.parse(rawText) as Partial<VSOAnalyse>;
    } catch {
      // Probeer JSON uit markdown codeblok te halen
      const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        extracted = JSON.parse(match[1]) as Partial<VSOAnalyse>;
      } else {
        throw new Error("Kon JSON niet parsen uit model-output");
      }
    }

    const vsoAnalyse: VSOAnalyse = {
      vergoedingAangeboden: extracted.vergoedingAangeboden ?? null,
      einddatum: extracted.einddatum ?? null,
      concurrentiebedingAanwezig: extracted.concurrentiebedingAanwezig ?? null,
      relatiebedingAanwezig: extracted.relatiebedingAanwezig ?? null,
      neutraleReferentie: extracted.neutraleReferentie ?? null,
      wwVeiligGeformuleerd: extracted.wwVeiligGeformuleerd ?? null,
      finaleKwijtingType: extracted.finaleKwijtingType ?? null,
      bedenktijdVermeld: extracted.bedenktijdVermeld ?? null,
      ontbrekendeStandaardElementen:
        extracted.ontbrekendeStandaardElementen ?? [],
      opvallendeClausules: extracted.opvallendeClausules ?? [],
    };

    return NextResponse.json({ vsoAnalyse });
  } catch (error) {
    console.error("[/api/extract-vso] Fout:", error);
    return NextResponse.json(
      { error: "VSO-extractie mislukt. Controleer de documenttekst." },
      { status: 500 }
    );
  }
}
