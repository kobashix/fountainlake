// functions/news/[[path]].js
import { getPostList, getSinglePost } from '../utils/cms';
import { renderLayout } from '../utils/layout';

export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);
  
  // path is an array. 
  // [] -> /news (Index)
  // ["my-story"] -> /news/my-story (Single Post)
  const path = params.path || [];

  try {
    // SCENARIO 1: NEWS INDEX (List View)
    if (path.length === 0) {
      const posts = await getPostList("events");
      
      const cardsHTML = posts.map(post => `
        <article class="news-card">
          <div class="card-image" style="background-image: url('${post.featuredImage?.node?.sourceUrl || '/assets/img/default.jpg'}')"></div>
          <div class="card-content">
            <span class="date">${new Date(post.date).toLocaleDateString()}</span>
            <h2><a href="/news/${post.slug}">${post.title}</a></h2>
            <div class="excerpt">${post.excerpt}</div>
          </div>
        </article>
      `).join('');

      const pageContent = `
        <header class="page-header">
          <div class="container">
            <h1>Latest News</h1>
          </div>
        </header>
        <div class="container grid-layout">
          ${cardsHTML}
        </div>
      `;

      return new Response(renderLayout({ title: "News", content: pageContent, activeTab: "/news" }), {
        headers: { "Content-Type": "text/html" }
      });
    }

    // SCENARIO 2: SINGLE POST
    if (path.length === 1) {
      const slug = path[0];
      const post = await getSinglePost(slug);

      if (!post) {
        return new Response("Post Not Found", { status: 404 });
      }

      const pageContent = `
        <article class="single-post">
          <header class="post-header" style="background-image: url('${post.featuredImage?.node?.sourceUrl || ''}')">
            <div class="header-overlay">
              <div class="container">
                <h1>${post.title}</h1>
                <span class="date">${new Date(post.date).toLocaleDateString()}</span>
              </div>
            </div>
          </header>
          <div class="container post-body">
            ${post.content}
          </div>
        </article>
      `;

      return new Response(renderLayout({ title: post.title, content: pageContent, activeTab: "/news" }), {
        headers: { "Content-Type": "text/html" }
      });
    }

  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}