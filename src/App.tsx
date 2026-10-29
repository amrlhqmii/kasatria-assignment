import { useRef, useState } from "react";
import ThreeScene from "./components/visualization/ThreeScene";
import type { SceneControls } from "./components/visualization/ThreeScene";
import { usePeopleData } from "./hooks/usePeopleData";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { getNetWorthColor } from "./lib/dataParser";
import { SHEET_URL } from "./lib/googleSheets";
import { LAYOUTS } from "./lib/sceneLayouts";
import type { Layout } from "./lib/sceneLayouts";
import logo from "../image.png";

const worthBands = [
  { label: "Below $100K", color: getNetWorthColor(0) },
  { label: "$100K–$200K", color: getNetWorthColor(100_000) },
  { label: "Above $200K", color: getNetWorthColor(200_001) },
];

function App() {
  const auth = useGoogleAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [layout, setLayout] = useState<Layout>("Table");
  const { people, loading, error } = usePeopleData(auth.session?.accessToken ?? null, refreshKey);
  const sceneRef = useRef<SceneControls>(null);
  const ready = !loading && !error && people.length > 0;

  return (
    <main className="app">
      <header className="workspace-header">
        <div className="brand">
          <img className="brand-logo" src={logo} width="150" height="45" alt="Kasatria" />
          <span className="workspace-name">People & data</span>
        </div>
        {auth.session ? (
          <div className="account-controls">
            <span className="account-name" title={auth.session.user.email}>{auth.session.user.name}</span>
            <button className="text-button" onClick={auth.signOut}>Sign out</button>
          </div>
        ) : <span className="source-label">Development assignment</span>}
      </header>

      {!auth.session ? (
        <section className="sign-in-panel" aria-labelledby="sign-in-title">
          <div className="sign-in-copy">
            <h1 id="sign-in-title">People Explorer</h1>
            <p>Explore 200 people from our Google Sheet in four interactive 3D layouts.</p>
          </div>
          <div className="sign-in-card">
            <h2>Welcome to the collection</h2>
            <p>Sign in with Google to load the latest profiles.</p>
            <button className="google-button" disabled={!auth.ready || auth.busy} onClick={auth.signIn}>
              <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M44.5 24.5c0-1.5-.1-2.9-.4-4.3H24v8.1h11.5a9.8 9.8 0 0 1-4.3 6.5v5.4h6.9c4-3.7 6.4-9.1 6.4-15.7Z"/><path fill="#34A853" d="M24 45c5.7 0 10.5-1.9 14-5.1l-6.8-5.3c-1.9 1.3-4.3 2-7.2 2-5.5 0-10.2-3.7-11.9-8.7h-7v5.5A21.1 21.1 0 0 0 24 45Z"/><path fill="#FBBC05" d="M12.1 27.9a12.7 12.7 0 0 1 0-7.8v-5.5h-7a21 21 0 0 0 0 18.8l7-5.5Z"/><path fill="#EA4335" d="M24 11.4c3.1 0 5.8 1.1 8 3.1l6-6A20.2 20.2 0 0 0 24 3 21.1 21.1 0 0 0 5.1 14.6l7 5.5c1.7-5 6.4-8.7 11.9-8.7Z"/></svg>
              {auth.busy ? "Signing in…" : !auth.ready && !auth.error ? "Loading Google sign-in…" : "Sign in with Google"}
            </button>
            <p className="sign-in-note">Read-only access. Your Sheet stays unchanged.</p>
            {auth.error && <p className="auth-error" role="alert">{auth.error}</p>}
            {!auth.ready && auth.error && <button className="text-button" onClick={() => window.location.reload()}>Reload sign-in</button>}
          </div>
        </section>
      ) : <>
      <div className="app-header">
        <div>
          <h1>People Explorer</h1>
          <p>A different perspective on people and their net worth.</p>
        </div>
        <div className="record-count" role="status">
          <strong>{loading || error ? "—" : people.length.toLocaleString()}</strong>
          <span>{error ? "Profiles unavailable" : "Profiles in this collection"}</span>
        </div>
      </div>

      <section className="visualization-panel" aria-labelledby="canvas-title" aria-busy={loading}>
        <div className="scene-toolbar">
          <div className="canvas-heading">
            <h2 id="canvas-title">People canvas</h2>
            <span>Interactive 3D view</span>
          </div>
          <div className="scene-controls" aria-label="Camera controls">
            <button className="icon-button" aria-label="Zoom out" title="Zoom out (−)" disabled={!ready} onClick={() => sceneRef.current?.zoom(1.25)}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 10h10" /></svg>
            </button>
            <button className="icon-button" aria-label="Zoom in" title="Zoom in (+)" disabled={!ready} onClick={() => sceneRef.current?.zoom(0.8)}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M5 10h10M10 5v10" /></svg>
            </button>
            <button className="reset-button" disabled={!ready} onClick={() => sceneRef.current?.reset()}>
              <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 8a6 6 0 1 1 0 5M4 3v5h5" /></svg>
              Reset view
            </button>
          </div>
        </div>

        <div className="layout-toolbar">
          <div className="layout-controls" role="group" aria-label="Arrangement">
            {LAYOUTS.map((option) => (
              <button key={option} aria-pressed={layout === option} disabled={!ready} onClick={() => setLayout(option)}>
                {option}
              </button>
            ))}
          </div>
          <span className="layout-description" role="status">
            {layout === "Table" ? "20 columns × 10 rows" : layout === "Helix" ? "Double helix" : layout === "Grid" ? "5 × 4 × 10" : "Spherical arrangement"}
          </span>
        </div>

        <div className="scene-viewport">
          {loading ? (
            <div className="center-message" role="status">
              <span className="loading-indicator" aria-hidden="true" />
              <h3>Gathering the collection</h3>
              <p>Loading people data…</p>
            </div>
          ) : error ? (
            <div className="center-message error" role="alert">
              <h3>Unable to load data</h3>
              <p>{error}</p>
              <button className="reset-button" onClick={() => setRefreshKey((key) => key + 1)}>Try again</button>
            </div>
          ) : people.length === 0 ? (
            <div className="center-message" role="status">
              <h3>No people in this collection</h3>
              <p>Add profiles to the People tab of the Google Sheet, then refresh.</p>
            </div>
          ) : (
            <ThreeScene ref={sceneRef} people={people} layout={layout} />
          )}
        </div>

        <div className="scene-footer">
          <div className="legend" aria-label="Net worth ranges in US dollars">
            <span className="legend-title">Net worth</span>
            {worthBands.map((band) => (
              <span key={band.label}>
                <i className="legend-swatch" style={{ backgroundColor: band.color }} aria-hidden="true" />
                {band.label}
              </span>
            ))}
          </div>
          <span className="currency-label">USD</span>
        </div>
      </section>

      <footer className="app-footer">
        <div className="data-source">
          <span>Source <a className="source-file" href={SHEET_URL} target="_blank" rel="noreferrer">Google Sheets</a></span>
          <button className="text-button" disabled={loading} onClick={() => setRefreshKey((key) => key + 1)}>Refresh data</button>
        </div>
        <div className="interaction-hints">
          <span className="desktop-hint">Drag to rotate <span aria-hidden="true">·</span> Scroll to zoom <span aria-hidden="true">·</span> Right-drag to pan</span>
          <span className="touch-hint">Drag to rotate · Pinch to zoom · Two fingers to pan</span>
        </div>
      </footer>
      </>}
    </main>
  );
}

export default App;
