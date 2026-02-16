export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const articleUrl = url.searchParams.get("url");

  if (!articleUrl) return new Response(JSON.stringify({ error: "Missing URL" }), { status: 400 });

  if (!env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY in Cloudflare settings." }), { status: 500 });
  }

  const apiKey = env.GEMINI_API_KEY.trim();

  try {
    // 1. Fetch external article
    const response = await fetch(articleUrl, { headers: { "User-Agent": "FountainLakeBot/1.0" } });
    if (!response.ok) throw new Error(`Failed to fetch article: ${response.status}`);
    
    let html = await response.text();
    
    // Simple cleanup
    let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gmi, "")
                   .replace(/<style[^>]*>([\s\S]*?)<\/style>/gmi, "")
                   .replace(/<[^>]+>/g, "\n")
                   .replace(/\s+/g, " ")
                   .substring(0, 7000);

    // 2. Define the payload
    const payload = {
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

    // 3. TARGET YOUR SPECIFIC MODELS
    // These are the exact models your error message confirmed you have.
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest"
    ];

    let lastError = "";

    for (const model of modelsToTry) {
      try {
        // We use the standard 'v1beta' endpoint which supports these newer models
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const run = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await run.json();

        // Check for success
        if (data.candidates && data.candidates.length > 0) {
          return new Response(JSON.stringify({ content: data.candidates[0].content.parts[0].text }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (data.error) {
            console.log(`Failed ${model}: ${data.error.message}`);
            lastError = data.error.message;
        }

      } catch (e) {
        lastError = e.message;
      }
    }

    throw new Error(`All models failed. Last error: ${lastError}`);

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}