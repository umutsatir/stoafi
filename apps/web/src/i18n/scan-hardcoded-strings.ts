import ts from "typescript";

/** JSX attribute names whose string literal value is never user-facing text. */
const ATTRIBUTE_ALLOW_LIST = new Set([
  "className",
  "id",
  "htmlFor",
  "href",
  "type",
  "key",
  "data-testid",
  "name",
  "value",
  "accept",
  "step",
  "src",
  "alt", // icons only, per project convention; content strings still flagged as text
  "rel",
  "target",
  "lang",
  "content",
  "download",
]);

export interface HardcodedStringViolation {
  file: string;
  line: number;
  text: string;
}

function hasLetters(text: string): boolean {
  return /[A-Za-zÀ-ÖØ-öø-ÿıİğĞşŞçÇöÖüÜ]/.test(text);
}

/**
 * Scans a .tsx source file's AST for JSX text nodes and non-allow-listed
 * JSX string-literal attributes that look like human-readable text.
 */
export function scanForHardcodedStrings(
  sourceText: string,
  fileName: string,
): HardcodedStringViolation[] {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const violations: HardcodedStringViolation[] = [];

  function lineOf(node: ts.Node): number {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
  }

  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      const text = node.text.trim();
      if (text.length > 0 && hasLetters(text)) {
        violations.push({ file: fileName, line: lineOf(node), text });
      }
    }

    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const attrName = node.name.getText(sourceFile);
      const value = node.initializer.text;
      if (!ATTRIBUTE_ALLOW_LIST.has(attrName) && hasLetters(value) && value.length > 1) {
        violations.push({ file: fileName, line: lineOf(node), text: `${attrName}="${value}"` });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}
