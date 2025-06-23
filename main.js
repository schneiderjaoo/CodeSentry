import { getGitLog } from "./agents/parserAgent.js";
import { analyzeSemantics } from "./agents/analyzerAgent.js";

async function main() {
  try {
    const gitLogData = await getGitLog();

    console.log("=== Git Log capturado ===");
    console.log(gitLogData);

    const parsed = { content: gitLogData };

    const resultado = await analyzeSemantics(parsed);

    console.log("Classificação semântica:", resultado.classification);
  } catch (err) {
    console.error("Erro no processamento:", err);
  }
}

main();
