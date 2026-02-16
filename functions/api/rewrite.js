export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const articleUrl = url.searchParams.get("url");

  if (!articleUrl) return new Response(JSON.stringify({ error: "Missing URL" }), { status: 400 });

  try {
    // 1. Fetch external article
    const response = await fetch(articleUrl, { headers: { "User-Agent": "FountainLakeBot/1.0" } });
    const html = await response.text();

    // 2. Extract Text
    let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gmi, "")
                   .replace(/<style[^>]*>([\s\S]*?)<\/style>/gmi, "")
                   .replace(/<[^>]+>/g, "\n");
    text = text.replace(/\s+/g, " ").substring(0, 8000);

    if (!env.GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
    
    // CLEAN THE KEY: Remove any accidental spaces
    const apiKey = env.GEMINI_API_KEY.trim();

    // 3. Prepare Gemini Payload
    const geminiPayload = {
      contents: [{
        parts: [{
          text: `Rewrite this into a local news article HTML (use <h2>, <p>). 
          Headline: Catchy & Local. 
          Context: Fountain Lake, AR. 
          Source: ${text}`
        }]
      }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    // SWITCH TO V1 ENDPOINT (STABLE)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    const data = await geminiResponse.json();

    if (data.error) throw new Error("Gemini API Error: " + data.error.message);
    
    if (!data.candidates || data.candidates.length === 0) {
        const reason = data.promptFeedback?.blockReason || "Unknown Block";
        throw new Error(`Gemini refused to rewrite. Reason: ${reason}`);
    }

    const rewritten = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ content: rewritten }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}