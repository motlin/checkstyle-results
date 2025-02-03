# Using CheckStyle Results Action with JavaScript Projects

This guide explains how to integrate the CheckStyle Results GitHub Action with JavaScript/TypeScript projects by adapting it to work with popular JavaScript linting tools.

## ESLint Integration

[ESLint](https://eslint.org/) is the most popular linting tool for JavaScript projects. Here's how to configure it to work with this action:

### 1. Generate ESLint Reports in CheckStyle Format

First, you need to generate reports in CheckStyle XML format:

```bash
npm install --save-dev eslint-formatter-checkstyle
```

### 2. Configure ESLint to Output CheckStyle XML

Add a script to your `package.json`:

```json
"scripts": {
  "lint": "eslint .",
  "lint:checkstyle": "eslint -f checkstyle -o ./eslint-checkstyle-result.xml ."
}
```

### 3. Create a GitHub Workflow

Create a file at `.github/workflows/eslint.yml`:

```yaml
name: ESLint

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  eslint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint with CheckStyle formatter
        run: npm run lint:checkstyle

      - name: Report ESLint Results
        uses: your-username/checkstyle-results@main
        with:
          checkstyle_files: "**/eslint-checkstyle-result.xml"
```

## TypeScript Integration

For TypeScript projects, you can use either ESLint (recommended) or TSLint (deprecated):

### For ESLint with TypeScript

1. Set up TypeScript ESLint following the steps above
2. Ensure your ESLint configuration includes TypeScript support:

```bash
npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

Update your `.eslintrc.js` or equivalent:

```js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
};
```

## StyleLint Integration (CSS/SCSS)

For CSS/SCSS linting:

### 1. Configure StyleLint to Output CheckStyle XML

```bash
npm install --save-dev stylelint stylelint-checkstyle-formatter
```

Add a script to your `package.json`:

```json
"scripts": {
  "lint:css": "stylelint '**/*.css' '**/*.scss'",
  "lint:css:checkstyle": "stylelint '**/*.css' '**/*.scss' --custom-formatter=node_modules/stylelint-checkstyle-formatter > stylelint-checkstyle-result.xml"
}
```

### 2. Update Your Workflow

Add to your GitHub workflow:

```yaml
- name: Run StyleLint with CheckStyle formatter
  run: npm run lint:css:checkstyle

- name: Report StyleLint Results
  uses: your-username/checkstyle-results@main
  with:
    checkstyle_files: "**/stylelint-checkstyle-result.xml"
```

## Multi-Linter Setup

You can combine multiple linters in a single workflow:

```yaml
name: Code Quality

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint with CheckStyle formatter
        run: npm run lint:checkstyle

      - name: Run StyleLint with CheckStyle formatter
        run: npm run lint:css:checkstyle

      - name: Report Linting Results
        uses: your-username/checkstyle-results@main
        with:
          checkstyle_files: "**/*checkstyle-result.xml"
```

## Local Testing

To test this setup locally before pushing to GitHub:

1. Run your linting commands with the CheckStyle formatters
2. Use the local test script from the e2e-test-project directory:

```bash
cd path/to/checkstyle-results/e2e-test-project
./run-local-test.sh path/to/your/eslint-checkstyle-result.xml
```

## Example ESLint Configuration

Here's a basic ESLint configuration that works well with this setup:

```js
// .eslintrc.js
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["eslint:recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    semi: ["error", "always"],
    quotes: ["error", "single"],
    "no-console": "warn",
  },
};
```

For TypeScript projects, use this configuration:

```js
// .eslintrc.js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    semi: ["error", "always"],
    quotes: ["error", "single"],
    "no-console": "warn",
  },
};
```

## Troubleshooting

If you encounter issues:

1. Verify the linter is correctly generating CheckStyle XML files
2. Check the file path pattern in the `checkstyle_files` input
3. Make sure your linter is configured to use the correct formatter
4. For local testing, check the console output for diagnostic information

Remember to update `your-username/checkstyle-results@main` with the actual published action name when you're ready to use it.
