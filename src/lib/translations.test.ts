import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";
import { expect, test } from "vitest";
import { LANGUAGES } from "@/lib/languages";
import source from "@/lib/locales/en.json";
import catalogs from "@/lib/locales";
import { hasInterfaceTranslation, translate, translateText } from "@/lib/translations";

const placeholders = (message: string) => [...message.matchAll(/\{\d+\}/g)].map(([value]) => value).sort();
const numbers = (message: string) => message.replace(/\{\d+\}/g, "").match(/\d+(?:\.\d+)?/g) ?? [];
const allCatalogs: Record<string, Record<string, string>> = { en: source, ...catalogs };

test.each(LANGUAGES)("$name has every message, with intact interpolation and numerical trading rules", ({ code }) => {
  expect(hasInterfaceTranslation(code)).toBe(true);
  const catalog = allCatalogs[code];
  expect(catalog).toBeDefined();
  expect(Object.keys(catalog).sort()).toEqual(Object.keys(source).sort());
  for (const [key, value] of Object.entries(catalog)) {
    expect(value.trim(), `${code}: ${key}`).not.toBe("");
    expect(placeholders(value), `${code}: ${key}`).toEqual(placeholders(key));
    expect(numbers(value), `${code}: ${key}`).toEqual(numbers(key));
  }
  if (code !== "en") {
    for (const message of [
      "Trade Builder",
      "Account balance ($)", "Your balance with your broker, used for all risk limits",
      "Backup and restore", "Fees must be zero or more.",
    ]) expect(translateText(code, message), `${code}: ${message}`).not.toBe(message);
    expect(translate(code, "languagePreference")).not.toBe(translate("en", "languagePreference"));
  }
});

test("interpolation preserves ticker symbols, notes, signs, and USD amounts verbatim", () => {
  const notes = "Buy shares {1} — do not translate this note";
  const amount = "-$123.45";
  for (const { code } of LANGUAGES) {
    expect(translateText(code, "Notes: {0}", [notes])).toContain(notes);
    expect(translateText(code, "Profit/Loss {0}", [amount])).toContain(amount);
    expect(translateText(code, "{0} trade details", ["SHORT"])).toContain("SHORT");
    expect(translateText(code, amount)).toBe(amount);
  }
  expect(translateText("es", "constructor")).toBe("constructor");
  expect(translateText("es", "toString")).toBe("toString");
});

test("dynamic validation messages interpolate the original numeric details", () => {
  const source = "Profit zone is 2.45:1; this XLT scenario requires at least 3:1.";
  const translated = translateText("es", source);
  expect(translated).not.toBe(source);
  expect(translated).toContain("2.45");
  expect(translated).toContain("3:1");
});

test("rendered JSX text and literal translation calls stay covered by the source catalog", () => {
  const directory = join(process.cwd(), "src/components");
  const files = readdirSync(directory)
    .filter((name) => name.endsWith(".tsx") && !name.includes(".test."))
    .map((name) => join(directory, name));
  files.push(join(process.cwd(), "src/lib/copy.tsx"));
  files.push(join(process.cwd(), "src/lib/translations.ts"));
  for (const file of files) {
    const ast = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function check(node: ts.Node) {
      if (ts.isJsxText(node)) expect(node.text, file).not.toMatch(/[a-zA-Z]/);
      if (ts.isCallExpression(node) && node.expression.getText(ast) === "tx") {
        const key = node.arguments[0];
        if (key && ts.isStringLiteral(key) && /[a-zA-Z]/.test(key.text)) {
          expect(Object.hasOwn(source, key.text.trim()), `${file}: ${key.text}`).toBe(true);
        }
      }
      if (ts.isVariableDeclaration(node) && node.name.getText(ast) === "english" && node.initializer) {
        const catalog = ts.isAsExpression(node.initializer) ? node.initializer.expression : node.initializer;
        if (ts.isObjectLiteralExpression(catalog)) {
          for (const property of catalog.properties) {
            if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) {
              expect(Object.hasOwn(source, property.initializer.text), property.initializer.text).toBe(true);
            }
          }
        }
      }
      ts.forEachChild(node, check);
    }
    check(ast);
  }
});

test("worksheet additions keep static display strings and labels localized", () => {
  const file = join(process.cwd(), "src/components/my-trade-plan-dialog.tsx");
  const ast = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function check(node: ts.Node) {
    if (ts.isJsxExpression(node) && node.expression && ts.isStringLiteral(node.expression)) {
      expect(node.expression.text, `Translate worksheet display text: ${node.expression.text}`).not.toMatch(/[a-zA-Z]/);
    }
    if (ts.isJsxAttribute(node) && ["label", "aria-label", "title", "alt"].includes(node.name.getText(ast)) &&
      node.initializer && ts.isStringLiteral(node.initializer)) {
      expect(Object.hasOwn(source, node.initializer.text), `Worksheet label: ${node.initializer.text}`).toBe(true);
      expect(node.name.getText(ast), `Translate attribute: ${node.initializer.text}`).toBe("label");
    }
    if (ts.isCallExpression(node) && ["textField", "notes"].includes(node.expression.getText(ast))) {
      const label = node.arguments[1];
      if (label && ts.isStringLiteral(label)) expect(Object.hasOwn(source, label.text), label.text).toBe(true);
    }
    ts.forEachChild(node, check);
  }
  check(ast);
});

test("document headings and introductions are translated in every language", () => {
  const file = join(process.cwd(), "src/components/my-trade-plan-print.tsx");
  const ast = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function check(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ["DOCUMENT_TITLES", "INTRODUCTIONS"].includes(node.name.getText(ast)) &&
      node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
      for (const property of node.initializer.properties) {
        if (ts.isPropertyAssignment(property) && ts.isStringLiteral(property.initializer)) {
          for (const { code } of LANGUAGES) {
            expect(Object.hasOwn(allCatalogs[code], property.initializer.text), `${code}: ${property.initializer.text}`).toBe(true);
          }
        }
      }
    }
    ts.forEachChild(node, check);
  }
  check(ast);
});

test.each(LANGUAGES)("risk reward comparison stays intact in $name", ({ code }) => {
  expect(translateText(code, "I only take opportunities with a Reward vs. Ratio >=")).toMatch(/>=$/);
});
