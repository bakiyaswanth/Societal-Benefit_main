# TriageOS: Gemini-Powered Emergency Rapid Triage

## The Challenge

Build a Gemini-powered application that acts as a universal bridge between human intent and complex systems, solving for societal benefit.

**Chosen Vertical:** Disaster Response & Resource Allocation  
**Persona:** Emergency Dispatcher / First Responder

TriageOS takes unstructured, messy, real-world inputs—panicked 911 transcripts, photos of incidents, voice dictation, scattered field notes—and instantly converts them into a structured, prioritized, and verified action plan for dispatchers.

## Approach & Logic

During high-stress emergencies, critical information is often conveyed in chaotic, unstructured ways. TriageOS uses Google's **Gemini 2.5 Flash** model to act as a highly intelligent parser with vision capabilities.

1. **Multi-Modal Unstructured Input:** Users can provide data via text, live voice dictation (Web Speech API), or photo uploads (Base64 vision processing).
2. **Schema Enforcement:** Gemini's `responseSchema` strictly forces deterministic JSON containing: `incidentType`, `priority` (Critical/High/Medium/Low), `location`, `mapsSearchQuery`, `resourcesRequired`, and `actionSteps`.
3. **Visual Mapping:** The extracted `mapsSearchQuery` powers a live **Google Maps** embed showing the exact disaster location.
4. **Analytics Tracking:** **Firebase Analytics** tracks dispatcher usage patterns (analysis starts, completions, voice usage, image uploads) for operational insights.
5. **Input Sanitization:** All user text is sanitized via **DOMPurify** before API transmission to prevent XSS injection.

## Google Services Used

| Service | Purpose |
|---|---|
| **Google Gemini API** | Multi-modal AI parsing (text + vision) with structured JSON schema output |
| **Google Maps Embed** | Live geographic visualization of extracted incident locations |
| **Firebase Analytics** | Event tracking for triage actions (analysis started/completed, voice/image usage) |
| **Google Fonts (Inter)** | Typography loaded via `fonts.googleapis.com` with preconnect optimization |
| **Google Cloud Run** | Containerized production deployment via Dockerfile |

## Architecture

```
src/
├── main.jsx                    # Root with ErrorBoundary wrapper
├── App.jsx                     # Main component with React.memo sub-components
├── index.css                   # Design system with a11y (skip-link, sr-only, focus-visible, reduced-motion)
├── components/
│   └── ErrorBoundary.jsx       # Production crash safety fallback UI
└── lib/
    ├── gemini.js               # Gemini API with multi-modal inlineData + schema enforcement
    ├── firebase.js             # Firebase Analytics with graceful env-based config
    └── security.js             # DOMPurify sanitization + API key format validation
```

## How to Run

```bash
npm install
npm run dev          # Start dev server at http://localhost:5173
npm test             # Run 19 integration + security tests
npm run build        # Production build
```

## Security Implementation

- **Content Security Policy (CSP):** Strict meta-tag limiting `script-src`, `frame-src` (Google only), `connect-src` (Gemini + Analytics)
- **DOMPurify Sanitization:** All user text stripped of HTML/script tags before API transmission
- **API Key Validation:** Client-side format validation (length, character set) before storage
- **API Key Storage:** Browser `localStorage` only, never hardcoded, `type="password"` input with `autoComplete="off"`
- **ErrorBoundary:** Production crash safety preventing full UI collapse

## Accessibility (WCAG 2.1)

- **Skip-to-content** link for keyboard navigation
- **ARIA attributes:** `aria-label`, `aria-hidden`, `aria-live="polite"`, `aria-pressed`, `aria-required`, `aria-describedby`, `role="alert"`, `role="region"`, `role="toolbar"`, `role="status"`
- **Focus-visible** outlines (`:focus-visible`) for keyboard users
- **Screen-reader-only** labels (`.sr-only` class with proper clip-rect technique)
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` disables all animations
- **Semantic HTML:** `<main>`, `<header>`, `<section>`, `<form>`, proper `<label>` linkages
- **Meta description** for SEO

## Efficiency Optimizations

- **React.memo:** `PriorityBadge`, `ResourceList`, `ActionStepsList` sub-components prevent unnecessary re-renders
- **useMemo:** Google Maps embed URL memoized to prevent iframe re-mount
- **useCallback:** All event handlers memoized with correct dependency arrays
- **Debounced input:** Text input uses debounce timer to reduce state churn
- **Lazy loading:** Maps iframe uses `loading="lazy"` and fonts use `display=swap`
- **Preconnect:** Google Fonts domains preconnected in HTML `<head>`

## Testing Coverage (19 Tests)

| Test | Category |
|---|---|
| Initial config screen render | Security |
| API key save + dashboard transition | Security |
| API key rejection (too short) | Security / Edge |
| Auto-load saved key from localStorage | Efficiency |
| Empty input validation with error alert | Edge Cases |
| Full Gemini parse + dashboard + Maps iframe | Core Integration |
| API rejection error handling | Error Handling |
| Reset Key clears state | Reset Flow |
| Skip-to-content link presence | Accessibility |
| ARIA live region attributes | Accessibility |
| Icon button aria-labels | Accessibility |
| Mic button aria-pressed attribute | Accessibility |
| Input toolbar ARIA role | Accessibility |
| sanitizeInput strips XSS tags | Security Unit |
| sanitizeInput handles null/undefined | Security Unit |
| validateApiKey rejects empty | Security Unit |
| validateApiKey rejects short keys | Security Unit |
| validateApiKey accepts valid format | Security Unit |
| validateApiKey rejects special chars | Security Unit |

## Assumptions Made

1. Users have access to generate a Gemini API key via Google AI Studio.
2. Primary fast-input method is text/voice (transcripts from external voice-to-text or raw typed notes).
3. Firebase config uses environment variables (`VITE_FIREBASE_*`); falls back gracefully to demo values.
