// functions/utils/layout.js

export function renderLayout({ title, content, activeTab }) {
  const navLinks = [
    { name: "News", url: "/news" },
    { name: "Business", url: "/business" },
    { name: "Events", url: "/events" },
    { name: "Politics", url: "/politics" },
    { name: "School", url: "/school" },
    { name: "About", url: "/about" }
  ];

  const navHTML = navLinks.map(link => 
    `<a href="${link.url}" class="${activeTab === link.url ? 'active' : ''}">${link.name}</a>`
  ).join('');

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Fountain Lake Network</title>
    <link rel="stylesheet" href="/assets/css/style.css">
    
    <meta property="og:title" content="${title}">
    <meta property="og:site_name" content="Fountain Lake Network">
  </head>
  <body>
    <nav class="navbar">
      <div class="container nav-container">
        <a href="/" class="brand">FLN</a>
        <div class="nav-links">${navHTML}</div>
        <a href="/scout" class="btn-sm">Scout</a>
      </div>
    </nav>

    <main>
      ${content}
    </main>

    <footer class="footer">
      <div class="container">
        <p>&copy; ${new Date().getFullYear()} Fountain Lake Network. Built by Andrew R. Pennington.</p>
      </div>
    </footer>
  </body>
  </html>
  `;
}