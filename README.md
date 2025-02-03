# CheckStyle Results GitHub Action

[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)

A GitHub Action that converts CheckStyle XML reports into GitHub annotations, providing in-line code feedback directly in your Pull Requests.

## Features

- Parses CheckStyle XML reports and converts them to GitHub annotations
- Fails the job if any error-level violations are found
- Maps CheckStyle severity levels to appropriate GitHub annotation types:
  - `error` severity becomes GitHub error annotations
  - `warning` severity becomes GitHub warning annotations
  - `info` severity becomes GitHub notice annotations
- Supports glob patterns to find multiple CheckStyle report files
- Works with Java, JavaScript/TypeScript, and any other language with CheckStyle-format reports.

## Basic Setup

Add this action to your GitHub workflow file (e.g., `.github/workflows/checkstyle.yml`):

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
          checkstyle_files: "**/checkstyle-result.xml"
```

## Common CheckStyle Report Locations

| Build Tool | Typical Report Location             |
| ---------- | ----------------------------------- |
| Maven      | `target/checkstyle-result.xml`      |
| Gradle     | `build/reports/checkstyle/main.xml` |

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.
