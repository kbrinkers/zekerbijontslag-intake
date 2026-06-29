import { NextRequest, NextResponse } from "next/server";

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

    // DOCX via mammoth
    if (
      fileName.endsWith(".docx") ||
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;

    // PDF via pdf-parse
    } else if (fileName.endsWith(".pdf") || mimeType === "application/pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      extractedText = result.text;

    // Platte tekst
    } else if (mimeType.startsWith("text/") || fileName.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");

    } else {
      return NextResponse.json(
        { error: "Bestandstype niet ondersteund. Gebruik PDF, Word (.docx) of .txt." },
        { status: 415 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "Kon geen tekst uit het bestand halen." }, { status: 422 });
    }

    return NextResponse.json({ text: extractedText.trim() });
  } catch (err) {
    console.error("extract-document error:", err);
    return NextResponse.json({ error: "Fout bij verwerken van bestand." }, { status: 500 });
  }
}
