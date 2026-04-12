import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";

function getOriginAndRpId(request: NextRequest) {
  const host = request.headers.get("host") || "localhost";
  const rpID = process.env.WEBAUTHN_RP_ID || host.split(":")[0];
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = process.env.WEBAUTHN_ORIGIN || `${proto}://${host}`;
  return { rpID, origin };
}

export async function POST(request: NextRequest) {
  try {
    const { response, expectedChallenge } = await request.json();
    const { rpID, origin } = getOriginAndRpId(request);

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      return NextResponse.json({
        verified: true,
        credential: {
          id: credential.id,
          publicKey: Buffer.from(credential.publicKey).toString("base64"),
          counter: credential.counter,
        },
      });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (error) {
    console.error("Registration verify error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 500 });
  }
}
