const staticOrigins = [
  // Vite dev servers
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",

  // Vite preview
  "http://localhost:4173",
];

// Any Vercel deployment gets its own subdomain, including per-branch previews,
// so they can't be listed individually.
const vercelPattern = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

// Set CLIENT_URL in the environment to allow the production frontend without
// editing this file.
const allowedOrigins = process.env.CLIENT_URL
  ? [...staticOrigins, process.env.CLIENT_URL]
  : staticOrigins;

const isAllowed = (origin) =>
  allowedOrigins.includes(origin) || vercelPattern.test(origin);

const corsOptions = {
  origin(origin, callback) {
    // No Origin header: curl, Postman, server-to-server calls, and the hosting
    // platform's health checks. Not browser requests, so the same-origin policy
    // CORS protects doesn't apply. Rejecting these breaks uptime monitoring.
    if (!origin) return callback(null, true);

    if (isAllowed(origin)) return callback(null, true);

    // Deny by returning false rather than an Error. An Error propagates to
    // Express and surfaces as a 500, which looks like a server crash in the
    // logs. Returning false just omits the CORS headers, which is precisely
    // what makes the browser block the response.
    console.warn(`Blocked by CORS: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  // 204 keeps older browsers happy on preflight responses.
  optionsSuccessStatus: 204,
};

export { allowedOrigins, corsOptions };
