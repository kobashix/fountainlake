import { getPostList, getSinglePost } from '../utils/cms';
import { renderLayout } from '../utils/layout';

export async function onRequest(context) {
  const { params } = context;
  const path = params.path || [];

  // --- SCENARIO 1: The Directory (List View) ---
  if (path.length === 0) {
    // Fetch posts from the 'business' category
    const posts = await getPostList("business", 50); // Fetch more for a directory

    const directoryGrid = posts.map(biz => `
      <div class="biz-card">
        <div class="biz-logo-wrapper">
           <img src="${biz.featuredImage?.node?.sourceUrl || '/assets/img/default-logo.png'}" alt="${biz.title}" class="biz-logo">
        </div>
        <div class="biz-info">
          <h3>${biz.title}</h3>
          <div class="biz-excerpt">${biz.excerpt.replace(/<[^>]*>?/gm, '').substring(0, 80)}...</div>
          <a href="/business/${biz.slug}" class="btn-outline">View Profile</a>
        </div>
      </div>
    `).join('');

    const content = `
      <div class="directory-header">
        <div>
          <h1>Business Directory</h1>
          <p>Support Local. Shop Fountain Lake.</p>
        </div>
        <a href="/business/submit.html" class="btn">Promote Your Business</a>
      </div>
      
      <div class="biz-grid">
        ${directoryGrid}
      </div>
    `;

    return new Response(renderLayout({ title: "Business Directory", content, activeTab: "/business" }), {
      headers: { "Content-Type": "text/html" }
    });
  }

  // --- SCENARIO 2: Business Profile (Single Page) ---
  if (path.length === 1) {
    const slug = path[0];
    // Check if user is trying to access the submit form directly
    if (slug === "submit.html" || slug === "submit") {
        return context.next(); // Let Cloudflare serve the static file
    }

    const post = await getSinglePost(slug);

    if (!post) {
      return new Response("Business Not Found", { status: 404 });
    }

    const content = `
      <div class="biz-profile-header">
        <div class="biz-profile-cover"></div> <div class="biz-profile-meta container">
          <img src="${post.featuredImage?.node?.sourceUrl || '/assets/img/default-logo.png'}" class="biz-profile-logo">
          <div class="biz-profile-text">
            <h1>${post.title}</h1>
            <span class="badge">Verified Local Business</span>
          </div>
        </div>
      </div>

      <div class="container biz-profile-body">
        <div class="biz-main-content">
           <h2>About This Business</h2>
           ${post.content}
        </div>
        <div class="biz-sidebar">
           <div class="sidebar-box">
              <h3>Contact</h3>
              <p>📍 Fountain Lake Area</p>
              <a href="#" class="btn-full">Visit Website</a>
           </div>
        </div>
      </div>
    `;

    return new Response(renderLayout({ title: post.title, content, activeTab: "/business" }), {
      headers: { "Content-Type": "text/html" }
    });
  }
}