export async function onRequest(context) {
  const BASE_URL = "https://fountainlake.net";

  // Public-facing routes derived from your directory structure
  // Note: /scout is intentionally omitted here
  const publicFolders = [
    "",
    "/business",
    "/events",
    "/politics",
    "/school",
    "/news",
    "/about"
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${publicFolders.map(route => `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=86400"
    }
  });
}