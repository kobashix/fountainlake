// functions/utils/cms.js

const WP_GRAPHQL_URL = "https://cms.fountainlake.net/graphql";
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
      console.error("CMS Errors:", json.errors);
      throw new Error("GraphQL Error");
    }
    return json.data;
  } catch (err) {
    console.error("Fetch Error:", err);
    return null;
  }
}

// 1. Get List of Businesses
export async function getBusinessList(first = 50) {
  const query = `
    query GetBusinesses($first: Int!) {
      businesses(first: $first, where: { status: PUBLISH }) {
        nodes {
          title
          slug
          excerpt
          featuredImage {
            node { sourceUrl(size: LARGE) }
          }
          # CORRECTED FIELDS BASED ON YOUR SCHEMA
          businessFields {
            location   # Was "address"
            phone
            website
            category   # New field you have
          }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { first });
  return data?.businesses?.nodes || [];
}

// 2. Get Single Business Profile
export async function getSingleBusiness(slug) {
  const query = `
    query GetBusiness($slug: ID!) {
      business(id: $slug, idType: SLUG) {
        title
        content
        featuredImage {
          node { sourceUrl(size: LARGE) }
        }
        # CORRECTED FIELDS
        businessFields {
          location
          phone
          website
          description  # You have a specific description field here
          category
        }
      }
    }
  `;
  const data = await fetchAPI(query, { slug });
  return data?.business || null;
}

// ... Keep your existing getPostList / getSinglePost functions for News ...