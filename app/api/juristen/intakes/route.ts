import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("intakes")
    .select(
      "id, created_at, naam, urgentie, status, situatie_type, tekentermijn, " +
      "completeness_score, bruto_maandsalaris, dienstverband_jaren, " +
      "tv_indicatie, sector, email, telefoon, contact_voorkeur, emotionele_staat"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ intakes: data });
}
