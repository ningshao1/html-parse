import { parse } from "angular-html-parser";
import { readFileSync, writeFileSync } from "fs";

let modifyIndex = 0; // 已修改的数量
let modifyStatistics = {}; //已经修改的内容合集
let manualProcessingSetIndex = 0; //无法修改的数量
let manualProcessingSet = {}; // 无法修改的内容合集

export class HtmlChineseToTanslate {
  constructor(options) {
    const { filePath, prefix = "dynamic" } = options;
    this.filePath = filePath;
    this.prefix = prefix;
    this.originalHtml = readFileSync(filePath, "utf-8");
    this.currentHtmlString = this.originalHtml;
    this.init();
  }
  init() {
    this.traverseHtml(this.currentHtmlString);
    this.writeFileSync();
  }

  /** 解析成AST */
  traverseHtml(htmlString = this.originalHtml) {
    const { rootNodes } = parse(htmlString, {
      canSelfClose: true,
      allowHtmComponentClosingTags: true,
      isTagNameCaseSensitive: true,
    });
    this.traverseAst(rootNodes);
  }

  /** 递归查询ast 查找需要修改的内容 */
  traverseAst(nodes) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.children && node.children.length > 0) {
        this.traverseAst(node.children);
      }
      if (node.type === "text") {
        this.textTranslate(node);
      }
      if (node.type === "element") {
        for (let i = node.attrs.length - 1; i >= 0; i--) {
          this.attributeTranslate(node.attrs[i]);
        }
      }
    }
  }

  /** text 类型修改 */
  textTranslate(node) {
    const value = node.value;
    const chineseRegex = /[\u4e00-\u9fa5]/;
    // 不包含中文的不执行
    if (!chineseRegex.test(value)) {
      return;
    }
    // 有两个及其以上的差值表达式不处理  这个模式暂不处理
    if (value.split("{").length > 3) {
      this.manualProcessingSetHandler(value);
      return;
    }

    // 代表是插值表达式
    if (/^\{\{.*\}\}$/.test(value.trim())) {
      // 有表达式不处理
      if (/[\+\*\/%]|===|!==|==|\?|\||!=|<=|<|>=|>|&&|\|\|/.test(value)) {
        this.manualProcessingSetHandler(value);
        return;
      }

      const match = value.match(/\{\{(.*?)\}\}/);
      let newValue = match ? match[1] : "";
      // 代表已经 translate 过
      if (newValue.includes("translate") || newValue.includes("|")) {
        return;
      }

      const key = this.generateIncrementalKey(node);
      const formatterValue = `{{"${this.prefix}.${key}" | translate}}`;
      this.modifyHtmlString({ node, formatterValue, key, newValue });
      return;
    }
    //非插值表达式
    if (!/{{[^{}]*}}/.test(value.trim())) {
      const key = this.generateIncrementalKey(node);
      const formatterValue = `{{"${this.prefix}.${key}" | translate}}`;
      this.modifyHtmlString({
        node,
        formatterValue,
        key,
        newValue: value,
      });
      return;
    }
    this.manualProcessingSetHandler(value);
  }

  /** 属性转换 */
  attributeTranslate(attr) {
    if (!attr) return;
    const value = attr.value;
    // 不包含中文的不执行
    if (!/[\u4e00-\u9fa5]/.test(value)) {
      return;
    }
    // 已经转换过
    if (value.includes("translate")) {
      return;
    }

    // 有表达式不处理
    if (
      /\{\{.*?\}\}|[\+\*\/%]|===|!==|==|!=|\?|<=|<|>=|>|&&|\|\|/.test(value)
    ) {
      this.manualProcessingSetHandler(value);
      return;
    }
    // 确保只有 [attribute]="'value'" 或者 attribute="value"
    if (
      !(
        attr.name.includes("*") ||
        attr.name.includes("#") ||
        attr.name.includes("(")
      )
    ) {
      const key = this.generateIncrementalKey(attr);
      this.modifyHtmlString({
        node: { ...attr, sourceSpan: attr.valueSpan },
        formatterValue: `"'dynamic.${key}' | translate"`,
        key,
        newValue: value,
      });
      if (!/\[.*?\]/.test(attr.name)) {
        this.modifyHtmlString({
          node: { ...attr, sourceSpan: attr.keySpan },
          formatterValue: `[${attr.name}]`,
          key: "",
          newValue: "",
        });
      }
    } else {
      this.manualProcessingSetHandler(value);
    }
  }

  /** 修改html字符串 */
  modifyHtmlString({ node, formatterValue, key, newValue }) {
    try {
      //处理案例 '"test"'=> 'test'
      newValue = newValue.trim().replace(/^\s*['"](.*)['"]\s*$/, "$1");
    } catch (e) {
      console.err(e);
    }
    const currentHtmlString = this.currentHtmlString;
    if (!modifyStatistics[this.prefix]) {
      modifyStatistics[this.prefix] = {};
    }
    newValue && key && (modifyStatistics[this.prefix][key] = newValue.trim()); // 已修改的内容写入到集合中
    const startOffset = node.sourceSpan.start.offset;
    const endOffset = node.sourceSpan.end.offset;
    let newStr =
      currentHtmlString.slice(0, startOffset) +
      formatterValue +
      currentHtmlString.slice(endOffset);
    this.currentHtmlString = newStr;
  }

  /** 获取动态key
   * todo 后期处理成已经存在的内容不重新生成
   */
  generateIncrementalKey(node) {
    return `dynamic_key_${modifyIndex++}`;
  }

  /** 记录不能处理的数据 */
  manualProcessingSetHandler(value) {
    if (manualProcessingSet[this.filePath]) {
      manualProcessingSet[this.filePath].push(value);
    } else {
      manualProcessingSet[this.filePath] = [];
    }
    ++manualProcessingSetIndex;
  }

  async writeFileSync() {
    await writeFileSync(this.filePath, this.currentHtmlString);
    await writeFileSync(
      "./modifyStatistics.json",
      JSON.stringify(modifyStatistics)
    );
  }
}

export class ChineseToTanslateLog {
  constructor() {}
  currentFileLog() {}
  getTotal() {
    return modifyIndex;
  }
  totalLog() {
    console.log("未修改的数量：", manualProcessingSetIndex);
    console.log("已修改的数量：", modifyIndex);
  }
}
