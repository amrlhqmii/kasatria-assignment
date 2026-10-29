# Assignment verification

- `npm test`: 5 passing checks for CSV validation, currency/color boundaries, table/grid dimensions, sphere radius, and paired helix strands.
- `npm run build`: passed, producing `dist/`.
- Functional browser run against the production preview: 26 passing checks. Google Identity, userinfo, and Sheets API responses were mocked; the actual React hooks, authenticated request construction, CSV parsing, rendering, and controls ran unchanged.
- Browser coverage: no data requests before sign-in; denied/cancelled sign-in; missing Sheets scope; unverified email; all 200 tiles; four layouts; zoom/reset; refresh; 403/401; malformed/empty data; recovery; sign-out; token expiry; reduced motion; interrupted transitions; 1440px, 768px, and 390px screens without horizontal page overflow.
- Production sign-in inspector: 0 FAIL, 1 WARN. The single warning is intentional empty space around the focused sign-in panel. It has one action and no additional content to fill that space.
- Screenshot review: all layouts and sign-in screens reviewed at desktop, tablet, and phone widths. The collection count reconciles to 200 profiles. Legend colors match tile backgrounds. Layout controls, account controls, and source/refresh actions stay within the page. Small portrait text at fit-to-view scale is expected for 200 profiles; zoom controls remain available.
- Existing visual direction retained: True-black flat, seed 1158763151. No new direction or redraw. Brand image and supplied portrait URLs retained; no generated or invented media.
- Live OAuth remains dependent on Google Cloud settings. The user encountered Google's testing audience restriction; add the exact sign-in email under Google Auth Platform > Audience > Test users. Reviewer accounts need access while the project remains in Testing. Sharing the Sheet is a separate setting.
- No Google Cloud permissions, Sheet content, or sharing settings were changed. No deployment was performed, as requested by the user.
