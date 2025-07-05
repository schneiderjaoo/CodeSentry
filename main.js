import { runAgenticPipeline, initializeRAG } from "./agents/agentCoordinator.js";

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

async function main() {
  try {
    // Inicializa RAG (não bloqueia se falhar)
    await initializeRAG();
    
    const result = await runAgenticPipeline(diffExample);
    
    console.log("\n=== Enhanced Analysis Results ===");
    console.log("Semantic Analysis:", result.semanticResult);
    console.log("Patterns:", result.patterns);
    console.log("Context:", result.context);
    console.log("Stats:", result.stats);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
