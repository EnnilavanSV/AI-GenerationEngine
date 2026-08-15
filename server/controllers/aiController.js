import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

let ai;
const getClient = () => {
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
};

const describeError = (error) => {
  const raw = error?.message || String(error);
  const status = error?.status ?? error?.code;

  if (/API key not valid|API_KEY_INVALID|invalid api key/i.test(raw)) {
    return {
      status: 401,
      message:
        "Gemini rejected the API key. Check GEMINI_API_KEY in server/.env - keys are issued at https://aistudio.google.com/app/apikey",
    };
  }

  if (/not found|404|is not supported|unsupported model/i.test(raw)) {
    return {
      status: 502,
      message:
        `The model "${MODEL}" was not found or is unavailable for this key. ` +
        `Set GEMINI_MODEL in server/.env to a model your key can access (e.g. gemini-2.0-flash).`,
    };
  }

  if (/quota|RESOURCE_EXHAUSTED|429|rate limit/i.test(raw)) {
    return {
      status: 429,
      message:
        "Gemini quota or rate limit reached. Wait a minute and try again, or check usage in Google AI Studio.",
    };
  }

  if (/safety|blocked|SAFETY/i.test(raw)) {
    return {
      status: 422,
      message:
        "Gemini blocked this request under its safety filters. Try rephrasing the topic.",
    };
  }

  if (/permission|PERMISSION_DENIED|403/i.test(raw)) {
    return {
      status: 403,
      message:
        "Gemini denied permission for this key. The Generative Language API may not be enabled, or the key may be restricted to other APIs or referrers.",
    };
  }

  return {
    status: status && status >= 400 && status < 600 ? status : 500,
    message: `Gemini request failed: ${raw}`,
  };
};

export const generateContent = async (req, res) => {
  const { topic, format } = req.body ?? {};

  if (!topic || !format) {
    return res.status(400).json({ message: "Topic and format are required." });
  }

  const masterPrompt = `Act as an expert creative director. Write a highly detailed ${format} about the following topic: "${topic}".
        Please format the output cleanly using Markdown, with clear headings, bullet points where necessary, and highly readable spacing.`;

  try {
    const response = await getClient().models.generateContent({
      model: MODEL,
      contents: masterPrompt,
    });

    // `.text` is a convenience getter on the SDK response. If a generation is
    // blocked or returns no candidates it can be undefined, which would send
    // back `{ generatedText: undefined }` and render as an empty box - a
    // failure that silently looks like success.
    const generatedText = response?.text;

    if (!generatedText) {
      console.error(
        "Gemini returned no text. Full response:",
        JSON.stringify(response, null, 2),
      );
      return res.status(502).json({
        message:
          "Gemini returned an empty response. This usually means the prompt was blocked by a safety filter - try a different topic.",
      });
    }

    return res.status(200).json({ generatedText, model: MODEL });
  } catch (error) {
    // Log everything useful server-side. The console is where the real cause
    // lives; the client only ever gets the summary below.
    console.error("--- AI Generation Error ---");
    console.error("model:  ", MODEL);
    console.error("message:", error?.message);
    console.error("status: ", error?.status ?? error?.code);
    if (error?.response) console.error("response:", error.response);
    console.error(error);
    console.error("---------------------------");

    const { status, message } = describeError(error);
    return res.status(status).json({ message });
  }
};
