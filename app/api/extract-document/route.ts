import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    let extractedText = "";

    // ââ DOCX via mammoth ââââââââââââââââââââââââââââââââââââââââââââââââââ
    if (
      fileName.endsWith(".docx") ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Dynamic import to avoid edge-runtime issues
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;

    // ââ PDF via Anthropic document API À ®.. ââ
    } else if (fileName.endsWith(".pdf") || mimeType === "application/pdf") {
      const base64 = buffer.toString("base64");
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
              } as Anthropic.DocumentBlockParam,
              {
                type: "text",
                text: "Extraheer de volledige tekst uit dit document. Geef alleen de ruwe tekst terug, geen samenvatting of uitleg.",
              },
            ],
          },
        ],
      });
      const block = response.content[0];
      if (block.type === "text") extractedText = block.text;

    // ââ Platte tekst ââââââââââââââââââââââââââââââââââââââââââââââââââââââ
    } else if (mimeType.startsWith("text/") || fileName.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");

    } else {
      return NextResponse.json(
        { error: "Bestandstype niet ondersteund. Gebruik PDF, Word (.docx) of .txt." },
        { status: 415 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "Kom geen tekst uit het bestand halen." }, { status: 422 });
    }

    return NextResponse.json({ text: extractedText.trim() });
  } catch (err) {
    console.error("extract-document error:", err);
    return NextResponse.json({ error: "Fout bij verwerken van bestand." }, { status: 500 });
  }
}
