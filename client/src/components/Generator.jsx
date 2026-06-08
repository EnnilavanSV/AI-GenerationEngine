import { useState } from "react";
import API from "../api/axios.js";

export default function Generator() {
  // 1. Memory (State)
  const [topic, setTopic] = useState("");
  const [format, setFormat] = useState("Video Script");
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // 2. The Trigger Function
  const handleGenerate = async (e) => {
    e.preventDefault(); // Prevent page refresh
    if (!topic) return;

    setIsLoading(true);
    setError("");
    setGeneratedText("");
    setIsSaved(false);

    try {
      // Send the request to our Express backend
      const response = await API.post("/generate", { topic, format });

      // Save the AI's response to React's memory
      setGeneratedText(response.data.generatedText);
    } catch (err) {
      console.error(err);
      setError("Failed to generate content. Is the server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToVault = () => {
    // 1. Grab the existing vault from the browser's memory (or create an empty array)
    const existingVault = JSON.parse(localStorage.getItem("ai_vault")) || [];

    // 2. Create the new prompt object
    const newPrompt = {
      id: Date.now(), // Creates a unique ID based on the exact millisecond
      topic: topic,
      format: format,
      content: generatedText,
      date: new Date().toLocaleDateString(),
    };

    // 3. Add the new prompt to the top of the vault and save it back to memory
    const updatedVault = [newPrompt, ...existingVault];
    localStorage.setItem("ai_vault", JSON.stringify(updatedVault));

    // 4. Trigger the visual "Saved!" feedback
    setIsSaved(true);

    // 5. Change the button back to normal after 3 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  // 3. The UI
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-extrabold text-gray-800">
          AI Prompt Studio
        </h1>
        <p className="text-gray-500">
          Select a format, enter a topic, and let the AI do the heavy lifting.
        </p>
      </div>

      {/* The Control Panel (Form) */}
      <form
        onSubmit={handleGenerate}
        className="bg-white p-6 rounded-xl shadow-md border border-gray-200 space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          {/* Format Dropdown */}
          <div className="flex-shrink-0 w-full md:w-1/3">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50 text-gray-800"
            >
              <option value="Anime Animation Script">
                Anime Animation Script
              </option>
              <option value="ASMR Audio Outline">ASMR Audio Outline</option>
              <option value="Midjourney Visual Prompt">
                Midjourney Visual Prompt
              </option>
              <option value="YouTube Hook & Intro">YouTube Hook & Intro</option>
            </select>
          </div>

          {/* Topic Input */}
          <div className="flex-grow w-full">
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Topic
            </label>
            <input
              type="text"
              placeholder="e.g., A cyberpunk coffee shop on Mars..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-gray-50 text-gray-800"
              required
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full font-bold py-3 px-4 rounded-lg text-white transition-all ${
            isLoading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {isLoading
            ? "✨ Generating (This takes a few seconds)..."
            : "Generate Content"}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
          <p>{error}</p>
        </div>
      )}

      {/* The Output Window */}
      {generatedText && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="bg-gray-100 border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-gray-700">Generated Output</h3>
              <span className="text-xs font-mono bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                {format}
              </span>
            </div>

            {/* The Save Button */}
            <button
              onClick={handleSaveToVault}
              disabled={isSaved}
              className={`px-4 py-2 text-sm font-bold rounded shadow transition-all ${
                isSaved
                  ? "bg-green-500 text-white cursor-default"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {isSaved ? "✓ Saved to Local Vault" : "💾 Save to Vault"}
            </button>
          </div>
          <div className="p-6 overflow-auto max-h-[500px]">
            <p className="font-mono text-sm text-gray-800 whitespace-pre-wrap">
              {generatedText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
