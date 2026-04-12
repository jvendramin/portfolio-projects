import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";

const RP_NAME = "Strava Dashboard";

function getRpId(request: NextRequest): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  const host = request.headers.get("host") || "localhost";
  return host.split(":")[0];
}

export async function POST(request: NextRequest) {
  try {
    const rpID = getRpId(request);
    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userName: "dashboard-user",
      userDisplayName: "Dashboard User",
      attestationType: "none",
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("Registration options error:", error);
    return NextResponse.json({ error: "Failed to generate options" }, { status: 500 });
  }
}
