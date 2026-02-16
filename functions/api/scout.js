export async function onRequest(context) {
  // Query: "Fountain Lake Arkansas" AND posted in the last 7 days (when:7d)
  const QUERY = "Fountain Lake Arkansas when:7d";
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
        "Cache-Control": "public, max-age=1800" // Cache for 30 mins
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const titleRegex = /<title>(.*?)<\/title>/;
  const linkRegex = /<link>(.*?)<\/link>/;
  const dateRegex = /<pubDate>(.*?)<\/pubDate>/;
  const sourceRegex = /<source url=".*?">(.*?)<\/source>/;
  
  // Try to find an image in the description (often hidden in a CDATA tag)
  const imgRegex = /<img[^>]+src="([^">]+)"/; 

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    
    // Clean up title (remove " - Source Name" from the end)
    let rawTitle = (content.match(titleRegex) || [])[1] || "No Title";
    const source = (content.match(sourceRegex) || [])[1] || "News";
    const cleanTitle = rawTitle.split(" - " + source)[0]; 

    const link = (content.match(linkRegex) || [])[1] || "#";
    const pubDate = (content.match(dateRegex) || [])[1] || "";
    
    // Attempt to grab an image URL
    // Google RSS images are often tiny, but better than nothing.
    // If no image, we will use a default in the frontend.
    const description = (content.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "";
    const imgMatch = description.match(imgRegex);
    const image = imgMatch ? imgMatch[1] : null;

    items.push({
      title: decodeHTMLEntities(cleanTitle),
      link: link,
      date: new Date(pubDate).toLocaleDateString(),
      source: source,
      image: image
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