import { getBusinessList, getSingleBusiness } from '../utils/cms';
import { renderLayout } from '../utils/layout';

export async function onRequest(context) {
  const { params } = context;
  const path = params.path || [];

  try {
    // --- DIRECTORY LIST ---
    if (path.length === 0) {
      const businesses = await getBusinessList(50);
      
      // DEBUG: If empty, show a visible message
      if (!businesses || businesses.length === 0) {
         return new Response(renderLayout({
             title: "Directory Empty",
             activeTab: "/business",
             content: `<div class="container" style="padding: 4rem; text-align: center;">
                <h1>No Businesses Found</h1>
                <p>The API connected but returned 0 results. Check WordPress status (Draft vs Publish).</p>
             </div>`
         }), { headers: { "Content-Type": "text/html" } });
      }

      const cards = businesses.map(biz => {
        const acf = biz.businessFields || {};
        
        return `
        <div class="biz-card">
          <div class="biz-logo-wrapper">
             <img src="${biz.featuredImage?.node?.sourceUrl || '/assets/img/default-logo.png'}" class="biz-logo" alt="${biz.title}">
          </div>
          <div class="biz-info">
            <h3>${biz.title}</h3>
            
            <div class="biz-meta">
              ${acf.phone ? `<div>📞 ${acf.phone}</div>` : ''}
              ${acf.website ? `<div>🌐 <a href="${acf.website}" target="_blank">Website</a></div>` : ''}
            </div>

            <a href="/business/${biz.slug}" class="btn-outline">View Profile</a>
          </div>
        </div>
      `}).join('');

      const content = `
        <div class="directory-header">
          <h1>Business Directory</h1>
          <a href="/business/submit.html" class="btn">Promote Your Business</a>
        </div>
        <div class="biz-grid">${cards}</div>
      `;

      return new Response(renderLayout({ title: "Business Directory", content, activeTab: "/business" }), {
        headers: { "Content-Type": "text/html" }
      });
    }

    // --- SINGLE PROFILE ---
    if (path.length === 1) {
      const slug = path[0];
      if (slug === "submit.html") return context.next();
      
      const biz = await getSingleBusiness(slug);
      
      if (!biz) {
        return new Response(`<h1>Business Not Found: ${slug}</h1>`, { status: 404, headers: {"Content-Type": "text/html"} });
      }

      const acf = biz.businessFields || {};

      const content = `
        <div class="biz-profile-header">
          <div class="biz-profile-meta container">
            <img src="${biz.featuredImage?.node?.sourceUrl || '/assets/img/default-logo.png'}" class="biz-profile-logo">
            <div>
              <h1>${biz.title}</h1>
              <span class="badge">Local Business</span>
            </div>
          </div>
        </div>

        <div class="container biz-profile-body">
          <div class="biz-main">
             <h2>About</h2>
             ${acf.description ? `<p>${acf.description}</p>` : (biz.content || "<p>No description provided.</p>")}
          </div>
          <div class="biz-sidebar">
             <div class="sidebar-box">
                <h3>Contact Info</h3>
                ${acf.phone ? `<p><strong>Phone:</strong><br><a href="tel:${acf.phone}">${acf.phone}</a></p>` : ''}
                ${acf.website ? `<a href="${acf.website}" target="_blank" class="btn-full">Visit Website</a>` : ''}
             </div>
          </div>
        </div>
      `;

      return new Response(renderLayout({ title: biz.title, content, activeTab: "/business" }), {
        headers: { "Content-Type": "text/html" }
      });
    }
    
    return new Response("Invalid Path", { status: 400 });

  } catch (err) {
    // RAW ERROR DUMP: This puts the error right on the screen so you can see it.
    return new Response(`
      <div style="font-family:monospace; padding: 2rem; background: #fee; color: red; border: 2px solid red;">
        <h1>CRITICAL ERROR</h1>
        <p><strong>Message:</strong> ${err.message}</p>
        <pre>${err.stack}</pre>
      </div>
    `, { status: 500, headers: { "Content-Type": "text/html" } });
  }
}