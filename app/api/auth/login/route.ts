import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password, redirect } = await req.json();

  if (password !== process.env.JURISTEN_PASSWORD) {
    return NextResponse.json({ error: "Ongeldig wachtwoord" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });

  // Cookie 30 dagen geldig, httpOnly + secure in productie
  response.cookies.set("juristen_auth", process.env.JURISTEN_PASSWORD!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return response;
}
