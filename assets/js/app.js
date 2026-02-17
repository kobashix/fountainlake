document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("content-feed");
  if (!container) return; // Not a feed page

  // 1. Determine Page Type based on URL
  // e.g., fountainlake.net/business/ -> type = "business"
  const path = window.location.pathname.replace(/\//g, ""); 
  const type = path || "news"; // Default homepage to news

  // 2. Load Data
  container.innerHTML = `<div class="spinner">Loading ${type}...</div>`;

  fetch(`/api/content?type=${type}`)
    .then(res => res.json())
    .then(items => {
      if (items.error || items.length === 0) {
        container.innerHTML = `<p>No recent ${type} found.</p>`;
        return;
      }

      // 3. Render Cards
      container.innerHTML = items.map(item => `
        <article class="card">
          <div class="card-img" style="background-image: url('${item.image}')"></div>
          <div class="card-body">
            <span class="date">${item.date}</span>
            <h3><a href="${item.link}">${item.title}</a></h3>
            <p>${item.summary}</p>
          </div>
        </article>
      `).join("");
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<p>Error loading content. Please try again.</p>`;
    });
});