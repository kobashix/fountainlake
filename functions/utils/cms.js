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
      throw new Error(`GraphQL Error: ${json.errors.map(e => e.message).join(", ")}`);
    }
    return json.data;
  } catch (err) {
    console.error("Fetch Error:", err);
    return null;
  }
}

// --- 1. NEWS ITEMS (News, Politics, School) ---
// Switched from 'posts' to 'newsItems' based on your structure.

export async function getPostList(categoryName, first = 12) {
  const query = `
    query GetNewsItems($categoryName: String, $first: Int!) {
      newsItems(first: $first, where: { categoryName: $categoryName, status: PUBLISH }) {
        nodes {
          title
          date
          slug
          excerpt
          featuredImage {
            node { sourceUrl(size: LARGE) }
          }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { categoryName, first });
  return data?.newsItems?.nodes || [];
}

export async function getSinglePost(slug) {
  const query = `
    query GetNewsItem($slug: ID!) {
      newsItem(id: $slug, idType: SLUG) {
        title
        date
        content
        featuredImage {
          node { sourceUrl(size: LARGE) }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { slug });
  return data?.newsItem || null;
}

// --- 2. BUSINESS LISTINGS ---

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
          businessFields {
            phone
            website
            category
            location {
              streetAddress
              city
              state
              postCode
            }
          }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { first });
  return data?.businesses?.nodes || [];
}

export async function getSingleBusiness(slug) {
  const query = `
    query GetBusiness($slug: ID!) {
      business(id: $slug, idType: SLUG) {
        title
        content
        featuredImage {
          node { sourceUrl(size: LARGE) }
        }
        businessFields {
          phone
          website
          description
          category
          location {
            streetAddress
            city
            state
            postCode
          }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { slug });
  return data?.business || null;
}

// --- 3. EVENTS (Calendar Mode) ---
// Now querying 'newsItems' with category 'events'

export async function getEventList(first = 20) {
  const query = `
    query GetEvents($first: Int!) {
      newsItems(first: $first, where: { categoryName: "events", status: PUBLISH }) {
        nodes {
          title
          slug
          content
          featuredImage {
            node { sourceUrl(size: LARGE) }
          }
          date 
          # Ensure your News Items support these ACF fields!
          eventFields {
            eventDate
            eventTime
            location
          }
        }
      }
    }
  `;
  const data = await fetchAPI(query, { first });
  return data?.newsItems?.nodes || [];
}

export async function getSingleEvent(slug) {
  const query = `
    query GetEvent($slug: ID!) {
      newsItem(id: $slug, idType: SLUG) {
        title
        content
        featuredImage {
          node { sourceUrl(size: LARGE) }
        }
        eventFields {
          eventDate
          eventTime
          location
          organizer
        }
      }
    }
  `;
  const data = await fetchAPI(query, { slug });
  return data?.newsItem || null;
}