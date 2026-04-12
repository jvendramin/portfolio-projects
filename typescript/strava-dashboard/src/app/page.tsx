"use client";

import { useState, useEffect, useCallback } from "react";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";
import Dashboard from "@/components/Dashboard";

const CREDENTIAL_KEY = "strava-dash-webauthn-credential";

interface StoredCredential {
  id: string;
  publicKey: string;
  counter: number;
}

function getStoredCredential(): StoredCredential | null {
  try {
    const raw = localStorage.getItem(CREDENTIAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function storeCredential(cred: StoredCredential) {
  localStorage.setItem(CREDENTIAL_KEY, JSON.stringify(cred));
}

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasFaceId, setHasFaceId] = useState(false);
  const [webauthnAvailable, setWebauthnAvailable] = useState(false);
  const [faceIdLoading, setFaceIdLoading] = useState(false);

  useEffect(() => {
    const available =
      typeof window !== "undefined" &&
      !!window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function";

    if (available) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(
        (result) => {
          setWebauthnAvailable(result);
          if (result) {
            setHasFaceId(!!getStoredCredential());
          }
        }
      );
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setAuthenticated(true);
    } else {
      setError("Invalid password");
    }
    setLoading(false);
  }

  const handleFaceIdSetup = useCallback(async () => {
    setFaceIdLoading(true);
    setError("");
    try {
      // Get registration options
      const optionsRes = await fetch("/api/webauthn/register-options", { method: "POST" });
      const options = await optionsRes.json();

      // Trigger Face ID / biometric enrollment
      const registration = await startRegistration({ optionsJSON: options });

      // Verify on server
      const verifyRes = await fetch("/api/webauthn/register-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: registration,
          expectedChallenge: options.challenge,
        }),
      });
      const result = await verifyRes.json();

      if (result.verified) {
        storeCredential(result.credential);
        setHasFaceId(true);
        setAuthenticated(true);
      } else {
        setError(result.error || "Face ID setup verification failed");
      }
    } catch (err) {
      console.error("Face ID setup error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("cancelled") || msg.includes("NotAllowedError")) {
        setError("Face ID setup was cancelled");
      } else {
        setError(`Face ID setup failed: ${msg}`);
      }
    }
    setFaceIdLoading(false);
  }, []);

  const handleFaceIdLogin = useCallback(async () => {
    setFaceIdLoading(true);
    setError("");
    try {
      const credential = getStoredCredential();
      if (!credential) {
        setError("No Face ID registered. Set up Face ID first.");
        setFaceIdLoading(false);
        return;
      }

      // Get auth options
      const optionsRes = await fetch("/api/webauthn/auth-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId: credential.id }),
      });
      const options = await optionsRes.json();

      // Trigger Face ID
      const authentication = await startAuthentication({ optionsJSON: options });

      // Verify on server
      const verifyRes = await fetch("/api/webauthn/auth-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: authentication,
          expectedChallenge: options.challenge,
          credential,
        }),
      });
      const result = await verifyRes.json();

      if (result.verified) {
        // Update counter
        storeCredential({ ...credential, counter: result.newCounter });
        setAuthenticated(true);
      } else {
        setError("Face ID verification failed");
      }
    } catch (err) {
      console.error("Face ID login error:", err);
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("cancelled") || msg.includes("NotAllowedError")) {
        setError("Face ID was cancelled");
      } else {
        setError(`Face ID failed: ${msg}`);
      }
    }
    setFaceIdLoading(false);
  }, []);

  if (authenticated) {
    return <Dashboard />;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-100">
      <form onSubmit={handleSubmit} className="card bg-base-200 shadow-xl p-8 w-full max-w-sm">
        <div className="flex items-center justify-center mb-6">
          <img src="/strava-logo.png" alt="Strava" className="h-12 w-auto mr-3" />
          <h1 className="text-2xl font-bold">Strava Dashboard</h1>
        </div>

        {/* Face ID button */}
        {webauthnAvailable && (
          <div className="mb-4">
            {hasFaceId ? (
              <button
                type="button"
                className="btn btn-primary w-full gap-2"
                onClick={handleFaceIdLogin}
                disabled={faceIdLoading}
              >
                {faceIdLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a48.667 48.667 0 0 0-6 0c0 1.97-.151 3.897-.449 5.769M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-9.563 2.523C6.477 14.3 8.14 15 10 15c.592 0 1.166-.066 1.717-.19M17.66 11.397c-.533 1.278-1.396 2.36-2.48 3.146" />
                  </svg>
                )}
                Sign in with Face ID
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline btn-primary w-full gap-2"
                onClick={handleFaceIdSetup}
                disabled={faceIdLoading}
              >
                {faceIdLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0 1 19.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 0 0 4.5 10.5a48.667 48.667 0 0 0-6 0c0 1.97-.151 3.897-.449 5.769M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-9.563 2.523C6.477 14.3 8.14 15 10 15c.592 0 1.166-.066 1.717-.19M17.66 11.397c-.533 1.278-1.396 2.36-2.48 3.146" />
                  </svg>
                )}
                Set up Face ID
              </button>
            )}
            <div className="divider text-xs opacity-50">or use password</div>
          </div>
        )}

        <fieldset className="fieldset">
          <input
            type="password"
            className={`input w-full ${error ? "input-error" : ""}`}
            required
            placeholder="Password"
            minLength={8}
            pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
            title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
          />
          {error && <p className="text-error text-sm mt-1">{error}</p>}
        </fieldset>
        <button
          type="submit"
          className="btn btn-neutral w-full mt-2"
          disabled={loading}
        >
          {loading ? <span className="loading loading-spinner loading-sm"></span> : "Enter"}
        </button>
      </form>
    </div>
  );
}
