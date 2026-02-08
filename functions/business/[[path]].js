export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 1. HALL PASS: If the user wants the submit page, serve the actual file.
  if (url.pathname.includes("submit.html")) {
    return context.env.ASSETS.fetch(url);
  }

  // 2. ROUTER: For everything else, serve the Business App Shell.
  return context.env.ASSETS.fetch(new URL("/business/index.html", context.request.url));
}