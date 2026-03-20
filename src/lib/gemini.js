import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

/**
 * Parses unstructured emergency inputs into structured, actionable JSON data.
 * @param {string} apiKey - The user's Google Gemini API Key
 * @param {string} textInput - The messy, unstructured field report
 * @param {Array} images - Array of base64 image strings from the user
 * @returns {Promise<Object>} The structured JSON response
 */
export const parseEmergencyInput = async (apiKey, textInput, images = []) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We use gemini-2.5-flash for fast, accurate structuring AND profound vision capabilities
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Define the exact schema we want Gemini to adhere to
    const schema = {
        type: SchemaType.OBJECT,
        properties: {
            incidentType: {
                type: SchemaType.STRING,
                description: "Type of incident (e.g., Medical Emergency, Fire, Multi-Vehicle Accident)"
            },
            priority: {
                type: SchemaType.STRING,
                description: "Triage priority strictly one of: Critical, High, Medium, Low"
            },
            location: {
                type: SchemaType.STRING,
                description: "Extracted location of the incident from the input, or 'Unknown' if not provided"
            },
            mapsSearchQuery: {
                type: SchemaType.STRING,
                description: "A highly specific search query string optimized for Google Maps to pinpoint the exact location (e.g., '123 Main St, Springfield' or 'I-95 North exit 14'). Return an empty string if location is completely unknown."
            },
            resourcesRequired: {
                type: SchemaType.ARRAY,
                description: "List of tactical resources to deploy (e.g., '1 Advanced Life Support Ambulance', '2 Fire Engines', 'Police Unit')",
                items: { type: SchemaType.STRING }
            },
            actionSteps: {
                type: SchemaType.ARRAY,
                description: "Step-by-step actionable and life-saving recommendations based on the scenario AND visual evidence",
                items: { type: SchemaType.STRING }
            }
        },
        required: ["incidentType", "priority", "location", "mapsSearchQuery", "resourcesRequired", "actionSteps"]
    };

    const promptText = `
You are an expert emergency dispatch assistant. Analyze the following unstructured inputs (text transcripts, notes, and possibly photos of the scene or medical records) precisely according to the provided schema. The goal is to quickly triage the situation to deploy life-saving resources immediately.

Make sure to synthesize BOTH the visual data (if any photos are provided) and the text transcript to make your priority and resource decisions.

Text Input:
"${textInput}"
    `;

    // Construct the parts array for the multi-modal request
    const parts = [{ text: promptText }];
    
    // Add images if provided
    images.forEach(base64Image => {
        // Strip the data:image/...;base64, prefix to get raw base64 data and mime type
        const match = base64Image.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/);
        if (match && match.length === 3) {
            parts.push({
                inlineData: {
                    mimeType: match[1],
                    data: match[2]
                }
            });
        }
    });

    const result = await model.generateContent({
        contents: [
            {
                role: 'user',
                parts: parts
            }
        ],
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.1 // Low temperature for factual, deterministic extraction
        }
    });

    return JSON.parse(result.response.text());
};
