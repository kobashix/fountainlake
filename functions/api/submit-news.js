export async function onRequestPost(context) {
  try {
    // 1. Get data from frontend
    const { title, content, authorName } = await context.request.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ success: false, message: "Missing title or content" }), { status: 400 });
    }

    // 2. Prepare GraphQL Mutation
    // Note: We use 'createNewsItem' because your CPT is named 'news'. 
    // If this fails with "Unknown Type", verify your CPT UI settings.
    const query = `
      mutation CreateCommunityNews($title: String!, $body: String!) {
        createNewsItem(input: {
          title: $title, 
          content: $body, 
          status: PENDING
        }) {
          newsItem {
            id
            databaseId
          }
        }
      }
    `;

    // 3. Authenticate with WordPress
    const wpUser = context.env.WP_USERNAME; 
    const wpPass = context.env.WP_APP_PASSWORD;
    
    if (!wpUser || !wpPass) {
      throw new Error("Server misconfiguration: Missing credentials");
    }

    const authString = btoa(`${wpUser}:${wpPass}`);

    // 4. Send to CMS
    const wpRes = await fetch("https://cms.fountainlake.net/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify({
        query: query,
        variables: {
          title: title,
          body: `${content}\n\n<p><em>Submitted by: ${authorName} via Web Form</em></p>`
        }
      })
    });

    const wpJson = await wpRes.json();

    // 5. Handle Errors
    if (wpJson.errors) {
      return new Response(JSON.stringify({ success: false, message: wpJson.errors[0].message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
  }
}