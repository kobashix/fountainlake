export async function onRequest(context) {
  // Serve the Business App Shell for all /business/* links
  return context.env.ASSETS.fetch(new URL("/business/index.html", context.request.url));
}