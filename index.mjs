import { fileDisplay } from "./file-display.mjs";
import { HtmlChineseToTanslate } from "./html-chinese-to-tanslate.mjs";
import path from "path";
const moduleURL = import.meta.url;
const dirPath = path.resolve(
  "../../work/assccrs_frontend/src/app/implementation"
);
fileDisplay(dirPath, [".html"], ({ relativePath }) => {
  new HtmlChineseToTanslate({
    filePath: path.resolve( relativePath),
  });
});
