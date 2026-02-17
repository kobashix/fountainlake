import { getPostList, getBusinessList } from './utils/cms';
import { renderLayout } from './utils/layout';

export async function onRequest(context) {
  try {
    // 1. Fetch content from ALL sections in parallel (Fast!)
    const [news, business, politics, school] = await Promise.all([
      getPostList("news", 4),      // Latest 4 News stories
      getBusinessList(4),          // Latest 4 Businesses
      getPostList("politics", 3),  // Latest 3 Politics updates
      getPostList("school", 3)     // Latest 3 School updates
    ]);

    // 2. The "Hero" Story (The very latest news item)
    const featured = news && news.length > 0 ? news[0] : null;
    const recentNews = news && news.length > 1 ? news.slice(1) : [];

    // 3. Build the Homepage HTML
    const html = `
      <style>
        /* Homepage Specific Styles */
        .section-title { font-size: 1.5rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 1.5rem; padding-bottom: 0.5rem; }
        
        .hero-card { display: grid; grid-template-columns: 1.5fr 1fr; gap: 0; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin-bottom: 4rem; }
        .hero-img { background-size: cover; background-position: center; min-height: 400px; }
        .hero-content { padding: 3rem; display: flex; flex-direction: column; justify-content: center; }
        
        .home-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem; }
        
        .biz-row { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; text-decoration: none; color: inherit; background: white; padding: 1rem; border-radius: 8px; border: 1px solid #f1f5f9; transition: transform 0.2s; }
        .biz-row:hover { transform: translateX(5px); border-color: #d4af37; }
        
        .mini-link { display: block; padding: 0.75rem 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #334155; transition: 0.2s; }
        .mini-link:hover { color: #d4af37; padding-left: 5px; }

        @media (max-width: 768px) {
          .hero-card { grid-template-columns: 1fr; }
          .hero-img { min-height: 250px; }
        }
      </style>

      <!-- HERO SECTION -->
      ${featured ? `
      <section class="hero-section">
        <div class="hero-card">
          <div class="hero-img" style="background-image: url('${featured.featuredImage?.node?.sourceUrl || '/assets/img/default.jpg'}');"></div>
          <div class="hero-content">
            <span class="badge-sm" style="align-self: flex-start; background: #d4af37; color: white;">Latest News</span>
            <h1 style="font-size: 2rem; margin: 1rem 0; line-height: 1.2;">${featured.title}</h1>
            <div class="excerpt" style="font-size: 1.1rem; color: #64748b; margin-bottom: 2rem;">${featured.excerpt}</div>
            <a href="/news/${featured.slug}" class="btn" style="align-self: start;">Read Full Story</a>
          </div>
        </div>
      </section>
      ` : ''}

      <!-- 3-COLUMN DASHBOARD -->
      <div class="home-grid">
        
        <!-- COLUMN 1: NEWS FEED -->
        <section>
          <h2 class="section-title">Community News</h2>
          <div class="feed">
            ${recentNews.map(item => `
              <article style="margin-bottom: 2rem;">
                <span class="date">${new Date(item.date).toLocaleDateString()}</span>
                <h3 style="font-size: 1.2rem; margin: 0.25rem 0;"><a href="/news/${item.slug}">${item.title}</a></h3>
              </article>
            `).join('')}
            <a href="/news" class="btn-text" style="font-weight:bold; color: #d4af37;">View All News &rarr;</a>
          </div>
        </section>

        <!-- COLUMN 2: BUSINESS SPOTLIGHT -->
        <section>
          <h2 class="section-title">Support Local</h2>
          <div class="business-feed">
            ${business && business.length > 0 ? business.map(biz => `
              <a href="/business/${biz.slug}" class="biz-row">
                <img src="${biz.featuredImage?.node?.sourceUrl || '/assets/img/default-logo.png'}" style="width: 50px; height: 50px; object-fit: contain; border-radius: 4px;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem;">${biz.title}</h4>
                  <span style="font-size: 0.75rem; color: #64748b; text-transform: uppercase;">${biz.businessFields?.category || 'Local Business'}</span>
                </div>
              </a>
            `).join('') : '<p>No businesses found.</p>'}
            <a href="/business" class="btn-text" style="font-weight:bold; color: #d4af37;">Browse Directory &rarr;</a>
          </div>
        </section>

        <!-- COLUMN 3: CIVICS & SCHOOL -->
        <section>
          <h2 class="section-title">Civics & Schools</h2>
          
          <div style="margin-bottom: 2.5rem;">
            <h3 style="font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">Politics</h3>
            ${politics && politics.length > 0 ? politics.map(post => `
              <a href="/politics/${post.slug}" class="mini-link">${post.title}</a>
            `).join('') : '<p>No updates.</p>'}
          </div>

          <div>
            <h3 style="font-size: 0.9rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">School Board</h3>
            ${school && school.length > 0 ? school.map(post => `
               <a href="/school/${post.slug}" class="mini-link">${post.title}</a>
            `).join('') : '<p>No updates.</p>'}
          </div>
        </section>

      </div>
    `;

    return new Response(renderLayout({ 
      title: "Home", 
      content: html, 
      activeTab: "/" 
    }), {
      headers: { "Content-Type": "text/html" }
    });

  } catch (err) {
    // Return a visible error page instead of a blank screen
    return new Response(`<h1>Homepage Error</h1><p>${err.message}</p><pre>${err.stack}</pre>`, {
      status: 500,
      headers: { "Content-Type": "text/html" }
    });
  }
}