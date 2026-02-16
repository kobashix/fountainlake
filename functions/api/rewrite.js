export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  const articleUrl = url.searchParams.get("url");
  const articleTitle = url.searchParams.get("title"); // We now grab the title

  if (!articleUrl) return new Response(JSON.stringify({ error: "Missing URL" }), { status: 400 });
  if (!env.GEMINI_API_KEY) return new Response(JSON.stringify({ error: "Missing API Key" }), { status: 500 });

  const apiKey = env.GEMINI_API_KEY.trim();

  try {
    // 1. Try to fetch the article
    // We follow redirects to try and get past the Google wrapper
    const response = await fetch(articleUrl, { 
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FountainLakeBot/1.0)" },
      redirect: 'follow' 
    });
    
    let text = "";
    let useFallback = false;

    if (response.ok) {
      const html = await response.text();
      
      // 2. Detect "Google Junk"
      // If the page contains "Google News" specific junk, it's not the real article.
      if (html.includes("Google News") && html.length < 5000) {
         useFallback = true;
      } else {
         // Clean the real HTML
         text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gmi, "")
                    .replace(/<style[^>]*>([\s\S]*?)<\/style>/gmi, "")
                    .replace(/<[^>]+>/g, "\n")
                    .replace(/\s+/g, " ")
                    .substring(0, 7000);
      }
    } else {
      useFallback = true;
    }

    // 3. Construct the Prompt
    let promptText = "";
    
    if (useFallback || text.length < 200) {
      // FALLBACK: Write based on Title only (Prevents "Google News" hallucination)
      console.log("Using Fallback (Title Only)");
      promptText = `You are a local news reporter.
      write a short, factual news brief based STRICTLY on this headline: "${articleTitle}".
      
      RULES:
      - Do NOT make up names or specific quotes.
      - State clearly that reports indicate this event happened.
      - Keep it under 200 words.
      - Format as HTML (<h2>, <p>).
      - Headline wrapped in <h1>.`;
    } else {
      // STANDARD: Rewrite the full text
      promptText = `You are a helper for a WordPress Editor. 
      Rewrite the text below into a Local News Article.
      
      RULES:
      1. Output ONLY the HTML content tags (<h2>, <p>, <ul>, <li>).
      2. Do NOT use <html>, <head>, or markdown code blocks.
      3. HEADLINE: Write a catchy headline as the first line (wrapped in <h1>).
      4. CREDIT: End with a <p>Source: Based on reports from ${articleTitle}</p>
      
      SOURCE TEXT: ${text}`;
    }

    // 4. Call Gemini (Self-Healing Model Loop)
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
          return new Response(JSON.stringify({ content: cleanContent }), { headers: { "Content-Type": "application/json" } });
        }
        if (data.error) lastError = data.error.message;
      } catch (e) { lastError = e.message; }
    }

    throw new Error(`Failed to write article. Error: ${lastError}`);

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

function cleanGeminiOutput(text) {
  text = text.replace(/^```(html)?/i, "").replace(/```$/, "");
  return text.trim();
}