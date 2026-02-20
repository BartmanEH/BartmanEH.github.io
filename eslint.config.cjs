// eslint.config.cjs
const js = require("@eslint/js");
const globals = require("globals");
const unicorn = require("eslint-plugin-unicorn");
// Custom rule: enforce exactly one space **before** inline comments
const inlineCommentSpacingRule = {
  meta: {
    type: "layout",
    docs: { description: "Require exactly one space before inline comments" },
    fixable: "whitespace",
    schema: [],
  },
  create(context) {
    const sourceCode = context.sourceCode;
    return {
      Program() {
        sourceCode.getAllComments().forEach(comment => {
          if (comment.type === "Line") {
            const line = sourceCode.lines[comment.loc.start.line - 1];
            const codeBefore = line.slice(0, comment.loc.start.column);

            // Ignore comments on their own line
            if (codeBefore.trim().length === 0) return;

            // Check if exactly one space exists before //
            if (!codeBefore.endsWith(" ")) {
              context.report({
                loc: comment.loc,
                message: "Inline comment should be preceded by exactly one space",
                fix(fixer) {
                  return fixer.insertTextBeforeRange([comment.range[0], comment.range[1]], " ");
                },
              });
            }
          }
        });
      },
    };
  },
};
module.exports = [
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.user.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script", // important for userscripts
      globals: {
        ...globals.browser,
        ...globals.es2021,
        // Tampermonkey / GM APIs
        GM_addStyle: "readonly",
        GM_xmlhttpRequest: "readonly",
        GM_getValue: "readonly",
        GM_setValue: "readonly",
        GM_info: "readonly",
        GM_getClipboard: "readonly",
        GM_setClipboard: "readonly",
        // Website globals
        map: "readonly",
        L: "readonly",
        // allow console
        console: "readonly",
      },
    },
    plugins: {
      unicorn, // for other Unicorn rules
      custom: { rules: { "inline-comment-spacing": inlineCommentSpacingRule } },
    },
    rules: {
      // allow unused variables prefixed with _
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
      // enforce at least one space after //
      "spaced-comment": [
        "warn",
        "always",
        { exceptions: ["-", "+"], markers: ["*"], line: { exceptions: [""] } },
      ],
      // enforce exactly one space before inline comments
      "custom/inline-comment-spacing": ["warn"],
    },
  },
];
