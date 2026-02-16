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
    // Simple cleanup to save tokens
    let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gmi, "")
                   .replace(/<style[^>]*>([\s\S]*?)<\/style>/gmi, "")
                   .replace(/<[^>]+>/g, "\n")
                   .replace(/\s+/g, " ")
                   .substring(0, 7000);

    // 2. Define the prompt
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

    // 3. THE "SELF-HEALING" LOOP
    // We will try these models in order.
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-001",
      "gemini-1.5-pro",
      "gemini-1.5-pro-001",
      "gemini-1.0-pro"
    ];

    let lastError = "";

    for (const model of modelsToTry) {
      try {
        // Use v1beta because it has broader model support
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const run = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await run.json();

        // If successful, return immediately
        if (data.candidates && data.candidates.length > 0) {
          return new Response(JSON.stringify({ content: data.candidates[0].content.parts[0].text }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        
        // Use error message to decide if we should try next model
        if (data.error) {
            console.log(`Failed ${model}: ${data.error.message}`);
            lastError = data.error.message;
        }

      } catch (e) {
        lastError = e.message;
      }
    }

    // 4. EMERGENCY DIAGNOSTIC
    // If we get here, NOTHING worked. Let's ask Google what models ARE available.
    const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listReq = await fetch(listModelsUrl);
    const listData = await listReq.json();

    if (listData.models) {
        const availableNames = listData.models.map(m => m.name).join(", ");
        throw new Error(`All attempts failed. Your key has access to these models: [${availableNames}]. Error: ${lastError}`);
    }

    throw new Error(`Gemini API Error: ${lastError}`);

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}