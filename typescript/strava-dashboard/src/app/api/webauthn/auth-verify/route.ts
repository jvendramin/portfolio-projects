import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";

function getOriginAndRpId(request: NextRequest) {
  const host = request.headers.get("host") || "localhost";
  const rpID = process.env.WEBAUTHN_RP_ID || host.split(":")[0];
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const origin = process.env.WEBAUTHN_ORIGIN || `${proto}://${host}`;
  return { rpID, origin };
}

export async function POST(request: NextRequest) {
  try {
    const { response, expectedChallenge, credential } = await request.json();
    const { rpID, origin } = getOriginAndRpId(request);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(Buffer.from(credential.publicKey, "base64")),
        counter: credential.counter,
      },
    });

    if (verification.verified) {
      return NextResponse.json({
        verified: true,
        newCounter: verification.authenticationInfo.newCounter,
      });
    }

    return NextResponse.json({ verified: false }, { status: 400 });
  } catch (error) {
    console.error("Auth verify error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Verification failed" }, { status: 500 });
  }
}
