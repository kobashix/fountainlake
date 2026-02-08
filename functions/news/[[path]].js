export async function onRequest(context) {
  // 1. Fetch the actual app shell (news/index.html)
  // 2. Serve it to the browser, allowing the URL to stay as /news/some-cool-story
  return context.env.ASSETS.fetch(new URL("/news/index.html", context.request.url));
}