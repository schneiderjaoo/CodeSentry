import { runAgenticPipeline } from "./agents/agentCoordinator.js";

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
    const result = await runAgenticPipeline(diffExample);
    console.log("📊 Análise completa:\n", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Erro no pipeline:", err);
  }
}

main();
