# Using the CheckStyle Results Action

This document provides detailed instructions for using this GitHub Action in your Java projects.

## Prerequisites

- A Java project using CheckStyle
- GitHub Actions workflow set up in your repository

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
        uses: YOUR_USERNAME/checkstyle-results@v1
        with:
          checkstyle_files: "**/checkstyle-result.xml" # Default value
```

## Input Parameters

| Parameter          | Description                                  | Default                    | Required |
| ------------------ | -------------------------------------------- | -------------------------- | -------- |
| `checkstyle_files` | Glob pattern for CheckStyle XML result files | `**/checkstyle-result.xml` | No       |

## Output

This action:

1. Parses all CheckStyle XML report files matching the glob pattern
2. Creates GitHub annotations for each violation found
   - `error` severity becomes GitHub error annotations
   - `warning` severity becomes GitHub warning annotations
   - `info` severity becomes GitHub notice annotations
3. Fails the job if any error-level violations are found

## Common CheckStyle Report Locations

| Build Tool | Typical Report Location             |
| ---------- | ----------------------------------- |
| Maven      | `target/checkstyle-result.xml`      |
| Gradle     | `build/reports/checkstyle/main.xml` |

## Example: Multiple CheckStyle Files

If you have multiple CheckStyle report files:

```yaml
- name: Report CheckStyle Results
  uses: YOUR_USERNAME/checkstyle-results@v1
  with:
    checkstyle_files: "target/checkstyle*.xml"
```

## Example: Custom CheckStyle Configuration

If you're using a custom CheckStyle configuration:

```yaml
- name: Run CheckStyle with Maven
  run: mvn checkstyle:checkstyle -Dcheckstyle.config.location=checkstyle.xml

- name: Report CheckStyle Results
  uses: YOUR_USERNAME/checkstyle-results@v1
```

## Troubleshooting

If you encounter issues:

1. Verify the CheckStyle XML files are being generated correctly
2. Check the file paths used in the glob pattern
3. Make sure your CheckStyle configuration is generating valid XML

## Local Testing

For testing this action locally before pushing to GitHub:

1. Clone the action repository
2. Navigate to the `e2e-test-project` directory
3. Use the `run-local-test.sh` script to test with your own XML files
