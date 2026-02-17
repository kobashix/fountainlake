// functions/utils/layout.js

export function renderLayout({ title, content, activeTab }) {
  // CONFIGURATION: Public Menu Items Only
  const navLinks = [
    { name: "News", url: "/news" },
    { name: "Business", url: "/business" },
    { name: "Events", url: "/events" },
    { name: "Politics", url: "/politics" },
    { name: "School", url: "/school" },
    { name: "About", url: "/about" }
  ];

  const navHTML = navLinks.map(link => 
    `<a href="${link.url}" class="${activeTab.startsWith(link.url) ? 'active' : ''}">${link.name}</a>`
  ).join('');

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Fountain Lake Network</title>
    <link rel="stylesheet" href="/assets/css/style.css">
    <style>
      /* Critical CSS for layout stability */
      body { font-family: system-ui, -apple-system, sans-serif; margin: 0; background: #f8fafc; color: #334155; }
      .navbar { background: #1e293b; padding: 1rem; color: white; position: sticky; top: 0; z-index: 50; }
      .nav-inner { max-width: 1100px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
      .brand { font-weight: 800; font-size: 1.25rem; color: #d4af37; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; }
      .nav-links a { color: #cbd5e1; text-decoration: none; margin-left: 1.5rem; font-weight: 500; transition: 0.2s; }
      .nav-links a:hover, .nav-links a.active { color: white; }
      
      main { max-width: 1100px; margin: 2rem auto; padding: 0 1rem; min-height: 80vh; }
      
      /* Grid System */
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
      .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transition: transform 0.2s; }
      .card:hover { transform: translateY(-4px); }
      .card-img { height: 200px; background: #e2e8f0; background-size: cover; background-position: center; }
      .card-body { padding: 1.5rem; }
      .card h2 { margin: 0.5rem 0; font-size: 1.25rem; }
      .card a { text-decoration: none; color: inherit; }
      .card .date { font-size: 0.8rem; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
      
      /* Single Post */
      .article-header { padding: 4rem 0; text-align: center; background: white; border-bottom: 1px solid #e2e8f0; margin-bottom: 2rem; }
      .article-body { background: white; padding: 2rem; border-radius: 8px; font-size: 1.125rem; line-height: 1.8; max-width: 800px; margin: 0 auto; }
      .article-body img { max-width: 100%; height: auto; border-radius: 4px; }
      .article-body figure { margin: 2rem 0; }
      
      footer { background: #0f172a; color: #64748b; text-align: center; padding: 2rem; margin-top: 4rem; }
    </style>
  </head>
  <body>
    <nav class="navbar">
      <div class="nav-inner">
        <a href="/" class="brand">Fountain Lake</a>
        <div class="nav-links">${navHTML}</div>
      </div>
    </nav>

    <main>
      ${content}
    </main>

    <footer>
      &copy; ${new Date().getFullYear()} Fountain Lake Network. All rights reserved.
    </footer>
  </body>
  </html>
  `;
}