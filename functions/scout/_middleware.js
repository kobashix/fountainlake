export async function onRequest(context) {
  const { request, next, env } = context;
  
  // Set your desired password here or in Cloudflare Environment Variables
  const SCOUT_PASSWORD = env.SCOUT_PASSWORD || "your_secret_password";

  const url = new URL(request.url);
  const cookie = request.headers.get("Cookie") || "";

  // Check if they already have the "authenticated" cookie
  if (cookie.includes("scout_auth=true")) {
    return await next();
  }

  // Check for password submission (Basic prompt)
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Scout Login"',
      },
    });
  }

  // Decode the Basic Auth header
  const base64 = authHeader.split(" ")[1];
  const decoded = atob(base64);
  const [user, pass] = decoded.split(":");

  // Verify password (User can be anything)
  if (pass === SCOUT_PASSWORD) {
    const response = await next();
    // Give them a cookie so they don't have to login every time
    response.headers.append("Set-Cookie", "scout_auth=true; Path=/scout; HttpOnly; Max-Age=86400");
    return response;
  }

  return new Response("Invalid Password", { status: 403 });
}