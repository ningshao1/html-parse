import { parse } from "angular-html-parser";
import { readFileSync, writeFileSync } from "fs";
const originalHtml = readFileSync("./entry.html", "utf-8");
let currentHtmlString = originalHtml;
let modifyIndex = 0; // 修改的次数
let modifyStatistics = {
  dynamic: {},
};
const { rootNodes } = parse(originalHtml, {
  canSelfClose: true,
  allowHtmComponentClosingTags: true,
  isTagNameCaseSensitive: true,
});
traverseAst(rootNodes);

writeFileSync("./output.html", currentHtmlString);

function traverseAst(nodes) {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.children && node.children.length > 0) {
      traverseAst(node.children);
    }
    if (node.type === "text") {
      textTranslate(node);
    }
    if (node.type === "element") {
      attributeTranslate(node.attrs);
    }
  }
}

// 文字转换
function textTranslate(node) {
  const value = node.value;
  const chineseRegex = /[\u4e00-\u9fa5]/;
  // 不包含中文的不执行
  if (!chineseRegex.test(value)) {
    return;
  }
  // {{}} {{}}  这个模式暂不处理
  if (value.split("{").length > 3) {
    return;
  }

  // 有表达式不处理
  if (/\{\{[^{}]*([\|\&]{2}|\?|\:)[^{}]*\}\}/g.test(value)) {
    return;
  }
  if (/\{\{.*\}\}/.test(value.trim())) {
    // 代表是插值表达式
    const match = value.match(/\{\{(.*?)\}\}/);
    let newValue = match ? match[1] : "";
    // 代表没有 translate 过
    if (newValue.includes("translate")) {
      return;
    }
    const key = generateIncrementalKey();
    const formatterValue = `{{"dynamic.${key}" | translate}}`;
    modifyHtmlString(node, formatterValue);
  } else {
    const key = generateIncrementalKey();
    const formatterValue = `{{"dynamic.${key}" | translate}}`;
    modifyStatistics.dynamic[key] = value;
    modifyHtmlString(node, formatterValue);
  }
}

// 修改html字符串
function modifyHtmlString(node, value) {
  const startOffset = node.sourceSpan.start.offset;
  const endOffset = node.sourceSpan.end.offset;
  let newStr =
    currentHtmlString.slice(0, startOffset) +
    value +
    currentHtmlString.slice(endOffset);
  currentHtmlString = newStr;
}

// 属性转换
function attributeTranslate() {}

// 获取动态key
function generateIncrementalKey() {
  return `dynamic_key_${modifyIndex++}`;
}

function nodeToString(node) {
  switch (node.type) {
    case "element":
      return elementToString(node);
    case "text":
      return textToString(node);
    case "cdata":
      return cdataToString(node);
    case "attribute":
      return attributeToString(node);
    case "docType":
      return docTypeToString(node);
    case "comment":
      return commentToString(node);
  }
}
function elementToString(node) {
  if (node.name === "input") {
    console.log(node.endSourceSpan);
  }
  if (!node.endSourceSpan) {
    return `<${node.name}${astToHtml(node.attrs)}>${astToHtml(node.children)}`;
  }
  return `<${node.name}${astToHtml(node.attrs)}>${astToHtml(node.children)}</${
    node.name
  }>`;
}
function textToString(node) {
  return node.value;
}
function cdataToString(node) {
  return `<![CDATA[${node.value}]]>`;
}
function attributeToString(node) {
  return ` ${node.name}="${node.value}"`;
}
function docTypeToString(node) {
  return `<!DOCTYPE ${node.value}>`;
}
function commentToString(node) {
  return `<!-- ${node.value} -->`;
}
export function astToHtml(rootNodes) {
  return rootNodes.map(nodeToString).join("");
}
// const ast = parseTemplate(originalHtml, "souce.html");
// writeFileSync("./output.html", astToHtml(rootNodes));
