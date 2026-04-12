import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    // Redirect to Strava OAuth
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/strava/auth`;
    const url = `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=read,activity:read_all`;
    return NextResponse.redirect(url);
  }

  // Exchange code for token
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "OAuth failed" }, { status: 500 });
  }

  const data = await res.json();

  return NextResponse.json({
    message: "Auth successful! Update your .env.local with these tokens:",
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
  });
}
