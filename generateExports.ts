import * as exportGenerator from "export-generator";

exportGenerator.generateExport({
  sourceGlobs: [`${__dirname}/src/**/*.?(tsx|ts)`],
  outputDirectory: `${__dirname}/src`,
  outputFileName: "index.ts",
});
