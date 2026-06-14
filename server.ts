import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import * as dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Proxy route for Google Directions API to avoid CORS issues
  app.get("/api/directions", async (req, res) => {
    try {
      const { origin, destination, mode } = req.query;
      const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.error("Directions Proxy: Google Maps API key not found in environment");
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&key=${apiKey}`;
      
      console.log(`Directions Proxy: Requesting route from ${origin} to ${destination} (${mode})`);
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch directions" });
    }
  });

  // Proxy route for Google Distance Matrix API
  app.get("/api/distance-matrix", async (req, res) => {
    try {
      const { origins, destinations, mode = "driving" } = req.query;
      const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Google Maps API key not configured" });
      }

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=${mode}&key=${apiKey}`;
      
      console.log(`Distance Matrix Proxy: Requesting matrix for origins: ${origins}`);
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Distance Matrix Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch distance matrix" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
