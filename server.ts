import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { analyzeApiDefinition } from './server/geminiService';
import { parseCurlCommand } from './src/utils/curlParser';
import { ApiDefinition } from './src/types';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'API Reliability Assistant',
      timestamp: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  // Parse cURL helper endpoint
  app.post('/api/parse-curl', (req, res) => {
    try {
      const { curl } = req.body;
      if (!curl || typeof curl !== 'string') {
        res.status(400).json({ error: 'Valid curl string is required' });
        return;
      }
      const parsed = parseCurlCommand(curl);
      res.json({ success: true, data: parsed });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse cURL command';
      res.status(400).json({ error: message });
    }
  });

  // Main API Analysis endpoint
  app.post('/api/analyze', async (req, res) => {
    try {
      const rawDef = req.body as Partial<ApiDefinition>;

      if (!rawDef || !rawDef.endpoint || !String(rawDef.endpoint).trim()) {
        res.status(400).json({ error: 'Endpoint URL is required for analysis.' });
        return;
      }

      if (!rawDef.method) {
        res.status(400).json({ error: 'HTTP Method is required.' });
        return;
      }

      const rawAuth = rawDef.auth;
      const authType = rawAuth?.type || 'none';

      const apiDef: ApiDefinition = {
        method: rawDef.method,
        endpoint: String(rawDef.endpoint).trim(),
        pathParams: Array.isArray(rawDef.pathParams) ? rawDef.pathParams : [],
        queryParams: Array.isArray(rawDef.queryParams) ? rawDef.queryParams : [],
        headers: Array.isArray(rawDef.headers) ? rawDef.headers : [],
        auth: {
          type: authType,
          headerName: rawAuth?.headerName,
          tokenPlaceholder: rawAuth?.tokenPlaceholder,
          apiKeyValue: rawAuth?.apiKeyValue,
          username: rawAuth?.username,
          password: rawAuth?.password,
        },
        requestBody: typeof rawDef.requestBody === 'string' ? rawDef.requestBody : '',
        expectedBehaviour: typeof rawDef.expectedBehaviour === 'string' ? rawDef.expectedBehaviour : '',
        description: typeof rawDef.description === 'string' ? rawDef.description : '',
        validationRules: Array.isArray(rawDef.validationRules) ? rawDef.validationRules : [],
      };

      // Check for valid JSON body if provided
      if (apiDef.requestBody && apiDef.requestBody.trim()) {
        try {
          JSON.parse(apiDef.requestBody);
        } catch {
          res.status(400).json({
            error: 'Request body contains invalid JSON syntax. Please correct it before analyzing.',
          });
          return;
        }
      }

      const analysis = await analyzeApiDefinition(apiDef);
      res.json({ success: true, data: analysis });
    } catch (err: unknown) {
      console.error('Error during API analysis:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred during API analysis.';
      res.status(500).json({ error: message });
    }
  });

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API Reliability Assistant running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
