import { useEffect, useRef, useState } from "react";
import { SHEETS_SCOPE } from "../lib/googleSheets";

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  error?: string;
}

interface TokenClient {
  requestAccessToken: (options: { prompt: string }) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback: (error: { type: string }) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

interface GoogleSession {
  accessToken: string;
  expiresAt: number;
  user: { name: string; email: string };
}

export function useGoogleAuth() {
  const [session, setSession] = useState<GoogleSession | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<TokenClient | null>(null);
  const profileRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const sheetId = import.meta.env.VITE_SPREADSHEET_ID;
    const fail = (message: string) => {
      if (!active) return;
      setError(message);
      setBusy(false);
    };
    const initialize = () => {
      if (!active || !window.google?.accounts.oauth2) return;
      clientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: `openid email profile ${SHEETS_SCOPE}`,
        callback: (response) => {
          if (!active) return;
          if (response.error || !response.access_token) {
            fail(response.error === "access_denied"
              ? "Google access was denied. If this app is in Testing mode, ask the project owner to add your Google email under Google Auth Platform → Audience → Test users, then try again."
              : "Sign-in was not completed. Please try again.");
            return;
          }
          if (!response.scope?.split(" ").includes(SHEETS_SCOPE)) {
            fail("Read-only Google Sheets access is needed to load the collection. Please sign in again and allow it.");
            return;
          }
          const lifetime = Number(response.expires_in);
          if (!Number.isFinite(lifetime) || lifetime <= 0) {
            fail("Google returned an invalid session. Please sign in again.");
            return;
          }
          const accessToken = response.access_token;
          const expiresAt = Date.now() + lifetime * 1000;
          const controller = new AbortController();
          profileRequest.current?.abort();
          profileRequest.current = controller;
          void (async () => {
            try {
              const result = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
                headers: { Authorization: `Bearer ${accessToken}` },
                signal: controller.signal,
              });
              if (!result.ok) throw new Error("Unable to verify your Google account. Please sign in again.");
              const user = await result.json();
              if (typeof user.email !== "string" || !user.email || user.email_verified !== true) {
                throw new Error("Google did not return a verified email address. Please try another account.");
              }
              if (active && !controller.signal.aborted) {
                setSession({ accessToken, expiresAt, user: { email: user.email, name: typeof user.name === "string" ? user.name : user.email } });
                setError(null);
                setBusy(false);
              }
            } catch (err) {
              if (!controller.signal.aborted) fail(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
            }
          })();
        },
        error_callback: ({ type }) => {
          fail(type === "popup_closed"
            ? "The sign-in window was closed. You can try again."
            : "Unable to open Google sign-in. Allow pop-ups for this site and try again.");
        },
      });
      setReady(true);
      setError(null);
    };

    if (!clientId || !sheetId) {
      // Configuration is fixed at build time; expose the missing setup on the sign-in screen.
      queueMicrotask(() => fail("Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID and VITE_SPREADSHEET_ID, then restart or rebuild the app."));
      return () => { active = false; };
    }

    let script = document.querySelector<HTMLScriptElement>("#google-identity");
    if (!script) {
      script = document.createElement("script");
      script.id = "google-identity";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      document.head.appendChild(script);
    }
    const scriptFailed = () => fail("Google sign-in could not load. Check your connection or content blocker, then reload the page.");
    script.addEventListener("load", initialize);
    script.addEventListener("error", scriptFailed);
    const timeout = window.setTimeout(() => {
      if (!clientRef.current) scriptFailed();
    }, 15_000);
    if (window.google?.accounts.oauth2) queueMicrotask(initialize);

    return () => {
      active = false;
      window.clearTimeout(timeout);
      script.removeEventListener("load", initialize);
      script.removeEventListener("error", scriptFailed);
      profileRequest.current?.abort();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    const timeout = window.setTimeout(() => {
      setSession(null);
      setError("Your Google session expired. Sign in again to continue.");
    }, Math.max(0, session.expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [session]);

  const signIn = () => {
    if (!clientRef.current) return;
    setError(null);
    setBusy(true);
    try {
      clientRef.current.requestAccessToken({ prompt: "select_account" });
    } catch {
      setBusy(false);
      setError("Unable to open Google sign-in. Please try again.");
    }
  };

  const signOut = () => {
    profileRequest.current?.abort();
    setSession(null);
    setBusy(false);
    setError(null);
  };

  return { session, ready, busy, error, signIn, signOut };
}
