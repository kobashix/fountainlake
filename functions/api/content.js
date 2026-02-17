export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get("type") || "news"; // Default to news
  const limit = url.searchParams.get("limit") || 12;

  // MAP: Frontend "Type" -> WordPress GraphQL Query
  // Adjust 'categoryName' or 'postTypes' to match your actual WP setup
  const QUERIES = {
    news: `
      query GetNews {
        posts(first: ${limit}, where: { categoryName: "news" }) {
          nodes { title date uri excerpt { readTime } featuredImage { node { sourceUrl } } }
        }
      }`,
    business: `
      query GetBusiness {
        posts(first: ${limit}, where: { categoryName: "business" }) {
          nodes { title content uri featuredImage { node { sourceUrl } } }
        }
      }`,
    events: `
      query GetEvents {
        posts(first: ${limit}, where: { categoryName: "events" }) {
          nodes { title date uri content featuredImage { node { sourceUrl } } }
        }
      }`,
    politics: `
      query GetPolitics {
        posts(first: ${limit}, where: { categoryName: "politics" }) {
          nodes { title date uri excerpt { readTime } featuredImage { node { sourceUrl } } }
        }
      }`
  };

  const query = QUERIES[type] || QUERIES.news;

  try {
    const cmsResponse = await fetch("https://cms.fountainlake.net/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const data = await cmsResponse.json();
    
    // Clean up the response for the frontend
    const items = data.data.posts.nodes.map(post => ({
      title: post.title,
      date: new Date(post.date).toLocaleDateString(),
      link: post.uri, // WordPress handles the full URL
      image: post.featuredImage?.node?.sourceUrl || "/assets/img/default.jpg",
      summary: post.excerpt?.readTime || post.content?.substring(0, 100) + "..."
    }));

    return new Response(JSON.stringify(items), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "CMS Fetch Failed" }), { status: 500 });
  }
}