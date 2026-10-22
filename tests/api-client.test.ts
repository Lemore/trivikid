import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CLIENT_TIMEOUT_MS, fetchQuestion } from "@/lib/api-client";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("fetchQuestion", () => {
  test("aborts after the client timeout and returns an error", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) =>
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          ),
        ),
    );
    const result = fetchQuestion({ topic: "חלל" });
    await vi.advanceTimersByTimeAsync(CLIENT_TIMEOUT_MS);
    expect(await result).toEqual({ status: "error" });
  });

  test("a network failure returns offline", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await fetchQuestion({ topic: "חלל" })).toEqual({ status: "offline" });
  });

  test("an error response or unexpected body returns an error", async () => {
    fetchMock.mockResolvedValueOnce({ json: async () => ({ status: "error" }) });
    expect(await fetchQuestion({ topic: "חלל" })).toEqual({ status: "error" });
    fetchMock.mockResolvedValueOnce({ json: async () => ({ hello: 1 }) });
    expect(await fetchQuestion({ topic: "חלל" })).toEqual({ status: "error" });
    fetchMock.mockResolvedValueOnce({ json: async () => Promise.reject(new SyntaxError()) });
    expect(await fetchQuestion({ topic: "חלל" })).toEqual({ status: "error" });
  });
});
