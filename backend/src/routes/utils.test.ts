import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { slugify, getCorsHeaders, parseBody } from "./utils";
import type { LambdaEvent } from "../types";

/* ------------------------------------------------------------------ */
/*  slugify                                                           */
/* ------------------------------------------------------------------ */
describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("My Project")).toBe("my-project");
  });

  it("replaces non-alphanumeric characters with hyphens", () => {
    expect(slugify("hello@world!")).toBe("hello-world");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("---foo---")).toBe("foo");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("truncates to 64 characters", () => {
    const result = slugify("A".repeat(100));
    expect(result.length).toBe(64);
  });
});

/* ------------------------------------------------------------------ */
/*  getCorsHeaders                                                    */
/* ------------------------------------------------------------------ */
describe("getCorsHeaders", () => {
  let savedOrigins: string | undefined;

  beforeEach(() => {
    savedOrigins = process.env.ALLOWED_ORIGINS;
  });

  afterEach(() => {
    if (savedOrigins === undefined) {
      delete process.env.ALLOWED_ORIGINS;
    } else {
      process.env.ALLOWED_ORIGINS = savedOrigins;
    }
  });

  it("returns matching origin when it is in the allow list", () => {
    process.env.ALLOWED_ORIGINS = "https://a.com,https://b.com";
    const headers = getCorsHeaders("https://b.com");
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://b.com");
  });

  it("returns first allow-list entry when origin does not match", () => {
    process.env.ALLOWED_ORIGINS = "https://a.com,https://b.com";
    const headers = getCorsHeaders("https://unknown.com");
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://a.com");
  });

  it("returns first allow-list entry when origin is undefined", () => {
    process.env.ALLOWED_ORIGINS = "https://a.com,https://b.com";
    const headers = getCorsHeaders(undefined);
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://a.com");
  });

  it('returns "*" when wildcard is in the allow list', () => {
    process.env.ALLOWED_ORIGINS = "*";
    const headers = getCorsHeaders("https://any.com");
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
  });

  it("always includes required CORS headers", () => {
    process.env.ALLOWED_ORIGINS = "https://a.com";
    const headers = getCorsHeaders("https://a.com");
    expect(headers["Access-Control-Allow-Headers"]).toBe("authorization,content-type");
    expect(headers["Access-Control-Allow-Methods"]).toBe("GET,POST,PUT,DELETE,OPTIONS");
  });
});

/* ------------------------------------------------------------------ */
/*  parseBody                                                         */
/* ------------------------------------------------------------------ */
describe("parseBody", () => {
  const baseEvent: Omit<LambdaEvent, "body" | "isBase64Encoded"> = {
    requestContext: { http: { method: "POST" } },
    rawPath: "/test",
    headers: {},
  };

  it("parses a valid JSON body", () => {
    const event: LambdaEvent = {
      ...baseEvent,
      body: JSON.stringify({ name: "test" }),
      isBase64Encoded: false,
    };
    expect(parseBody(event)).toEqual({ name: "test" });
  });

  it("decodes and parses a base64-encoded body", () => {
    const json = JSON.stringify({ value: 42 });
    const encoded = Buffer.from(json).toString("base64");
    const event: LambdaEvent = {
      ...baseEvent,
      body: encoded,
      isBase64Encoded: true,
    };
    expect(parseBody(event)).toEqual({ value: 42 });
  });

  it('throws "Missing request body" when body is absent', () => {
    const event: LambdaEvent = { ...baseEvent };
    expect(() => parseBody(event)).toThrow("Missing request body");
  });

  it("throws on malformed JSON", () => {
    const event: LambdaEvent = {
      ...baseEvent,
      body: "not-json",
      isBase64Encoded: false,
    };
    expect(() => parseBody(event)).toThrow();
  });
});
