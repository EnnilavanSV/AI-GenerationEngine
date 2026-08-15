import axios from "axios";

// The base URL was previously hardcoded to the deployed Render host, which
// meant `npm run dev` still sent every request to the remote server. When that
// server is asleep (free tier) or down, the platform's proxy answers with a
// 503 carrying no CORS headers — and the browser reports that as "blocked by
// CORS policy", which sends you hunting for a CORS bug that doesn't exist.
//
// Reading from the environment lets local development talk to a local server
// and production talk to the deployed one, with no source edits either way.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: `${baseURL}/api`,

  // Gemini generations routinely take 10-30 seconds, and a cold-starting free
  // instance adds up to another ~50. Axios defaults to no timeout, so a hung
  // request would spin forever with no feedback; 90s is long enough for a cold
  // start plus a long generation, short enough to eventually surface an error.
  timeout: 90000,
});

// Turn transport-level failures into messages that name the actual problem,
// rather than letting them surface as a generic network error.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      error.friendlyMessage =
        "The request timed out. If the server was asleep, try once more — it should be awake now.";
    } else if (!error.response) {
      error.friendlyMessage =
        `Could not reach the API at ${baseURL}. Check the server is running, ` +
        `or that VITE_API_URL points at the right host.`;
    }
    return Promise.reject(error);
  },
);

export default API;
