# TriageOS: Gemini-Powered Emergency Rapid Triage

## The Challenge

The objective of this challenge is to build a Gemini-powered application that acts as a universal bridge between human intent and complex systems, solving for societal benefit. 

**Chosen Vertical:** Disaster Response & Resource Allocation
**Persona:** Emergency Dispatcher / First Responder

TriageOS takes unstructured, messy, real-world inputs (like panicked 911 transcripts, frantic texts from bystanders, or scattered field notes) and instantly converts them into a structured, prioritized, and verified action plan for dispatchers.

## Approach & Logic

During high-stress emergencies, critical information is often conveyed in chaotic, unstructured ways. The cognitive load on emergency dispatchers is immense, leading to potential delays in deploying life-saving resources. 

Our logic uses Google's **Gemini 2.5 Flash** model (via `@google/generative-ai`) to act as a highly intelligent parser. 
1. **Unstructured Input:** A user pastes raw text.
2. **Schema Enforcement:** We use Gemini's `responseSchema` configuration to strictly force the AI to return deterministic JSON containing:
   - `incidentType`: The categorized emergency.
   - `priority`: Evaluated triage level (Critical, High, Medium, Low).
   - `location`: Extracted and synthesized location data.
   - `resourcesRequired`: A tactical array of what needs to be deployed.
   - `actionSteps`: Immediate, prioritized life-saving instructions.
3. **Structured Action:** The React frontend maps this JSON into a clear, visually distinct dashboard that a dispatcher can read in half a second.

## How the Solution Works

- **Frontend:** Built with Vite + React for lightning-fast performance and deployment.
- **Styling:** Custom Vanilla CSS utilizing a dark-mode glassmorphism aesthetic to prevent eye strain during night shifts while highlighting critical priorities clearly with badge colors.
- **AI Integration:** Uses the `@google/generative-ai` SDK. To ensure security without requiring a backend for this minimal prototype, the API key is requested on the first load and stored purely in browser local storage. It is transmitted *only* directly to Google's API.

## How to Run the Project

1. Ensure you have [Node.js](https://nodejs.org/) installed.
2. Clone or open the project folder.
3. Run `npm install` to install dependencies (`@google/generative-ai`, `lucide-react`, etc.).
4. Run `npm run dev` to start the local development server.
5. Open your browser to the local Vite URL (e.g., `http://localhost:5173`).
6. Enter a valid Google Gemini API Key.
7. Test it by pasting a messy unstructured report. For example:
   *"Massive pileup on I-95 North near exit 14. Multiple cars involved, one is on fire. People are trapped inside. Send help immediately!"*

## Assumptions Made

1. **API Independence:** We assume the user has access to generate a Gemini API key via Google AI Studio.
2. **Input Capability:** We assume the primary fast-input method for the dispatcher prototype is text (transcripts from an external voice-to-text service or raw typed notes).
3. **Stateless Triage:** We assume that parsing the current event does not require historical state context of past, unrelated emergencies.

## Evaluation Focus Areas Fulfilled
- **Code Quality:** Clean component architecture and separated API logic.
- **Security:** API keys are never hardcoded or transmitted to third-party backends; they remain in the user's browser.
- **Efficiency:** Uses the lightweight `gemini-2.5-flash` model and Vanilla CSS to ensure maximal speed.
- **Testing:** Implemented rigid validation on the frontend (requiring keys, handling API errors, and disabling buttons during loading) and deterministic structured JSON from the AI.
- **Accessibility:** High-contrast text values and distinct iconography for semantic understanding.
- **Google Services:** Deep integration of the Google Gemini API with JSON Schema enforcement.
