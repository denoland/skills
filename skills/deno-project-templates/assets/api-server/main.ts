import { serve } from "@std/http";

const handler = (request: Request): Response => {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    return new Response("Welcome to the API", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (url.pathname === "/api/hello") {
    return Response.json({ message: "Hello from Deno" });
  }

  return new Response("Not Found", { status: 404 });
};

console.log("Server running at http://localhost:8000");
serve(handler, { port: 8000 });
