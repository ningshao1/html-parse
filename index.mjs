import { fileDisplay } from "./file-display.mjs";
import {
  HtmlChineseToTanslate,
  ChineseToTanslateLog,
} from "./html-chinese-to-tanslate.mjs";
import { tsChineseToTanslate } from "./ts-chinese-to-tanslate.mjs";
import path from "path";
const dirPath = path.resolve(
  "../../work/assccrs_frontend/src/app/implementation"
);
fileDisplay(dirPath, [".ts"], ({ relativePath }) => {
  new tsChineseToTanslate({
    path.resolve(relativePath)
  });
  // new HtmlChineseToTanslate({
  //   filePath: path.resolve(relativePath),
  // });
  // new ChineseToTanslateLog().totalLog();
});
