export async function onRequest(context) {
  const QUERY = "Fountain Lake Arkansas";
  // We keep 'when:30d' to guide Google
  const RSS_URL = `https://news.google.com/rss/search?q=${encodeURIComponent(QUERY + " when:30d")}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const response = await fetch(RSS_URL, {
      headers: { "User-Agent": "FountainLakeBot/1.0" }
    });

    if (!response.ok) throw new Error("Google News unavailable");

    const xml = await response.text();
    const items = parseRSS(xml);
    
    // --- DATE FILTER: 30 DAYS ---
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const freshNews = items.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= thirtyDaysAgo;
    });

    // --- SORT: NEWEST FIRST ---
    freshNews.sort((a, b) => new Date(b.date) - new Date(a.date));

    return new Response(JSON.stringify({ news: freshNews }), {
      headers: { 
        "Content-Type": "application/json", 
        "Cache-Control": "no-store" 
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
  const imgRegex = /<img[^>]+src="([^">]+)"/; 

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    let rawTitle = (content.match(titleRegex) || [])[1] || "No Title";
    const source = (content.match(sourceRegex) || [])[1] || "News";
    const cleanTitle = rawTitle.split(" - " + source)[0]; 
    const link = (content.match(linkRegex) || [])[1] || "#";
    const pubDate = (content.match(dateRegex) || [])[1] || "";
    const description = (content.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || "";
    const imgMatch = description.match(imgRegex);

    items.push({
      title: decodeHTMLEntities(cleanTitle),
      link: link,
      date: pubDate, 
      source: source,
      image: imgMatch ? imgMatch[1] : null
    });
  }
  return items;
}

function decodeHTMLEntities(text) {
  return text.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}