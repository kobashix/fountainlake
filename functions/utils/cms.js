// functions/utils/cms.js

// CONFIGURATION
const WP_GRAPHQL_URL = "https://cms.fountainlake.net/graphql";

// This header tricks the server into thinking we are a real browser, not a bot
const HEADERS = { 
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

async function fetchAPI(query, variables = {}) {
  try {
    const res = await fetch(WP_GRAPHQL_URL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();
    if (json.errors) {
      console.error("CMS Error:", json.errors);
      throw new Error('Failed to fetch API');
    }
    return json.data;
  } catch (err) {
    console.error("Network Error:", err); 
    return null; // Fail gracefully
  }
}

// 1. Get a List of Posts (for the main feed)
export async function getPostList(categoryName, first = 12) {
  const query = `
    query GetPosts($categoryName: String!, $first: Int!) {
      posts(first: $first, where: { categoryName: $categoryName }) {
        nodes {
          title
          date
          slug
          excerpt
          featuredImage {
            node {
              sourceUrl(size: LARGE)
            }
          }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { categoryName, first });
  return data?.posts?.nodes || [];
}

// 2. Get a Single Post (for the article view)
export async function getSinglePost(slug) {
  const query = `
    query GetPost($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        title
        date
        content
        featuredImage {
          node {
            sourceUrl(size: LARGE)
          }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { slug });
  return data?.post || null;
}