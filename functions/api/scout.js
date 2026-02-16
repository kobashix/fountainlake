export async function onRequest(context) {
  const QUERY = "Fountain Lake Arkansas";
  const RSS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY)}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const response = await fetch(RSS_URL, {
      headers: {
        "User-Agent": "FountainLakeBot/1.0 (Cloudflare Workers)"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch news" }), { status: 500 });
    }

    const xml = await response.text();
    const items = parseRSS(xml);

    return new Response(JSON.stringify({ news: items }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600" // Cache for 1 hour
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Helper: A lightweight XML-to-JSON parser for RSS feeds
function parseRSS(xml) {
  const items = [];
  // Regex to capture standard RSS <item> fields
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
  const sourceRegex = /<source url=".*?">(.*?)<\/source>/;

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = (content.match(titleRegex) || [])[1] || "No Title";
    const link = (content.match(linkRegex) || [])[1] || "#";
    const pubDate = (content.match(dateRegex) || [])[1] || "";
    const source = (content.match(sourceRegex) || [])[1] || "External Source";

    // Cleanup: Google News titles often look like "Headline - Source Name"
    // We can strip the source name if it's redundant, but let's keep it simple for now.
    
    items.push({
      title: decodeHTMLEntities(title),
      link: link,
      date: new Date(pubDate).toLocaleDateString(),
      source: source
    });
  }
  return items;
}

function decodeHTMLEntities(text) {
  return text.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
}