"use client";

import Script from "next/script";
import { useCallback, useEffect, useState } from "react";

/**
 * Puter authentication for the ChachuScape headers.
 *
 * - Loads the Puter.js SDK (js.puter.com/v2) once, lazily.
 * - Signed out: a "Sign in" pill → puter.auth.signIn() popup.
 * - Signed in: avatar chip with the Puter username + a sign-out button
 *   (puter.auth.signOut()).
 * Renders nothing heavy while the SDK loads — the sign-in pill appears
 * disabled until the SDK is ready, so the header never shifts.
 */

type PuterUser = { username?: string };

type PuterApi = {
  auth: {
    isSignedIn: () => boolean;
    signIn: () => Promise<unknown>;
    signOut: () => Promise<unknown>;
    getUser: () => Promise<PuterUser>;
  };
  ai: {
    txt2img: (
      prompt: string,
      options?: Record<string, unknown>,
    ) => Promise<string | { src?: string }>;
  };
  kv: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<unknown>;
  };
  fs: {
    write: (
      path: string,
      data: Blob | File | string,
      options?: Record<string, unknown>,
    ) => Promise<unknown>;
    read: (path: string) => Promise<Blob>;
  };
};

declare global {
  interface Window {
    puter?: PuterApi;
  }
}

export default function PuterAuth() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<PuterUser | null>(null);
  const [busy, setBusy] = useState(false);

  const checkExisting = useCallback(() => {
    const puter = window.puter;
    if (!puter?.auth) return;
    setReady(true);
    if (puter.auth.isSignedIn()) {
      puter.auth.getUser().then(setUser).catch(() => {});
    }
  }, []);

  useEffect(() => {
    // SDK may already be cached and executed before onLoad fires
    checkExisting();
  }, [checkExisting]);

  const onScriptLoad = useCallback(() => checkExisting(), [checkExisting]);

  const signIn = useCallback(async () => {
    const puter = window.puter;
    if (!puter?.auth) return;
    setBusy(true);
    try {
      await puter.auth.signIn();
      setUser(await puter.auth.getUser());
    } catch {
      /* user closed the popup — stay signed out */
    } finally {
      setBusy(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setBusy(true);
    try {
      await window.puter?.auth.signOut();
    } catch {
      /* already signed out */
    }
    setUser(null);
    setBusy(false);
  }, []);

  return (
    <>
      <Script
        src="https://js.puter.com/v2/"
        strategy="afterInteractive"
        onLoad={onScriptLoad}
      />

      {user ? (
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] py-1 pl-1 pr-3">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-[10px] font-bold text-white">
              {(user.username || "?").charAt(0).toUpperCase()}
            </span>
            <span className="max-w-[9rem] truncate text-xs font-medium text-zinc-200">
              {user.username || "you"}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </span>
          <button
            type="button"
            onClick={signOut}
            disabled={busy}
            title="Sign out"
            aria-label="Sign out"
            className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.04] text-zinc-400 transition hover:border-red-400/50 hover:text-white disabled:opacity-50"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 3h4a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={signIn}
          disabled={!ready || busy}
          className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-violet-400/40 hover:text-white disabled:cursor-wait disabled:opacity-50"
        >
          {busy ? "Connecting…" : "Sign in"}
        </button>
      )}
    </>
  );
}
