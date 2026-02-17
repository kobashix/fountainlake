import { getBusinessList, getSingleBusiness } from '../utils/cms';
import { renderLayout } from '../utils/layout';

export async function onRequest(context) {
  const { params } = context;
  const path = params.path || [];

  // --- DIRECTORY LIST ---
  if (path.length === 0) {
    const businesses = await getBusinessList(50);

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
            ${acf.category ? `<div class="badge-sm">${acf.category}</div>` : ''}
            ${acf.phone ? `<div>📞 ${acf.phone}</div>` : ''}
            ${acf.location ? `<div>📍 ${acf.location}</div>` : ''}
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
    if (path[0] === "submit.html") return context.next();
    
    const biz = await getSingleBusiness(path[0]);
    if (!biz) return new Response("Not Found", { status: 404 });

    const acf = biz.businessFields || {};

    const content = `
      <div class="biz-profile-header">
        <div class="biz-profile-meta container">
          <img src="${biz.featuredImage?.node?.sourceUrl || '/assets/img/default-logo.png'}" class="biz-profile-logo">
          <div>
            <h1>${biz.title}</h1>
            ${acf.category ? `<span class="badge">${acf.category}</span>` : '<span class="badge">Local Business</span>'}
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
              ${acf.location ? `<p><strong>Location:</strong><br>${acf.location}</p>` : ''}
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
}