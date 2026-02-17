export async function onRequest(context) {
  const BASE_URL = "https://fountainlake.net";
  const WP_GRAPHQL_URL = "https://cms.fountainlake.net/graphql";

  // 1. Static Routes
  const staticRoutes = ["", "/business", "/events", "/politics", "/school", "/news", "/about"];

  // 2. Fetch Dynamic News Articles from WordPress
  let newsRoutes = [];
  try {
    const query = {
      query: `
        {
          newsItems(first: 50, where: {status: PUBLISH}) {
            nodes {
              uri
              modified
            }
          }
        }
      `
    };

    const response = await fetch(WP_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });

    const data = await response.json();
    if (data.data && data.data.newsItems) {
      newsRoutes = data.data.newsItems.nodes.map(node => ({
        // Ensure the URI matches your frontend path (usually /news/slug)
        path: node.uri, 
        lastmod: node.modified.split('T')[0]
      }));
    }
  } catch (err) {
    console.error("Sitemap fetch failed:", err);
  }

  // 3. Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticRoutes.map(route => `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === "" ? "1.0" : "0.8"}</priority>
  </url>`).join('')}
  ${newsRoutes.map(news => `
  <url>
    <loc>${BASE_URL}${news.path}</loc>
    <lastmod>${news.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600" // Cache for 1 hour
    }
  });
}