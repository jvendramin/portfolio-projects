import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";

function getRpId(request: NextRequest): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  const host = request.headers.get("host") || "localhost";
  return host.split(":")[0];
}

export async function POST(request: NextRequest) {
  try {
    const { credentialId } = await request.json();
    const rpID = getRpId(request);

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
      allowCredentials: credentialId
        ? [{ id: credentialId, transports: ["internal"] }]
        : [],
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("Auth options error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate options" }, { status: 500 });
  }
}
