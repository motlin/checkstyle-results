import { jest, describe, it, expect, beforeEach } from "@jest/globals";

const coreMock = {
  debug: jest.fn(),
  warning: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  getInput: jest.fn().mockImplementation(() => "**/fake-checkstyle.xml"),
  setFailed: jest.fn(),
  setOutput: jest.fn(),
  summary: {
    addRaw: jest.fn().mockReturnThis(),
    write: jest.fn().mockResolvedValue(undefined),
  },
};

const globMock = {
  create: jest.fn().mockImplementation(async () => ({
    glob: jest.fn().mockResolvedValue(["fake.xml"]),
    globGenerator: jest.fn(),
  })),
};

const fsMock = {
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(`
    <checkstyle>
      <file name="SomeFile.java">
        <error line="10" column="2" severity="error" message="Fake error" source="CheckstyleRule"/>
      </file>
    </checkstyle>
  `),
};

const pathMock = {
  relative: jest.fn().mockReturnValue("SomeFile.java"),
};

const parseStringPromiseMock = jest.fn().mockImplementation(async () => ({
  checkstyle: {
    file: [
      {
        $: { name: "SomeFile.java" },
        error: [
          {
            $: {
              line: "10",
              column: "2",
              severity: "error",
              message: "Fake error",
              source: "CheckstyleRule",
            },
          },
        ],
      },
    ],
  },
}));

const xml2jsMock = {
  parseStringPromise: parseStringPromiseMock,
};

// Set up mocks before importing the module
jest.unstable_mockModule("@actions/core", () => coreMock);
jest.unstable_mockModule("@actions/glob", () => globMock);
jest.unstable_mockModule("fs", () => fsMock);
jest.unstable_mockModule("xml2js", () => xml2jsMock);
jest.unstable_mockModule("path", () => pathMock);

// Dynamically import the module under test after mocks are set up
let run;

beforeEach(async () => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Dynamically import the module to ensure mocks are applied
  const mainModule = await import("../src/main.js");
  run = mainModule.run;
});

describe("Checkstyle logic", () => {
  it("fails if an 'error' severity is found", async () => {
    await run();
    expect(coreMock.setFailed).toHaveBeenCalledWith("Checkstyle reported errors");
  });

  it("does not fail if no errors are found", async () => {
    // Override the mock implementation for this test
    parseStringPromiseMock.mockResolvedValueOnce({
      checkstyle: {
        file: [
          {
            $: { name: "SomeFile.java" },
            // No error array
          },
        ],
      },
    });

    await run();
    expect(coreMock.setFailed).not.toHaveBeenCalled();
  });

  it("formats the annotation title from the source correctly", async () => {
    // Override the mock with a fully qualified source name to test the formatting
    parseStringPromiseMock.mockResolvedValueOnce({
      checkstyle: {
        file: [
          {
            $: { name: "SomeFile.java" },
            error: [
              {
                $: {
                  line: "10",
                  column: "2",
                  severity: "error",
                  message: "Fake error",
                  source: "com.puppycrawl.tools.checkstyle.checks.coding.NestedIfDepthCheck",
                },
              },
            ],
          },
        ],
      },
    });

    await run();

    // Check that the title is formatted correctly from the source
    // Should extract the package component and remove "Check" suffix
    expect(coreMock.info).toHaveBeenCalledWith(expect.stringContaining("title=coding/NestedIfDepth"));
  });

  it("handles annotations with no source attribute", async () => {
    // Override the mock with no source attribute
    parseStringPromiseMock.mockResolvedValueOnce({
      checkstyle: {
        file: [
          {
            $: { name: "SomeFile.java" },
            error: [
              {
                $: {
                  line: "10",
                  column: "2",
                  severity: "error",
                  message: "Fake error",
                  // No source provided
                },
              },
            ],
          },
        ],
      },
    });

    await run();

    // Check that an empty title is used when no source is provided
    expect(coreMock.info).toHaveBeenCalledWith(expect.stringContaining("title="));
    // The title should be blank but the parameter should exist
    expect(coreMock.info).not.toHaveBeenCalledWith(expect.stringContaining("title=,"));
  });

  it("handles annotation limits correctly", async () => {
    // Create a mock response with many violations
    const mockResult = {
      checkstyle: {
        file: [
          {
            $: { name: "SomeFile.java" },
            error: [],
          },
        ],
      },
    };

    // Add 15 errors
    for (let i = 1; i <= 15; i++) {
      mockResult.checkstyle.file[0].error.push({
        $: {
          line: String(i),
          column: "1",
          severity: "error",
          message: `Error ${i}`,
          source: `com.puppycrawl.tools.checkstyle.checks.ErrorCheck${i}`,
        },
      });
    }

    // Add 15 warnings
    for (let i = 1; i <= 15; i++) {
      mockResult.checkstyle.file[0].error.push({
        $: {
          line: String(i),
          column: "1",
          severity: "warning",
          message: `Warning ${i}`,
          source: `com.puppycrawl.tools.checkstyle.checks.WarningCheck${i}`,
        },
      });
    }

    // Add 35 notices
    for (let i = 1; i <= 35; i++) {
      mockResult.checkstyle.file[0].error.push({
        $: {
          line: String(i),
          column: "1",
          severity: "info",
          message: `Info ${i}`,
          source: `com.puppycrawl.tools.checkstyle.checks.InfoCheck${i}`,
        },
      });
    }

    parseStringPromiseMock.mockResolvedValueOnce(mockResult);

    await run();

    // Check that we created a summary
    expect(coreMock.summary.addRaw).toHaveBeenCalled();
    expect(coreMock.summary.write).toHaveBeenCalled();

    // We should have set failed because there were errors
    expect(coreMock.setFailed).toHaveBeenCalledWith("Checkstyle reported errors");
  });

  it("handles malformed XML gracefully", async () => {
    // Make parseStringPromise throw an error for this test
    parseStringPromiseMock.mockRejectedValueOnce(new Error("XML parsing error"));

    await run();

    // Should have warned about the malformed XML
    expect(coreMock.warning).toHaveBeenCalled();

    // Should not have failed the run just because of malformed XML
    expect(coreMock.setFailed).not.toHaveBeenCalled();
  });

  it("generates consolidated violations summary in logs", async () => {
    // Override path.relative mock to return the exact filenames we pass in
    pathMock.relative.mockImplementation((_, filename) => filename);

    const mockResult = {
      checkstyle: {
        file: [
          {
            $: { name: "SomeFile.java" },
            error: [
              {
                $: {
                  line: "10",
                  column: "2",
                  severity: "error",
                  message: "First error",
                  source: "com.puppycrawl.tools.checkstyle.checks.FirstRuleCheck",
                },
              },
              {
                $: {
                  line: "20",
                  column: "5",
                  severity: "warning",
                  message: "Some warning",
                  source: "com.puppycrawl.tools.checkstyle.checks.WarningRuleCheck",
                },
              },
            ],
          },
          {
            $: { name: "AnotherFile.java" },
            error: [
              {
                $: {
                  line: "30",
                  column: "8",
                  severity: "error",
                  message: "Another error",
                  source: "com.puppycrawl.tools.checkstyle.checks.SecondRuleCheck",
                },
              },
            ],
          },
        ],
      },
    };

    parseStringPromiseMock.mockResolvedValueOnce(mockResult);

    await run();

    // Check that the summary header and footer are logged
    expect(coreMock.info).toHaveBeenCalledWith("\n=== CheckStyle Violations ===");
    expect(coreMock.info).toHaveBeenCalledWith("===========================\n");

    // Check for the exact format of the consolidated violations summary
    expect(coreMock.info).toHaveBeenCalledWith("SomeFile.java:[10,2] (FirstRuleCheck) First error");
    expect(coreMock.info).toHaveBeenCalledWith("SomeFile.java:[20,5] (WarningRuleCheck) Some warning");
    expect(coreMock.info).toHaveBeenCalledWith("AnotherFile.java:[30,8] (SecondRuleCheck) Another error");
  });
});
