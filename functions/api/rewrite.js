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

    // 3. Prepare Gemini Payload with SAFETY DISABLED
    const geminiPayload = {
      contents: [{
        parts: [{
          text: `Rewrite this into a local news article HTML (use <h2>, <p>). 
          Headline: Catchy & Local. 
          Context: Fountain Lake, AR. 
          Source: ${text}`
        }]
      }],
      // VITAL: This tells Gemini "Do not block news about accidents/crime"
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload)
    });

    const data = await geminiResponse.json();

    // 4. Debugging & Error Handling
    if (data.error) throw new Error("Gemini API Error: " + data.error.message);
    
    // Check if candidates exist (this is where your previous error happened)
    if (!data.candidates || data.candidates.length === 0) {
        // If it was blocked, 'promptFeedback' usually explains why
        const reason = data.promptFeedback?.blockReason || "Unknown Block";
        throw new Error(`Gemini refused to rewrite this article. Reason: ${reason}`);
    }

    const rewritten = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ content: rewritten }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}