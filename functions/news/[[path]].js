import { getPostList, getSinglePost } from '../utils/cms';
import { renderLayout } from '../utils/layout';

export async function onRequest(context) {
  const { params } = context;
  const path = params.path || [];

  // --- SCENARIO 1: The News Homepage (/news) ---
  if (path.length === 0) {
    const posts = await getPostList("news");

    if (posts.length === 0) {
      return new Response(renderLayout({
        title: "News",
        activeTab: "/news",
        content: `<h1>No News Yet</h1><p>Check back soon for updates.</p>`
      }), { headers: { "Content-Type": "text/html" } });
    }

    const cards = posts.map(post => `
      <article class="card">
        <div class="card-img" style="background-image: url('${post.featuredImage?.node?.sourceUrl || ''}')"></div>
        <div class="card-body">
          <span class="date">${new Date(post.date).toLocaleDateString()}</span>
          <h2><a href="/news/${post.slug}">${post.title}</a></h2>
          <div class="excerpt">${post.excerpt}</div>
        </div>
      </article>
    `).join('');

    const content = `
      <h1 style="margin-bottom: 2rem; border-bottom: 2px solid #d4af37; display: inline-block; padding-bottom: 0.5rem;">Latest News</h1>
      <div class="grid">${cards}</div>
    `;

    return new Response(renderLayout({ title: "News", content, activeTab: "/news" }), {
      headers: { "Content-Type": "text/html" }
    });
  }

  // --- SCENARIO 2: A Single Article (/news/some-headline) ---
  if (path.length === 1) {
    const slug = path[0];
    const post = await getSinglePost(slug);

    if (!post) {
      return new Response("Article Not Found", { status: 404 });
    }

    const content = `
      <div class="article-header">
        <h1>${post.title}</h1>
        <span class="date" style="color: #64748b;">Published ${new Date(post.date).toLocaleDateString()}</span>
      </div>
      <article class="article-body">
        ${post.featuredImage ? `<img src="${post.featuredImage.node.sourceUrl}" alt="${post.title}" style="width:100%; margin-bottom: 2rem;">` : ''}
        ${post.content}
      </article>
    `;

    return new Response(renderLayout({ title: post.title, content, activeTab: "/news" }), {
      headers: { "Content-Type": "text/html" }
    });
  }
}