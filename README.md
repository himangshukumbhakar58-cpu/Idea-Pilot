# IdeaPilot

**Know What to Create Next.** A React frontend for creator research, content opportunity discovery and strategy.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open **http://127.0.0.1:5173**. Open this project folder in VS Code to continue development.

```sh
npm run build
npm run preview
npm test
```

## Demo walkthrough

1. Open the landing page. The headline assembles from pixels and the research box types example prompts. Enter a topic, choose YouTube or Instagram / Reels, and continue to the research form. Enter submits; Shift+Enter adds a new line. **Discover Content Opportunities** opens onboarding.
2. Complete the six-step creator profile; it saves on this device.
3. Explore the dashboard and its four-agent workflow.
4. Open **New Research**, review the language, goal and optional public references, then fill the form and submit. Your draft survives navigation and reloads. **Use current creator profile** refreshes its context while keeping the topic and objective. The frontend honestly reports that the backend is unavailable.
5. Choose **View Demo Research** to load the fixed technology/student sample.
6. Explore all five ranked opportunities, score breakdowns and the evidence dialogs.
7. Use **Add to Strategy** to prioritise opportunities in the sample plan. Review or remove priorities on the Strategy page. All five sample topics remain included; priority changes their order.
8. Open **Strategy**. Review all seven days, expand sequence reasoning and optionally track completion or export the plan. Objectives follow their topics when priorities change. Completion is tied to the day and specific task, so it does not transfer to a replacement topic. Old day-number-only marks are not reused.
9. Edit and save your **Creator Profile**. Research History records the sample preview once, with the local date it was opened.

## Routes

| Route | Screen |
| --- | --- |
| `/` | Landing |
| `/login` | Sign in preview and demo mode |
| `/signup` | Validated sign up preview |
| `/onboarding` | Six-step creator profile |
| `/dashboard` | Overview |
| `/research` | Research brief and disconnected agents |
| `/results` | Opportunities, insights and evidence |
| `/strategy` | Seven-day content strategy |
| `/history` | Local sample history, search and filters |
| `/profile` | Editable local creator profile |

All workspace routes are intentionally available without authentication. Demo Mode is a local product walkthrough, **not** account authentication or access control.

## Tech and organisation

React 18, JSX, Vite, Tailwind CSS 3, React Router 6 and Lucide React. No Next.js and no backend. `jsdom` is a development-only dependency for DOM integration checks.

```text
src/
  components/   Shared UI, agent flow, opportunities, evidence and strategy cards
  context/      React state and localStorage write-through
  data/         Explicit demo dataset and deterministic score/strategy functions
  lib/          Safe local storage and URL validation
  pages/        Route screens
  services/     Disconnected API contract only
  styles.css    Reference-inspired visual system and responsive layouts
tests/          Scoring, strategy, validation, storage and UI checks
```

## Data honesty

- No live research is performed. No generation timers, fake progress or fake agent execution. Landing text animations are decorative. The chat-style research box carries a brief to the research form; it does not invent an AI reply.
- Opportunities, confidence and scoring inputs are explicitly illustrative demo data.
- The results sample is fixed. It does not represent an answer to the user's research form.
- Observed evidence is empty. No citations, source URLs, metrics, trend percentages, audience figures or competitor analytics are fabricated.
- Signup, sign-in and password reset return honest disconnected messages. Passwords never enter localStorage.
- Completion marks, profile, settings, selected opportunities and demo history use keys prefixed `ideapilot:` in browser localStorage. Storage failure falls back to session state with a notice.
- Logout ends the local demo session while preserving your local creator profile and ideas.
- No posting, scheduling, accounts, API keys or external social integrations.

## Scoring

`Audience Demand × 30% + Trend Relevance × 25% + Differentiation Potential × 20% + Competitor Gap × 15% + Evidence Quality × 10%`

Each input is out of 100. The result is rounded. The sample inputs are illustrative; evidence quality values are hypothetical and do not describe collected evidence.

## Future backend integration

`src/lib/research.js` builds a complete request with the research fields and a `creatorProfile` object containing name, language, goal and public references. Competitor references are trimmed and deduplicated. `src/services/api.js` documents endpoint contracts and raises `BackendUnavailableError`. It performs **no fetch requests**. Replace that adapter when implementing Node/Express, Firebase Authentication/Firestore, search, Adaption and Gemini services. Keep keys and AI orchestration on the server. Validate source dates, URLs and claims before rendering real evidence. Replace the static sample and local state with explicit API loading/error/result states.

For static hosting, configure all application routes to fall back to `index.html` so direct React Router links work. `public/_redirects` covers hosts that support that format. Vite's dev/preview servers provide SPA fallback locally.

## Design reference

The primary reference is [Mosaic Prompt Template on 21st.dev](https://21st.dev/@kedhareswer/templates/ai-app-builder-landing-page-template). IdeaPilot adapts its mosaic sky, animated pixel typography, typing example prompts, icy accent, translucent navigation and glass-card proportions. Reduced-motion preferences keep the headline and prompt examples still. The included reference source was available locally; interactive browser inspection was blocked by the computer-use environment. The design extends that visual language to the workspace without carrying over the reference's product or simulated execution behavior.

The scroll-driven particle globe takes visual inspiration from the [Ordin live preview](https://vault.hyperiux.com/template-demo/ordin). It is original Canvas 2D artwork with no extra animation dependency. It travels through the landing sections and docks at the four-agent map. Three incoming research connections lead into the shared core; one outgoing connection leads to StrategyArchitect. These scroll reveals are illustrative, not execution status. Reduced motion keeps the globe in the agent section, and a static SVG fallback remains available without Canvas. Fast scrolling, docking alignment and the mobile map were checked in the browser.

See `THIRD_PARTY_NOTICES.md` for attribution.

## Verification in this implementation

- Production build: passed.
- Automated checks: 28 passed, including all routes, scroll-globe docking, reduced-motion positioning, four-agent map, landing composer handoff, keyboard composition, storage-failure handoff, complete research context, persistent drafts, strategy priority changes and completion identity.
- HTTP preview: landing, dashboard, results, strategy and profile routes return 200 with the SPA entry point.
- Browser visual QA: landing, research, opportunities, evidence and strategy inspected in the local browser. Desktop and mobile checks cover the changed screens, overflow and mobile navigation; live backend behavior remains untested because no backend is implemented.
