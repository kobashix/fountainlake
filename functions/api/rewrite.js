export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const articleUrl = url.searchParams.get("url");

  if (!articleUrl) return new Response(JSON.stringify({ error: "Missing URL" }), { status: 400 });

  if (!env.GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing GEMINI_API_KEY" }), { status: 500 });
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
          // STRICT PROMPT: Forces clean content only
          text: `You are a helper for a WordPress Editor. 
          Rewrite the text below into a Local News Article.
          
          RULES:
          1. Output ONLY the HTML content tags (<h2>, <p>, <ul>, <li>).
          2. Do NOT use <html>, <head>, <body>, or <style> tags.
          3. Do NOT wrap the output in markdown code blocks (like \`\`\`html).
          4. HEADLINE: Write a catchy headline as the first line (wrapped in <h1>).
          5. CREDIT: End with a <p>Source: [Original Source Name]</p>
          
          SOURCE TEXT: ${text}`
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
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest"
    ];

    let lastError = "";

    for (const model of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const run = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await run.json();

        if (data.candidates && data.candidates.length > 0) {
          let rawContent = data.candidates[0].content.parts[0].text;
          
          // CRITICAL FIX: Strip Markdown Code Blocks if Gemini ignores the rules
          let cleanContent = cleanGeminiOutput(rawContent);

          return new Response(JSON.stringify({ content: cleanContent }), {
            headers: { "Content-Type": "application/json" }
          });
        }
        
        if (data.error) lastError = data.error.message;

      } catch (e) {
        lastError = e.message;
      }
    }

    throw new Error(`All models failed. Last error: ${lastError}`);

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// HELPER: Removes ```html and ``` wrappers
function cleanGeminiOutput(text) {
  // Remove starting ```html or ```
  text = text.replace(/^```(html)?/i, "");
  // Remove ending ```
  text = text.replace(/```$/, "");
  // Remove <!DOCTYPE> or <html> tags if they snuck in
  text = text.replace(/<!DOCTYPE html>/gi, "");
  text = text.replace(/<html>/gi, "");
  text = text.replace(/<\/html>/gi, "");
  text = text.replace(/<body>/gi, "");
  text = text.replace(/<\/body>/gi, "");
  
  return text.trim();
}