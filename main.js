import { parseContent } from "./agents/parserAgent.js";
import { analyzeSemantics } from "./agents/analyzerAgent.js";

async function main() {
  try {
    // Pega os commits e arquivos parseados
    const parsed = await parseContent();

    // parsed.content é a junção das mensagens de commit
    // parsed.files são arquivos JS parseados

    // Se quiser classificar commit a commit, faça:
    const commitMessages = parsed.content.split('\n');

    for (const message of commitMessages) {
      const classification = await analyzeSemantics({ content: message });
      console.log(`Commit: "${message}" => Classificação: ${classification.classification}`);
    }
  } catch (err) {
    console.error("Erro no processamento:", err);
  }
}

main();
