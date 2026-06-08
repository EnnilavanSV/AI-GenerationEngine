import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// THIS IS THE LINE JAVASCRIPT WAS LOOKING FOR:
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const generateContent = async (req, res) => {
  try {
    const { topic, format } = req.body;

    if (!topic || !format) {
      return res
        .status(400)
        .json({ message: "Topic and format are required." });
    }

    const masterPrompt = `Act as an expert creative director. Write a highly detailed ${format} about the following topic: "${topic}". 
        Please format the output cleanly using Markdown, with clear headings, bullet points where necessary, and highly readable spacing.`;

    // Line 25: Now JavaScript knows exactly what "ai" is when it gets here!
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: masterPrompt,
    });

    res.status(200).json({ generatedText: response.text });
  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ message: "The AI engine encountered an error." });
  }
};
