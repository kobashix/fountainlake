export async function onRequest(context) {
  // Serve the Politics App Shell
  return context.env.ASSETS.fetch(new URL("/politics/index.html", context.request.url));
}