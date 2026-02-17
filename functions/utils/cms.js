// functions/utils/cms.js

const WP_GRAPHQL_URL = "https://cms.fountainlake.net/graphql";

async function fetchAPI(query, variables = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(WP_GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  
  const json = await res.json();
  if (json.errors) {
    console.error(json.errors);
    throw new Error('Failed to fetch API');
  }
  return json.data;
}

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
              sourceUrl
            }
          }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { categoryName, first });
  return data.posts.nodes;
}

export async function getSinglePost(slug) {
  const query = `
    query GetPost($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        title
        date
        content
        featuredImage {
          node {
            sourceUrl
          }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { slug });
  return data.post;
}