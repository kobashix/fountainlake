export async function onRequest(context) {
  // Define your base site URL
  const BASE_URL = "https://fountainlake.net";

  // List of your static routes
  // For a more advanced setup, you could fetch dynamic routes from a database (D1) or KV
  const routes = [
    "",
    "/business",
    "/about",
    "/contact",
    "/politics",
    "/news",
    "/school",
    "/events"
  ];

  // Generate the XML structure
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes.map(route => `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400" // Cache for 24 hours
    }
  });
}