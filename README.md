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

## Google Services Used

| Service | Purpose |
|---|---|
| **Google Gemini API** | Multi-modal AI parsing (text + vision) with structured JSON output |
| **Google Maps Embed** | Live geographic visualization of extracted incident locations |
| **Firebase Analytics** | Event tracking for triage actions (analysis started/completed, voice/image usage) |
| **Google Cloud Run** | Containerized production deployment via Dockerfile |

## How to Run the Project

1. Ensure [Node.js](https://nodejs.org/) is installed.
2. Clone the repository.
3. Run `npm install` to install dependencies.
4. Run `npm run dev` to start the local development server.
5. Open `http://localhost:5173`.
6. Enter a valid Google Gemini API Key.
7. Test with: *"Massive pileup on I-95 North near exit 14. Multiple cars involved, one is on fire."*

### Running Tests
```bash
npm test
```
Runs 11 integration tests covering security, edge cases, core API logic, reset flows, accessibility, and Google Maps rendering.

## Security Implementation

- **Content Security Policy (CSP):** Strict meta-tag limiting script sources, frame sources (Google only), and API connections.
- **API Key Handling:** Keys stored in browser `localStorage` only, transmitted exclusively to Google's API. Never hardcoded or exposed.
- **Input Validation:** Empty input guards, graceful API error handling with user-facing alerts.

## Accessibility

- **Skip-to-content** link for keyboard navigation
- **ARIA labels** on all icon buttons (`aria-label`), decorative icons (`aria-hidden`), live regions (`aria-live="polite"`)
- **Focus-visible** outlines for keyboard users
- **Screen-reader-only** labels (`.sr-only` class) for hidden form labels
- **Semantic HTML:** `<main>`, `<header>`, `<section>` with `role="region"`, error `role="alert"`
- **Meta description** for SEO

## Testing Coverage

| Test | Category |
|---|---|
| Initial config screen render | Security |
| API key save + dashboard transition | Security |
| Auto-load saved key from localStorage | Efficiency |
| Empty input validation with error alert | Edge Cases |
| Full Gemini parse + dashboard + Maps iframe | Core Integration |
| API rejection error handling | Error Handling |
| Reset Key clears state | Reset Flow |
| Skip-to-content link presence | Accessibility |
| ARIA live region attributes | Accessibility |
| Icon button aria-labels | Accessibility |
| Voice dictation button state | Voice Input |

## Assumptions Made

1. Users have access to generate a Gemini API key via Google AI Studio.
2. Primary fast-input method is text/voice (transcripts from external voice-to-text or raw typed notes).
3. Firebase config uses environment variables (`VITE_FIREBASE_*`); falls back gracefully to demo values.
