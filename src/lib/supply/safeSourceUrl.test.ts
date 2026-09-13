import { describe, expect, it } from "vitest";
import { safeSourceUrl } from "./safeSourceUrl";

describe("safeSourceUrl", () => {
  it("acepta fuentes públicas HTTP(S)", () => expect(safeSourceUrl("https://example.com/p/1")?.hostname).toBe("example.com"));
  it.each(["file:///etc/passwd", "http://localhost/x", "http://127.0.0.1/x", "http://10.0.0.2/x", "http://192.168.1.2/x", "http://172.16.1.2/x"])("rechaza %s", (url) => expect(safeSourceUrl(url)).toBeNull());
});
