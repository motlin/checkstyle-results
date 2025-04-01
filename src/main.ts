import * as core from "@actions/core";
import * as glob from "@actions/glob";
import * as fs from "fs";
import * as path from "path";
import { parseStringPromise } from "xml2js";

export async function run(): Promise<void> {
  try {
    let pattern = core.getInput("checkstyle_files", { required: false });
    if (!pattern) {
      pattern = "**/checkstyle-result.xml";
    }

    const globber = await glob.create(pattern);
    const files = await globber.glob();

    let foundErrors = false;

    const counters = {
      errors: 0,
      warnings: 0,
      notices: 0,
      total: 0,
      skipped: 0,
    };

    const limits = {
      error: 10,
      warning: 10,
      notice: 30,
      total: 50,
    };

    const allViolations: Array<{
      file: string;
      line: number;
      column: number;
      severity: string;
      message: string;
      source: string;
    }> = [];

    function formatRuleTitle(source: string): string {
      if (source && source.includes(".")) {
        const parts = source.split(".");
        const ruleName = parts[parts.length - 1].replace("Check", "");
        const packageName = parts[parts.length - 2];
        return `${packageName}/${ruleName}`;
      } else {
        return source;
      }
    }

    for (const filePath of files) {
      core.debug(`Reading Checkstyle file: ${filePath}`);
      if (!fs.existsSync(filePath)) {
        core.warning(`File not found: ${filePath}`);
        continue;
      }

      let xmlData: string;
      try {
        xmlData = fs.readFileSync(filePath, "utf-8");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        core.warning(`Failed to read file: ${filePath}`);
        continue;
      }

      let result;
      try {
        result = await parseStringPromise(xmlData);
      } catch (error) {
        core.warning(
          `Failed to parse XML in file: ${filePath}. ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }

      const filesInReport = result.checkstyle?.file || [];

      for (const f of filesInReport) {
        const filename = f.$.name;
        const errors = f.error || [];
        for (const e of errors) {
          const line = e.$.line || 0;
          const column = e.$.column || 0;
          const severity = e.$.severity || "error";
          const msg = e.$.message || "No message provided";
          const source = e.$.source || "";

          let command = "error";
          if (severity.toLowerCase() === "warning") {
            command = "warning";
          } else if (severity.toLowerCase() === "info") {
            command = "notice";
          }
          if (severity.toLowerCase() === "error") {
            foundErrors = true;
          }

          counters.total++;

          allViolations.push({
            file: filename,
            line: parseInt(line),
            column: parseInt(column),
            severity: severity,
            message: msg,
            source: source,
          });

          if (counters.total <= limits.total) {
            const severityCount =
              command === "error"
                ? ++counters.errors
                : command === "warning"
                  ? ++counters.warnings
                  : ++counters.notices;

            const severityLimit =
              command === "error" ? limits.error : command === "warning" ? limits.warning : limits.notice;

            if (severityCount <= severityLimit) {
              const relativePath = path.relative(process.cwd(), filename);
              const title = formatRuleTitle(source);
              core.info(`::${command} file=${relativePath},line=${line},col=${column},title=${title}::${msg}`);
            } else {
              counters.skipped++;
            }
          } else {
            counters.skipped++;
          }
        }
      }
    }

    if (allViolations.length > 0) {
      core.info("\n=== CheckStyle Violations ===");
      for (const violation of allViolations) {
        const relativePath = path.relative(process.cwd(), violation.file);
        core.info(
          `${relativePath}:[${violation.line},${violation.column}] (${violation.source.split(".").pop()}) ${violation.message}`,
        );
      }
      core.info("===========================\n");
    }

    if (counters.skipped > 0) {
      const summary = [
        `## CheckStyle Violations Summary`,
        ``,
        `**Total violations found:** ${counters.total}`,
        `**Violations reported as annotations:** ${counters.total - counters.skipped}`,
        `**Violations omitted due to GitHub limits:** ${counters.skipped}`,
        ``,
        `### Breakdown by severity`,
        `- Errors: ${counters.errors > limits.error ? limits.error : counters.errors} reported${counters.errors > limits.error ? ` (${counters.errors - limits.error} omitted)` : ""}`,
        `- Warnings: ${counters.warnings > limits.warning ? limits.warning : counters.warnings} reported${counters.warnings > limits.warning ? ` (${counters.warnings - limits.warning} omitted)` : ""}`,
        `- Notices: ${counters.notices > limits.notice ? limits.notice : counters.notices} reported${counters.notices > limits.notice ? ` (${counters.notices - limits.notice} omitted)` : ""}`,
      ].join("\n");

      core.summary.addRaw(summary).write();
      core.info(
        `CheckStyle found ${counters.total} violations in total, but only ${counters.total - counters.skipped} were reported as annotations due to GitHub limits.`,
      );
    }

    if (foundErrors) {
      core.setFailed("Checkstyle reported errors");
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}
