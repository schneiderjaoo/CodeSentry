const { parseContent } = require("./parserAgent");
const { retrieveContext } = require("./retrieverAgent");
const { analyzeSemantics } = require("./analyzerAgent");
const { detectPatterns } = require("./patternDetectorAgent");

async function runTriagemPipeline(inputTexto) {
  const parsed = await parseContent(inputTexto);

  // (opcional)
  const contextoExtra = await retrieveContext(parsed);

  const patternAnalysis = await detectPatterns(parsed);

  const resultado = await analyzeSemantics({
    ...parsed,
    contexto: contextoExtra,
    padroes: patternAnalysis
  });

  return {
    resultado,
    padroes: patternAnalysis
  };
}

module.exports = { runTriagemPipeline };
