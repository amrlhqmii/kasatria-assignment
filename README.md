# Kasatria People Explorer

The junior developer assignment: Google sign-in and a live Google Sheet rendered as 200 portrait tiles in Table, Sphere, double Helix, and Grid arrangements. Built with React, TypeScript, Three.js CSS3DRenderer, OrbitControls, and Tween.js.

## Run locally

Use Node.js 22.18+ or 24+, then:

```sh
npm ci
```

Copy `.env.example` to `.env.local` and set the Google OAuth web client ID and spreadsheet ID. Do not add a Google client secret: this browser app uses Google's token client and does not need one.

```sh
npm run dev -- --port 5173
```

Open `http://localhost:5173`, sign in, and allow read-only Google Sheets access. Sessions stay in memory; signing out or reloading clears the token. An expired session returns to sign-in.

## Google setup

1. In the Google Cloud project associated with the client ID, enable **Google Sheets API**.
2. Configure the OAuth consent screen. The app requests `openid`, `email`, `profile`, and `https://www.googleapis.com/auth/spreadsheets.readonly`. If the app is in testing mode, add every reviewer who needs to sign in as a test user.
3. In the OAuth **Web application** client, add `http://localhost:5173` to **Authorized JavaScript origins**. Add `http://localhost:4173` if using the production preview, and add the exact HTTPS origin of the deployed site before submission. This popup token flow does not use a redirect route or client secret.
4. Import the supplied CSV into a tab named **People**. Keep the header row: `Name`, `Photo`, `Age`, `Country`, `Interest`, `Net Worth`.
5. Share the spreadsheet with the reviewer. Any account signing in must also be able to read the Sheet, either directly or through its existing anyone-with-link setting.

The app reads formatted values from `People!A1:F201`: one header and up to 200 profiles. There is no local CSV fallback. `public/data.csv` is the original supplied fixture used by the parser checks. Click **Refresh data** to fetch changes from the Sheet.

## Layouts and interaction

- **Table:** 20 columns by 10 rows for the supplied 200 profiles.
- **Sphere:** portraits positioned on a sphere and facing outward.
- **Helix:** two opposite strands, with two profiles at each of 100 height levels.
- **Grid:** 5 columns by 4 rows by 10 depth layers.

Use the layout buttons to transform the collection. Drag to rotate, scroll or pinch to zoom, and right-drag or use two fingers to pan. Zoom and reset buttons also work with a keyboard. Focus the canvas for arrow-key panning, `+`/`-` zoom, and `Home` reset. Reduced-motion preferences disable animated transitions.

Country and age sit above each portrait, with name, interest, and net worth below. Backgrounds use red for values below $100,000, orange from $100,000 through $200,000, and green above $200,000. The brief leaves exact thresholds unspecified; this convention assigns every value to one category.

## Verify and deploy

```sh
npm test
npm run lint
npm run build
npm run preview -- --port 4173
```

Deploy the generated `dist/` directory to a static HTTPS host. Set the two public `VITE_` variables **before building**; changing host variables after a build does not change the existing bundle. Add the deployed origin to the Google OAuth client and test sign-in and Sheet loading at that URL before sending it to Kasatria.

The unit checks cover the supplied CSV, validation, money/color boundaries, exact table/grid dimensions, spherical radius, and the two helix strands. A successful build or a mocked browser check does not verify Google Cloud settings or real consent; those require signing in with a permitted Google account.

If Google shows **403 access_denied** and says the app is only available to developer-approved testers, open **Google Auth Platform > Audience > Test users** in the Cloud project used by this client ID. Add the exact Google account used to sign in, save, and try again. Sharing the Sheet does not add a person to the OAuth test-user list. Reviewers also need to be added while the OAuth app remains in Testing mode.
