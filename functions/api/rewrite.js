export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const articleUrl = url.searchParams.get("url");
  const articleTitle = url.searchParams.get("title");

  if (!articleUrl) return new Response(JSON.stringify({ error: "Missing URL" }), { status: 400 });
  if (!env.GEMINI_API_KEY) return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500 });

  const apiKey = env.GEMINI_API_KEY.trim();

  try {
    const response = await fetch(articleUrl, { 
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FountainLakeBot/1.0)" },
      redirect: 'follow' 
    });
    
    let text = "";
    let useFallback = false;
    let mainImage = ""; 

    if (response.ok) {
      const html = await response.text();
      
      // Image Hunter
      const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i) || 
                         html.match(/<meta name="twitter:image" content="([^"]+)"/i);
      if (imageMatch) {
          mainImage = imageMatch[1];
          if (mainImage.startsWith("/")) {
              const urlObj = new URL(response.url);
              mainImage = `${urlObj.protocol}//${urlObj.host}${mainImage}`;
          }
      }

      if (html.includes("Google News") && html.length < 5000) {
         useFallback = true;
      } else {
         text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gmi, "")
                    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gmi, "")
                    .replace(/<[^>]+>/g, "\n")
                    .replace(/\s+/g, " ")
                    .substring(0, 7000);
      }
    } else {
      useFallback = true;
    }

    let promptText = "";
    // SIMPLIFIED PROMPT: Just ask for clean HTML. No Gutenberg blocks.
    const rules = `
    OUTPUT RULES:
    1. Output CLEAN HTML (<h2>, <p>, <ul>, <li>).
    2. Do NOT use <html>, <head>, <body> tags.
    3. Do NOT use Markdown (no **, no #).
    4. Do NOT use comments.
    `;

    if (useFallback || text.length < 200) {
      promptText = `You are a local news reporter.
      Write a short news brief based on this headline: "${articleTitle}".
      ${rules}`;
    } else {
      promptText = `You are a Local News Editor. 
      Rewrite the text below.
      CREDIT: End with a paragraph: "Source: Based on reports from ${articleTitle}"
      ${rules}
      SOURCE TEXT: ${text}`;
    }

    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
      ]
    };

    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    let lastError = "";

    for (const model of modelsToTry) {
      try {
        const run = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await run.json();

        if (data.candidates && data.candidates.length > 0) {
          let cleanContent = cleanGeminiOutput(data.candidates[0].content.parts[0].text);
          return new Response(JSON.stringify({ 
              content: cleanContent,
              image: mainImage 
          }), { headers: { "Content-Type": "application/json" } });
        }
        if (data.error) lastError = data.error.message;
      } catch (e) { lastError = e.message; }
    }

    throw new Error(`Failed. Error: ${lastError}`);

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

function cleanGeminiOutput(text) {
  text = text.replace(/^```(html)?/i, "").replace(/```$/, "");
  return text.trim();
}