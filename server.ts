import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Direct video download endpoint
  app.get("/download-video", (req, res) => {
    const videoPath = path.join(process.cwd(), "public", "BaseMetrics_App_Walkthrough.mp4");
    res.download(videoPath, "BaseMetrics_App_Walkthrough.mp4");
  });

  // Direct storage & scaling specification PDF download endpoint
  app.get("/download-storage-pdf", (req, res) => {
    const pdfPath = path.join(process.cwd(), "public", "Base_Metrics_Storage_Architecture_And_Scaling_Specification.pdf");
    res.download(pdfPath, "Base_Metrics_Storage_Architecture_And_Scaling_Specification.pdf");
  });

  // Direct logo download endpoint
  app.get("/download-logo", (req, res) => {
    const logoPath = path.join(process.cwd(), "public", "logo.jpeg");
    res.download(logoPath, "logo.jpeg");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
