import { expect, it } from "bun:test";
import { parseDuration } from "./parse-duration";

it("parses seconds by default", () => {
  expect(parseDuration("3")).toBe(3);
});

it("parses seconds with s suffix", () => {
  expect(parseDuration("4s")).toBe(4);
});

it("parses minutes", () => {
  expect(parseDuration("2m")).toBe(120);
});

it("parses hours", () => {
  expect(parseDuration("1h")).toBe(3600);
});

it("parses milliseconds", () => {
  expect(parseDuration("500ms")).toBeCloseTo(0.5);
});
