
import { GoogleGenAI, Type } from "@google/genai";
import { Idea } from '../types';

let aiPromise: Promise<GoogleGenAI>;

const initializeAi = async (): Promise<GoogleGenAI> => {
    // Check if the electronAPI is exposed on the window object
    if (!window.electronAPI) {
        // Fallback for web or if preload script fails
        if (process.env.API_KEY) {
            console.warn("Electron API not found, falling back to process.env.API_KEY. This is expected in a web-only environment.");
            return new GoogleGenAI({ apiKey: process.env.API_KEY });
        }
        throw new Error("Electron API not found and API_KEY environment variable is not set.");
    }

    try {
        const apiKey = await window.electronAPI.getApiKey();
        if (!apiKey) {
            throw new Error("API_KEY could not be retrieved from the Electron main process. Ensure it is set in the environment where you run the app.");
        }
        return new GoogleGenAI({ apiKey });
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI:", error);
        throw error;
    }
};

aiPromise = initializeAi();


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        ideas: {
            type: Type.ARRAY,
            description: "A list of 5 creative ideas.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "A short, catchy title for the idea."
                    },
                    description: {
                        type: Type.STRING,
                        description: "A one-sentence description of the idea."
                    }
                },
                required: ['title', 'description']
            }
        }
    },
    required: ['ideas']
};


export const generateIdeas = async (topic: string): Promise<Idea[]> => {
    try {
        const ai = await aiPromise;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 5 creative, unique, and actionable ideas about "${topic}".`,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.8,
                topP: 0.9,
            }
        });

        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);
        
        if (parsedResponse && Array.isArray(parsedResponse.ideas)) {
            return parsedResponse.ideas;
        } else {
            throw new Error("Invalid response format from Gemini API.");
        }

    } catch (error) {
        console.error("Error generating ideas:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate ideas: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating ideas.");
    }
};

// FIX: Add and export suggestPrompt function.
export const suggestPrompt = async (base64: string, mimeType: string, context: string): Promise<string> => {
    try {
        const ai = await aiPromise;
        const imagePart = { inlineData: { mimeType, data: base64 } };
        const textPart = { text: `Based on this image, suggest a creative prompt for an AI image generator. Context: ${context}` };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const suggestedPrompt = response.text;
        if (suggestedPrompt) {
            return suggestedPrompt.trim();
        } else {
            throw new Error("No suggestion received from the API.");
        }
    } catch (error) {
        console.error("Error suggesting prompt:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to suggest prompt: ${error.message}`);
        }
        throw new Error("An unknown error occurred while suggesting a prompt.");
    }
};

// FIX: Add and export analyzeImageStyle function.
export const analyzeImageStyle = async (base64: string, mimeType: string): Promise<string> => {
    try {
        const ai = await aiPromise;
        const imagePart = { inlineData: { mimeType, data: base64 } };
        const textPart = { text: "Analyze the artistic style of this image. Describe it in a concise phrase suitable for a prompt, for example: 'cinematic, high-contrast, dramatic lighting' or 'soft, pastel, watercolor style'." };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const style = response.text;
        if (style) {
            return style.trim();
        } else {
            throw new Error("No style analysis received from the API.");
        }
    } catch (error) {
        console.error("Error analyzing image style:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to analyze style: ${error.message}`);
        }
        throw new Error("An unknown error occurred while analyzing image style.");
    }
};

export const annotateImage = async (base64: string, mimeType: string): Promise<string> => {
    try {
        const ai = await aiPromise;
        const imagePart = { inlineData: { mimeType, data: base64 } };
        const textPart = { text: "Provide a concise, artistic description of this image in Vietnamese." };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const annotation = response.text;
        if (annotation) {
            return annotation.trim();
        } else {
            throw new Error("No annotation received from the API.");
        }
    } catch (error) {
        console.error("Error annotating image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to annotate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while annotating image.");
    }
};

export const generateVideo = async (prompt: string, image: {base64: string, mimeType: string} | null): Promise<any> => {
    try {
        const ai = await aiPromise;
        
        const videoParams: any = {
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
            }
        };

        if (image) {
            videoParams.image = {
                imageBytes: image.base64,
                mimeType: image.mimeType,
            };
        }

        let operation = await ai.models.generateVideos(videoParams);
        return operation;
    } catch (error) {
        console.error("Error generating video:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to start video generation: ${error.message}`);
        }
        throw new Error("An unknown error occurred while starting video generation.");
    }
};

export const getVideosOperation = async (operation: any): Promise<any> => {
    try {
        const ai = await aiPromise;
        return await ai.operations.getVideosOperation({ operation });
    } catch (error) {
        console.error("Error polling video operation:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to get video operation status: ${error.message}`);
        }
        throw new Error("An unknown error occurred while polling video operation.");
    }
}