import { fileDisplay } from "./file-display.mjs";
import {
  HtmlChineseToTanslate,
  ChineseToTanslateLog,
} from "./html-chinese-to-tanslate.mjs";
import {
  tsChineseToTanslate,
  TSChineseToTanslateLog,
} from "./ts-chinese-to-tanslate.mjs";
import path from "path";
const dirPath = path.resolve(
  "../../work/asscbsp_frontend/src/app/implementation"
);
fileDisplay(dirPath, [".ts", ".html"], ({ relativePath, type }) => {
  if(relativePath.includes("shared/base-feature")){
    return
  }
  if (type === "ts") {
    new tsChineseToTanslate({
      filePath: path.resolve(relativePath),
      type:"bsp"
    });
  }
  if (type === "html") {
    new HtmlChineseToTanslate({
      filePath: path.resolve(relativePath),
    });
  }

  console.log(
    "当前修改数量：",
    new ChineseToTanslateLog().getTotal() +
      new TSChineseToTanslateLog().getTotal()
  );
  new ChineseToTanslateLog().totalLog()
});
