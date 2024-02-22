import { Project, SyntaxKind, Scope } from "ts-morph";
import { writeFileSync } from "fs";
let modifyIndex = 0;
let modifyStatistics = {}; //已经修改的内容合集

export class tsChineseToTanslate {
  constructor(options) {
    const { filePath, prefix = "TSdynamic" } = options;
    this.prefix = prefix;
    this.NoNeedImportTranslate = false;
    this.project = new Project();
    this.sourceFile = this.project.addSourceFileAtPath(filePath);
    this.deepLoopAstTree();
    this.writFiles();
  }

  deepLoopAstTree() {
    this.sourceFile.forEachDescendant((node) => {
      if (
        node.getKind() === SyntaxKind.StringLiteral ||
        node.getKind() === SyntaxKind.NoSubstitutionTemplateLiteral
      ) {
        // 检查字符串中是否包含中文
        if (/[\u4e00-\u9fa5]/.test(node.getLiteralText())) {
          if (!this.NoNeedImportTranslate) {
            this.addImportTranslate();
            this.addTranslateService();
            this.NoNeedImportTranslate = true;
          }
          const key = this.generateIncrementalKey();
          if (!modifyStatistics[this.prefix]) {
            modifyStatistics[this.prefix] = {};
          }
          modifyStatistics[this.prefix][key] = node.getLiteralText();
          console.log(modifyIndex, node.getLiteralText());
          // 输出包含中文的字符串信息
          node.replaceWithText(
            `this.translateService.instant('${this.prefix}.${key}')`
          );
        }
      }
    });
  }

  // import tanslate 服务
  addImportTranslate() {
    // 检查是否已经引入了 TranslateService
    const isTranslateServiceImported = this.sourceFile.getImportDeclaration(
      "@ngx-translate/core",
      "TranslateService"
    );
    if (!isTranslateServiceImported) {
      // 构造 import 语句结构
      const importDeclaration = {
        namedImports: [{ name: "TranslateService" }],
        moduleSpecifier: "@ngx-translate/core",
      };
      // 添加 import 语句到文件开头
      this.sourceFile.addImportDeclaration(importDeclaration);
    }
  }

  /** 获取动态key
   */
  generateIncrementalKey() {
    return `ts_dynamic_key_${modifyIndex++}`;
  }

  //
  addTranslateService() {
    // 遍历文件的顶层语句
this.sourceFile.forEachChild((child) => {
      // 如果是一个类声明
      if (child.getKind() === SyntaxKind.ClassDeclaration) {
        // 强制类型转换为 ClassDeclaration
        const classDeclaration = child;

        // 获取类的构造函数
        const constructorDeclaration = classDeclaration.getConstructors()[0];

        if (constructorDeclaration) {
          // 检查构造函数的参数列表是否包含 private translateService: TranslateService
          const hasTranslateServiceParam = constructorDeclaration
            .getParameters()
            .some((param) => {
              return param.getText().includes("translateService");
            });

          // 如果没有找到 private translateService: TranslateService 参数，则添加
          if (!hasTranslateServiceParam) {
            const parameterDeclaration = constructorDeclaration.addParameter({
              name: "translateService",
              type: "TranslateService",
              hasQuestionToken: false,
              isReadonly: false,
              isRestParameter: false,
              initializer: undefined,
              scope: Scope.Private,
            });
          } else {
          }
        } else {
          classDeclaration.insertConstructor(0, {
            parameters: [
              {
                name: "translateService",
                type: "TranslateService",
                hasQuestionToken: false,
                isReadonly: false,
                isRestParameter: false,
                initializer: undefined,
                scope: Scope.Private,
              },
            ],
          });
        }
      }
    });
  }

  writFiles() {
    this.sourceFile.saveSync();
    writeFileSync(
      "./ts-modify-statistics.json",
      JSON.stringify(modifyStatistics)
    );
  }
}

// new tsChineseToTanslate({
//   filePath: "./breakdown-maintenance-list.component.ts",
// });
