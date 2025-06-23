export type ParsedInput = {
  content: string;
  tipo?: "commit" | "pull_request" | "issue";
};

export type AnalysisResult = {
  classification: string;
  raw: string;
};
