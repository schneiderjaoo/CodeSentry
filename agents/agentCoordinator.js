const { parseContent } = require("./parserAgent");
const { retrieveContext } = require("./retrieverAgent");
const { analyzeSemantics } = require("./analyzerAgent");

async function runTriagemPipeline(inputTexto) {
  const parsed = await parseContent(inputTexto);

  // (opcional)
  const contextoExtra = await retrieveContext(parsed);

  const resultado = await analyzeSemantics({
    ...parsed,
    contexto: contextoExtra
  });

  return resultado;
}

module.exports = { runTriagemPipeline };
