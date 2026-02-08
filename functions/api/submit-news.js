export async function onRequestPost(context) {
  try {
    // 1. Get data from the frontend form
    const { title, content, authorName } = await context.request.json();

    // 2. Validate
    if (!title || !content) {
      return new Response(JSON.stringify({ success: false, message: "Missing fields" }), { status: 400 });
    }

    // 3. Prepare the GraphQL Mutation for WordPress
    // We set status: PENDING so it doesn't go live immediately.
    const query = `
      mutation CreateCommunityPost($title: String!, $body: String!) {
        createPost(input: {
          title: $title, 
          content: $body, 
          status: PENDING, 
          categories: { nodes: { name: "Community" } }
        }) {
          post {
            id
            databaseId
          }
        }
      }
    `;

    // 4. Send to WordPress
    // We access environment variables for the password
    const wpUser = context.env.WP_USERNAME; 
    const wpPass = context.env.WP_APP_PASSWORD;
    const authString = btoa(`${wpUser}:${wpPass}`); // Create Basic Auth Token

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
          body: `${content}\n\n--- Submitted by: ${authorName}`
        }
      })
    });

    const wpJson = await wpRes.json();

    // 5. Check if WordPress accepted it
    if (wpJson.errors) {
      return new Response(JSON.stringify({ success: false, message: wpJson.errors[0].message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, id: wpJson.data.createPost.post.databaseId }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
  }
}