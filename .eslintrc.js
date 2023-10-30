module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        tsconfigRootDir: __dirname,
        project: "./tsconfig.json"
    },
    ignorePatterns: [
        "/node_modules/**",
        "/lib/**",
        "/coverage/**",
        "/.eslintrc.js",
        "/spec/**",
    ],
    plugins: [
        "security",
        "@typescript-eslint"
    ],
    rules: {
        "max-len": "off",
        "no-plusplus": "off",
        "no-case-declarations": "off",
        "import/extensions": "off",
        "import/no-unresolved": "off",
        "import/prefer-default-export": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "no-param-reassign": ["warn"],
        "class-methods-use-this": ["warn"],
        "@typescript-eslint/no-explicit-any": ["warn"],
        "@typescript-eslint/no-unsafe-assignment": ["warn"],
        "@typescript-eslint/no-unsafe-return": ["warn"],
        "@typescript-eslint/no-unsafe-call": ["warn"],
        "@typescript-eslint/no-unsafe-member-access": ["warn"],
        "@typescript-eslint/unbound-method": ["warn"],
        "@typescript-eslint/require-await": ["warn"],
        "@typescript-eslint/prefer-regexp-exec": ["warn"],
        "semi-spacing": [
            "warn",
            { "before": false, "after": false }
        ],

        /* False positive of no-shadow rule with ENUMs (https://github.com/typescript-eslint/typescript-eslint/issues/2483) */
        "no-shadow": "off",
        "@typescript-eslint/no-shadow": "error",
    },
    extends: [
        "airbnb-base",
        "eslint:recommended",
        "plugin:security/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/recommended-requiring-type-checking"
    ],
};