export async function onRequest(context) {
  const url = new URL(context.request.url);

  // 1. EXCEPTION: If the user asks for "submit.html", give them the actual file.
  if (url.pathname.includes("submit.html")) {
    return context.env.ASSETS.fetch(url);
  }

  // 2. DEFAULT: For all other /news/ links, serve the App Shell (index.html).
  return context.env.ASSETS.fetch(new URL("/news/index.html", context.request.url));
}