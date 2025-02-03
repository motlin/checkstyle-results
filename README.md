# CheckStyle Results GitHub Action

[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action that converts CheckStyle XML reports into GitHub annotations, providing in-line code feedback directly in your Pull Requests.

## Features

- Parses CheckStyle XML reports and converts them to GitHub annotations
- Maps CheckStyle severity levels to appropriate GitHub annotation types:
  - `error` severity becomes GitHub error annotations
  - `warning` severity becomes GitHub warning annotations
  - `info` severity becomes GitHub notice annotations
- Supports glob patterns to find multiple CheckStyle report files
- Handles GitHub annotation limits gracefully with summary reports
- Works with Java, JavaScript/TypeScript, and any other language with CheckStyle-format reports

## Usage

### Basic Usage

Add the action to your GitHub workflow:

```yaml
name: CheckStyle

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  checkstyle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: "17"
          distribution: "temurin"
          cache: maven # or gradle

      # For Maven projects
      - name: Run CheckStyle with Maven
        run: mvn checkstyle:checkstyle

      # OR for Gradle projects
      # - name: Run CheckStyle with Gradle
      #   run: ./gradlew checkstyleMain checkstyleTest

      - name: Report CheckStyle Results
        uses: motlin/checkstyle-results@v1
        with:
          checkstyle_files: "**/checkstyle-result.xml" # Default value
```

## Input Parameters

| Parameter          | Description                                  | Default                    | Required |
| ------------------ | -------------------------------------------- | -------------------------- | -------- |
| `checkstyle_files` | Glob pattern for CheckStyle XML result files | `**/checkstyle-result.xml` | No       |

## Common CheckStyle Report Locations

| Build Tool | Typical Report Location             |
| ---------- | ----------------------------------- |
| Maven      | `target/checkstyle-result.xml`      |
| Gradle     | `build/reports/checkstyle/main.xml` |

## JavaScript/TypeScript Support

This action works with ESLint when configured to output in CheckStyle format:

1. Install the CheckStyle formatter:

```bash
npm install --save-dev eslint-formatter-checkstyle
```

2. Configure ESLint to output in CheckStyle format:

```json
"scripts": {
  "lint:checkstyle": "eslint -f checkstyle -o ./eslint-checkstyle-result.xml ."
}
```

3. Update your workflow:

```yaml
- name: Run ESLint with CheckStyle formatter
  run: npm run lint:checkstyle

- name: Report ESLint Results
  uses: motlin/checkstyle-results@v1
  with:
    checkstyle_files: "**/eslint-checkstyle-result.xml"
```

See [JAVASCRIPT-USAGE.md](JAVASCRIPT-USAGE.md) for detailed JavaScript integration instructions, including StyleLint and multi-linter setup.

## Detailed Documentation

For more detailed information, see:

- [USAGE.md](USAGE.md) - Complete usage guide for Java projects
- [JAVASCRIPT-USAGE.md](JAVASCRIPT-USAGE.md) - Integration with JavaScript/TypeScript projects

## Local Testing

To test this action locally:

1. Clone the repository
2. Navigate to the `e2e-test-project` directory
3. Run the local test script:

```bash
./run-local-test.sh path/to/your/checkstyle-result.xml
```

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the action
npm run bundle

# Run tests
npm test
```

### Making Changes

1. Update the source code in `src/`
2. Run tests with `npm test`
3. Bundle the action with `npm run bundle`
4. Run the local test to verify your changes

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.
