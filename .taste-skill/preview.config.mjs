import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Local visual QA only: exercise the actual UI without Google credentials or live Sheet changes.
export default defineConfig({
  plugins: [
    {
      name: "visual-qa-fixtures",
      enforce: "pre",
      transform(source, id) {
        if (id.replaceAll("\\", "/").endsWith("/src/hooks/useGoogleAuth.ts")) {
          return `
            import { useState } from 'react';
            const fixture = { accessToken: 'visual-qa-only', user: { name: 'Visual QA', email: 'fixture@example.invalid' } };
            export function useGoogleAuth() {
              const [session, setSession] = useState(new URLSearchParams(location.search).get('state') === 'signed-out' ? null : fixture);
              return { session, ready: true, busy: false, error: null, signIn: () => setSession(fixture), signOut: () => setSession(null) };
            }
          `;
        }
        if (id.replaceAll("\\", "/").endsWith("/src/hooks/usePeopleData.ts")) {
          return `
            import { useEffect, useState } from 'react';
            import { parsePeopleCsv } from '/src/lib/dataParser.ts';
            export function usePeopleData(token, refreshKey) {
              const [state, setState] = useState({ people: [], loading: true, error: null });
              useEffect(() => {
                if (!token) return;
                const controller = new AbortController();
                const scenario = new URLSearchParams(location.search).get('state');
                setState({ people: [], loading: true, error: null });
                if (scenario !== 'loading') {
                  fetch('/data.csv', {signal: controller.signal}).then(r => r.arrayBuffer()).then(buffer => {
                    if (scenario === 'error') throw new Error('Visual QA: the data source is unavailable.');
                    const people = scenario === 'empty' ? [] : parsePeopleCsv(new TextDecoder('windows-1252').decode(buffer));
                    if (scenario === 'photo' && people.length) people[0].photo = 'http://example.invalid/blocked.jpg';
                    if (!controller.signal.aborted) setState({ people, loading: false, error: null });
                  }).catch(error => {
                    if (!controller.signal.aborted) setState({ people: [], loading: false, error: error.message });
                  });
                }
                return () => controller.abort();
              }, [token, refreshKey]);
              return state;
            }
          `;
        }
        return source;
      },
    },
    react(),
  ],
  server: { host: "127.0.0.1", port: 5176, strictPort: true },
});
