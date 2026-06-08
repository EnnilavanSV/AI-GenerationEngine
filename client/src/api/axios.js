import axios from "axios";

// Create a custom Axios instance pointing to our Node backend
const API = axios.create({
  baseURL: "https://ai-generation-engine.onrender.com/api",
});

export default API;
