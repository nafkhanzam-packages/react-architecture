import * as exportGenerator from "export-generator";

exportGenerator.generateExport({
  sourceGlobs: [`${__dirname}/src/**/*.ts`],
  outputDirectory: `${__dirname}/src`,
  outputFileName: "index.ts",
});
