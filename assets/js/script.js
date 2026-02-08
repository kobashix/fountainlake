document.addEventListener("DOMContentLoaded", () => {

  const ENDPOINT = "https://cms.fountainlake.net/graphql";
  const app = document.getElementById("app");
  const home = document.getElementById("home");

  /* ===============================
     Load shared navigation
     =============================== */
  const navContainer = document.getElementById("nav");
  if (navContainer) {
    fetch("/partials/nav.html")
      .then(res => res.text())
      .then(html => {
        navContainer.innerHTML = html;
      })
      .catch(() => {
        console.warn("Nav failed to load");
      });
  }

  /* ===============================
     Helpers
     =============================== */
  function renderError(container, err) {
    container.innerHTML =
      "<div class='error'>" + err + "</div>";
  }

  function renderList(container, items, type) {
    if (!items || !items.length) {
      container.innerHTML = "<p class='muted'>No items.</p>";
      return;
    }

    container.innerHTML = "";

    items.forEach(item => {
      const div = document.createElement("div");
      div.className = "news-item";
      div.innerHTML = `
        <a data-type="${type}" data-slug="${item.slug}">
          ${item.title}
        </a>
      `;
      container.appendChild(div);
    });
  }

  /* ===============================
     Load homepage sections
     =============================== */
  function loadLocalNews() {
    const container = document.getElementById("local-news");
    if (!container) return;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          {
            newsItems(first: 5, where: { status: PUBLISH }) {
              nodes {
                title
                slug
              }
            }
          }
        `
      })
    })
    .then(res => res.json())
    .then(res => {
      if (res.errors) {
        renderError(container, JSON.stringify(res.errors, null, 2));
        return;
      }
      renderList(container, res.data.newsItems.nodes, "news");
    })
    .catch(err => renderError(container, err));
  }

  function loadSiteUpdates() {
    const container = document.getElementById("site-updates");
    if (!container) return;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          {
            posts(first: 5, where: { status: PUBLISH }) {
              nodes {
                title
                slug
              }
            }
          }
        `
      })
    })
    .then(res => res.json())
    .then(res => {
      if (res.errors) {
        renderError(container, JSON.stringify(res.errors, null, 2));
        return;
      }
      renderList(container, res.data.posts.nodes, "post");
    })
    .catch(err => renderError(container, err));
  }

  /* ===============================
     Load article view
     =============================== */
  function loadArticle(slug, type, push = true) {
    if (!app) return;

    if (push) {
      history.pushState({ slug, type }, "", `/${type}/${slug}`);
    }

    app.innerHTML = "<p>Loading article…</p>";

    const query =
      type === "news"
        ? `{ newsItemBy(slug: "${slug}") { title content } }`
        : `{ postBy(slug: "${slug}") { title content } }`;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    })
    .then(res => res.json())
    .then(res => {
      const item =
        type === "news"
          ? res.data.newsItemBy
          : res.data.postBy;

      if (!item) {
        app.innerHTML = "<h1>Not found</h1>";
        return;
      }

      app.innerHTML = `
        <a href="/" class="back-link" id="back-home">← Back</a>
        <article>
          <h1>${item.title}</h1>
          ${item.content}
        </article>
      `;

      const back = document.getElementById("back-home");
      if (back) {
        back.addEventListener("click", e => {
          e.preventDefault();
          history.pushState({}, "", "/");
          restoreHome();
        });
      }
    })
    .catch(err => {
      app.innerHTML = "<div class='error'>" + err + "</div>";
    });
  }

  function restoreHome() {
    if (!app || !home) return;

    app.innerHTML = "";
    app.appendChild(home);
    loadLocalNews();
    loadSiteUpdates();
  }

  /* ===============================
     Event handlers
     =============================== */
  document.addEventListener("click", e => {
    const link = e.target.closest("[data-slug]");
    if (!link) return;

    e.preventDefault();
    loadArticle(link.dataset.slug, link.dataset.type);
  });

  window.addEventListener("popstate", e => {
    if (e.state && e.state.slug) {
      loadArticle(e.state.slug, e.state.type, false);
    } else {
      restoreHome();
    }
  });

  /* ===============================
     Initial load
     =============================== */
  loadLocalNews();
  loadSiteUpdates();

});
/* ===============================
     business page map initialization
     =============================== */

async function initMap() {
  const response = await fetch("https://cms.fountainlake.net/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query {
          businesses(first: 100, where: { status: PUBLISH }) {
            nodes {
              title
              slug
              businessFields {
                category
                website
                phone
                location {
                  latitude
                  longitude
                  streetAddress
                  city
                  stateShort
                  postCode
                }
              }
            }
          }
        }
      `,
    }),
  });

  const result = await response.json();
  const businesses = result.data.businesses.nodes;

  // Center on Fountain Lake area
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: { lat: 34.58, lng: -92.98 },
  });

  businesses.forEach((biz) => {
    const loc = biz.businessFields.location;
    if (!loc || !loc.latitude || !loc.longitude) return;

    const marker = new google.maps.Marker({
      position: {
        lat: loc.latitude,
        lng: loc.longitude,
      },
      map,
      title: biz.title,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <strong>${biz.title}</strong><br>
        ${loc.streetAddress || ""}<br>
        ${loc.city || ""} ${loc.stateShort || ""} ${loc.postCode || ""}<br>
        ${biz.businessFields.phone || ""}<br>
        ${
          biz.businessFields.website
            ? `<a href="${biz.businessFields.website}" target="_blank">Website</a>`
            : ""
        }
      `,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });
  });
}
const GRAPHQL_ENDPOINT = "https://cms.fountainlake.net/graphql";

async function loadBusinesses() {
  const query = `
    query {
      businesses(first: 50, where: { status: PUBLISH }) {
        nodes {
          title
          slug
          businessFields {
            category
            description
            website
            phone
            location {
              city
              stateShort
              postCode
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const json = await res.json();
    const businesses = json.data.businesses.nodes;

    renderBusinesses(businesses);
  } catch (err) {
    document.getElementById("business-list").innerHTML =
      "<p class='muted'>Failed to load businesses.</p>";
    console.error(err);
  }
}

function renderBusinesses(businesses) {
  const container = document.getElementById("business-list");

  if (!businesses.length) {
    container.innerHTML = "<p class='muted'>No businesses found.</p>";
    return;
  }

  container.innerHTML = businesses.map(biz => `
    <article class="business-card">
      <h3>${biz.title}</h3>

      <p class="category">${biz.businessFields.category?.join(", ") || ""}</p>

      <p>${biz.businessFields.description || ""}</p>

      <p class="meta">
        ${biz.businessFields.location?.city || ""} ${biz.businessFields.location?.stateShort || ""}
      </p>

      <div class="actions">
        <a href="/business/${biz.slug}/">View Details</a>
        ${biz.businessFields.website ? `<a href="${biz.businessFields.website}" target="_blank">Website</a>` : ""}
      </div>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", loadBusinesses);
const navHTML = `
<header class="site-header">
  <div class="container header-inner">
    <a href="/" class="brand">Fountain Lake <span>Network</span></a>
    <nav>
      <ul class="nav-list">
        <li><a href="/" class="nav-link">Home</a></li>
        <li><a href="/news/" class="nav-link">News</a></li>
        <li><a href="/school/" class="nav-link">School</a></li>
        <li><a href="/events/" class="nav-link">Events</a></li>
        <li><a href="/business/" class="nav-link">Business</a></li>
      </ul>
    </nav>
  </div>
</header>
`;

// Insert header at the top of the body
document.body.insertAdjacentHTML('afterbegin', navHTML);

// Highlight current page
const currentPath = window.location.pathname;
document.querySelectorAll('.nav-link').forEach(link => {
  if (link.getAttribute('href') === currentPath || (currentPath.includes(link.getAttribute('href')) && link.getAttribute('href') !== '/')) {
    link.classList.add('active');
  }
});