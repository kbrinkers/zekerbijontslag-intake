import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_STATUSES = ["nieuw", "in_behandeling", "wacht_op_klant", "afgerond", "niet_doorgegaan"];

export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();

  if (!id || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Ongeldige status of ID" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("intakes")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
