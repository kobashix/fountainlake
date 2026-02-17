export async function onRequestPost(context) {
  try {
    const data = await context.request.json();

    // GraphQL Mutation to Create Business
    // We put the details (phone, cat, etc.) into the main content body for now 
    // because mapping to ACF fields via API is complex without extra plugins.
    // As the editor, you will copy/paste them into the correct fields when you approve it.
    
    const contentBody = `
      <p><strong>Category:</strong> ${data.category}</p>
      <p><strong>Phone:</strong> ${data.phone}</p>
      <p><strong>Website:</strong> ${data.website}</p>
      <hr>
      <p>${data.description}</p>
    `;

    const query = `
      mutation CreateBusinessListing($title: String!, $body: String!) {
        createBusiness(input: {
          title: $title, 
          content: $body, 
          status: PENDING
        }) {
          business {
            id
            databaseId
          }
        }
      }
    `;

    // Auth
    const wpUser = context.env.WP_USERNAME; 
    const wpPass = context.env.WP_APP_PASSWORD;
    const authString = btoa(`${wpUser}:${wpPass}`);

    // Send
    const wpRes = await fetch("https://cms.fountainlake.net/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authString}`
      },
      body: JSON.stringify({
        query: query,
        variables: {
          title: data.title,
          body: contentBody
        }
      })
    });

    const wpJson = await wpRes.json();

    if (wpJson.errors) {
      return new Response(JSON.stringify({ success: false, message: wpJson.errors[0].message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
  }
}