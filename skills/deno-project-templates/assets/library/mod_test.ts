import { assertEquals } from "jsr:@std/assert";
import { greet } from "./mod.ts";

Deno.test("greet returns correct message", () => {
  assertEquals(greet("World"), "Hello, World");
});
