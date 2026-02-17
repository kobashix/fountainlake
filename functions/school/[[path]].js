import { getPostList, getSinglePost } from '../utils/cms';
import { renderLayout } from '../utils/layout';

export async function onRequest(context) {
  const { params } = context;
  const path = params.path || [];

  // --- LIST ---
  if (path.length === 0) {
    const posts = await getPostList("school");

    const cards = posts.map(post => `
      <article class="card">
        <div class="card-img" style="background-image: url('${post.featuredImage?.node?.sourceUrl || ''}')"></div>
        <div class="card-body">
          <span class="date">${new Date(post.date).toLocaleDateString()}</span>
          <h2><a href="/school/${post.slug}">${post.title}</a></h2>
          <div class="excerpt">${post.excerpt}</div>
        </div>
      </article>
    `).join('');

    const content = `
      <h1 style="margin-bottom: 2rem;">School & Sports</h1>
      <div class="grid">${cards}</div>
    `;

    return new Response(renderLayout({ title: "School", content, activeTab: "/school" }), {
      headers: { "Content-Type": "text/html" }
    });
  }

  // --- SINGLE ---
  if (path.length === 1) {
    const slug = path[0];
    const post = await getSinglePost(slug);

    if (!post) {
      return new Response("Not Found", { status: 404 });
    }

    const content = `
      <div class="article-header">
        <h1>${post.title}</h1>
        <span class="date">Published ${new Date(post.date).toLocaleDateString()}</span>
      </div>
      <article class="article-body">
        ${post.featuredImage ? `<img src="${post.featuredImage.node.sourceUrl}" alt="${post.title}" style="width:100%; margin-bottom: 2rem;">` : ''}
        ${post.content}
      </article>
    `;

    return new Response(renderLayout({ title: post.title, content, activeTab: "/school" }), {
      headers: { "Content-Type": "text/html" }
    });
  }
}