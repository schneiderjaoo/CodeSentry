import { runAgenticPipeline, initializeRAG } from "./agents/agentCoordinator.js";
import http from 'http';

const diffExample = `
diff --git a/index.js b/index.js
index e69de29..f3c2a1b 100644
--- a/index.js
+++ b/index.js
@@ -0,0 +1,5 @@
+function greet(name) {
+  console.log("Hello, " + name) 
+}
+
+greet("Hello, world!");

`;

// Inicializar RAG uma vez
let ragInitialized = false;

async function initializeOnce() {
  if (!ragInitialized) {
    await initializeRAG();
    ragInitialized = true;
  }
}

async function analyzeCode(gitDiff) {
  await initializeOnce();
  return await runAgenticPipeline(gitDiff);
}

// Criar servidor HTTP
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  if (req.method === 'POST' && req.url === '/analyze') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { gitDiff } = JSON.parse(body);
        
        if (!gitDiff) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'gitDiff is required' }));
          return;
        }

        const result = await analyzeCode(gitDiff);
        
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          result,
          timestamp: new Date().toISOString()
        }));
        
      } catch (error) {
        console.error('Analysis error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ 
          error: error.message,
          timestamp: new Date().toISOString()
        }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/demo') {
    try {
      const result = await analyzeCode(diffExample);
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        result,
        demo: true,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Demo error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }));
    }
    return;
  }

  // 404 para outras rotas
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 CodeSentry server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Demo endpoint: http://localhost:${PORT}/demo`);
  console.log(`Analysis endpoint: POST http://localhost:${PORT}/analyze`);
  
  // Inicializar RAG em background
  try {
    await initializeOnce();
    console.log('✅ RAG initialized successfully');
  } catch (error) {
    console.error('❌ RAG initialization failed:', error.message);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
