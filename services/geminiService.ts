import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from '../constants';

const apiKey = process.env.API_KEY;

let aiClient: GoogleGenAI | null = null;
let chatSession: Chat | null = null;

const getClient = (): GoogleGenAI => {
  if (!aiClient) {
    if (!apiKey) {
      console.error("API_KEY is missing in environment variables.");
      throw new Error("API Key missing");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
};

export const initializeChat = async (): Promise<Chat> => {
  const client = getClient();
  chatSession = client.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
    },
  });
  return chatSession;
};

export const sendMessageStream = async function* (message: string) {
  if (!chatSession) {
    await initializeChat();
  }
  
  if (!chatSession) {
      throw new Error("Failed to initialize chat session");
  }

  try {
    const resultStream = await chatSession.sendMessageStream({ message });
    
    for await (const chunk of resultStream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) {
        yield c.text;
      }
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    yield "I apologize, but I am having trouble connecting to the Ourika Valley network right now. Please try again in a moment.";
  }
};
