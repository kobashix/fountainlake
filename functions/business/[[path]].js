import { getBusinessList, getSingleBusiness } from '../utils/cms';
import { renderLayout } from '../utils/layout';

// Helper to format the Google Map object into a string
function formatAddress(loc) {
  if (!loc) return null;
  const parts = [loc.streetAddress, loc.city, loc.state].filter(Boolean);
  return parts.join(", ");
}

// Helper to format category list
function formatCategory(cat) {
  if (!cat) return "Local Business";
  if (Array.isArray(cat)) {
    return cat.map(c => (typeof c === 'object' ? c.name : c)).join(", "); 
  }
  return cat; 
}

export async function onRequest(context) {
  const { params } = context;
  const path = params.path || [];

  try {
    // --- DIRECTORY LIST ---
    if (path.length === 0) {
      console.log("Fetching Business List...");
      const businesses = await getBusinessList(50);
      
      // DEBUG: Log result to Cloudflare dashboard
      if (!businesses || businesses.length === 0) {
         console.error("No businesses found in CMS response");
         // Return a visible error page if empty, so you know it ran
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
        const address = formatAddress(acf.location);
        const cat = formatCategory(acf.category);
        
        return `
        <div class="biz-card">
          <div class="biz-logo-wrapper">
             <img src="${biz.featuredImage?.node?.sourceUrl || '/assets/img/default-logo.png'}" class="biz-logo" alt="${biz.title}">
          </div>
          <div class="biz-info">
            <h3>${biz.title}</h3>
            
            <div class="biz-meta">
              <div class="badge-sm">${cat}</div>
              ${acf.phone ? `<div>📞 ${acf.phone}</div>` : ''}
              ${address ? `<div>📍 ${address}</div>` : ''}
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
      const address = formatAddress(acf.location);
      const cat = formatCategory(acf.category);

      const content = `
        <div class="biz-profile-header">
          <div class="biz-profile-meta container">
            <img src="${biz.featuredImage?.node?.sourceUrl || '/assets/img/default-logo.png'}" class="biz-profile-logo">
            <div>
              <h1>${biz.title}</h1>
              <span class="badge">${cat}</span>
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
                ${address ? `<p><strong>Location:</strong><br>${address}<br>${acf.location?.zipCode || ''}</p>` : ''}
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
    // CRITICAL ERROR DUMP
    return new Response(`
      <div style="font-family:monospace; padding: 2rem; background: #fee; color: red; border: 2px solid red;">
        <h1>CRITICAL ERROR</h1>
        <p><strong>Message:</strong> ${err.message}</p>
        <pre>${err.stack}</pre>
      </div>
    `, { status: 500, headers: { "Content-Type": "text/html" } });
  }
}