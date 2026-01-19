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
