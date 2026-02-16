export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const articleUrl = url.searchParams.get("url");

  if (!articleUrl) return new Response("Missing URL", { status: 400 });

  try {
    // 1. Fetch the external article
    const response = await fetch(articleUrl, {
      headers: { "User-Agent": "FountainLakeBot/1.0" }
    });
    const html = await response.text();

    // 2. Extract the main text (Rough extraction to avoid complex parsing)
    // We strip scripts, styles, and tags to get raw text for Gemini
    let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gmi, "")
                   .replace(/<style[^>]*>([\s\S]*?)<\/style>/gmi, "")
                   .replace(/<[^>]+>/g, "\n");
    
    // Limit text to 8000 chars to save tokens (usually enough for news)
    text = text.replace(/\s+/g, " ").substring(0, 8000);

    // 3. Call Gemini API to rewrite it
    const geminiPayload = {
      contents: [{
        parts: [{
          text: `You are a local news editor for "FountainLake.net". 
          Rewrite the following raw text into a high-quality local news article.
          
          Guidelines:
          - HEADLINE: Catchy, under 60 chars, includes "Fountain Lake" or local context if relevant.
          - TONE: Professional, neutral, informative.
          - FORMAT: HTML. Use <h2> for subheaders. Use <ul> for key takeaways.
          - SEO: Include keywords like "Fountain Lake", "Garland County", "Arkansas".
          - CONTENT: Summarize the key facts. Do not make things up. If the text is messy, extract the signal from the noise.
          - CREDIT: End with "Source: [Original Source Name]"
          
          Raw Text: ${text}`
        }]
      }]
    };

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    const data = await geminiResponse.json();
    const rewritten = data.candidates[0].content.parts[0].text;

    // 4. Return the new content
    return new Response(JSON.stringify({ content: rewritten }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}