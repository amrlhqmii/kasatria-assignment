# People Explorer UI refinement

Direction: True-black flat, seed 1158763151. One shell redraw replaced the ruled navigation frame with a viewer shell: this app has one canvas rather than multiple navigation destinations. The existing red/amber/green net-worth mapping remains functional data encoding rather than adopting the dealt lime.

Face: the supplied image.png logo, rendered light against black, and the actual portrait collection. Signature element: the interactive 200-person canvas with Table, Sphere, double Helix and Grid arrangements. Screen question: who is in the collection, and how does net worth vary among them?

## Scope

Refined the header, type hierarchy, neutral surfaces, profile presentation, net-worth legend, responsive spacing, and loading/empty/error presentation. Added explicit zoom/reset controls, keyboard zoom/reset/panning and reduced-motion handling. Integrated the Google sign-in, Sheet source/refresh and layout controls added concurrently by the assignment implementation chat. No dependencies added for the UI. The existing favicon is retained.

The logo is imported directly from the root image.png. CSS invert(1) makes its black artwork readable against the dark header; the source asset is unchanged.

## Verification

- Production build passes: TypeScript and Vite, 30 modules.
- ESLint passes; all 5 assignment tests pass.
- Design source lint: 0 failures, 0 warnings.
- Signed-in viewer inspection at 1440, 768 and 390 pixels: 0 failures; only the development-server warning remains. Reports and screenshots are in after/.
- Compiled production sign-in inspection at those same widths: 0 failures. One intentional whitespace warning remains: the quiet, centered two-column authentication screen keeps attention on the sign-in action. Reports and screenshots are in production/.
- Direct browser checks with isolated local fixtures: 200 profiles; all 200 external portrait images loaded; layout selections; zoom and reset; keyboard focus and shortcuts; sign-out; loading, empty and error states; disabled camera controls during errors; missing-photo initials. No horizontal overflow at 320, 390, 768 or 1440 pixels. Mobile scene and layout controls are 44 pixels tall.
- The local visual-QA Vite config under .taste-skill/ changes only the QA server. Production uses the actual Google authentication and Sheets hooks.

## Critique

ROUND 1
Seen in one second: a collection within a plain dark workspace.
Idea: the real people are the visual material; the shell recedes around them.
Live thing: orbit, zoom, pan, and switch arrangements of the same profiles.
Layout: compact header / canvas toolbar / portrait field / legend / source and interaction hints.
Top problems: the original UI had decorative gradients and glow, a fixed camera framing small profiles inside a large panel, and no visible reset control. Replaced chrome with flat surfaces and moved camera actions into the toolbar.

ROUND 2
Seen in one second: the people canvas and its four arrangements.
The title stays on one line across the three inspector widths; margins align; the mobile toolbar wraps cleanly. Enlarged profile text to 13px after the inspector's small-text warning, improved the mobile count measure, and reduced desktop height so the source/actions stay visible.
Numbers remain computed from parsed records; legend colors come from the same helper as the tiles. Loading and failed values use a dash; an empty collection shows 0. Color is reserved for the existing net-worth bands.
Remaining limit: fitting all 200 profiles makes individual cards small, particularly on phones. Zoom and pan are necessary for reading profiles at that scale. This preserves the spatial overview and existing assignment layouts.

## Assets and limits

No stock or generated pictures were introduced. Logo: supplied image.png. Portraits: the existing supplied dataset URLs. QA uses the real supplied CSV and a clearly synthetic Visual QA session; that session is never bundled in production.

Live Google OAuth/Sheet access, physical touch devices and deployment were not verified by this UI task. Browser fixtures are not evidence of a live authenticated Google session. The automated before-inspection timed out, so there is no complete before/after measurement baseline; the original interface was reviewed directly in the browser.
