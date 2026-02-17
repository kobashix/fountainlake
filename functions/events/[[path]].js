import { getEventList, getSingleEvent } from '../utils/cms';
import { renderLayout } from '../utils/layout';

// Helper to format dates (e.g., "FEB 24")
function formatDateBadge(dateString) {
  const date = new Date(dateString);
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase(); // FEB
  const day = date.getDate(); // 24
  return { month, day };
}

export async function onRequest(context) {
  const { params } = context;
  const path = params.path || [];

  // --- CALENDAR VIEW (List) ---
  if (path.length === 0) {
    const events = await getEventList(20);

    const eventRows = events.map(event => {
      // Use Custom Event Date if available, otherwise Post Date
      const rawDate = event.eventFields?.eventDate || event.date;
      const { month, day } = formatDateBadge(rawDate);
      const time = event.eventFields?.eventTime || "Time TBA";
      const loc = event.eventFields?.location || "Fountain Lake Area";

      return `
        <div class="event-row">
          <div class="date-badge">
            <span class="month">${month}</span>
            <span class="day">${day}</span>
          </div>
          <div class="event-details">
            <h2><a href="/events/${event.slug}">${event.title}</a></h2>
            <div class="event-meta">
              <span>🕒 ${time}</span>
              <span>📍 ${loc}</span>
            </div>
          </div>
          <div class="event-action">
            <a href="/events/${event.slug}" class="btn-outline">Details</a>
          </div>
        </div>
      `;
    }).join('');

    const content = `
      <style>
        .event-row { display: flex; align-items: center; background: white; border-bottom: 1px solid #e2e8f0; padding: 1.5rem 0; }
        .date-badge { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 70px; height: 70px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-right: 1.5rem; text-align: center; }
        .date-badge .month { font-size: 0.8rem; color: #d4af37; font-weight: 800; text-transform: uppercase; }
        .date-badge .day { font-size: 1.8rem; font-weight: 900; line-height: 1; color: #1e293b; }
        
        .event-details { flex-grow: 1; }
        .event-details h2 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
        .event-details a { text-decoration: none; color: #1e293b; }
        .event-meta { display: flex; gap: 1.5rem; color: #64748b; font-size: 0.9rem; }
        
        .event-action { margin-left: 1rem; }

        @media (max-width: 600px) {
          .event-row { flex-wrap: wrap; }
          .event-action { width: 100%; margin: 1rem 0 0 0; }
          .btn-outline { display: block; text-align: center; }
        }
      </style>

      <div class="container">
        <h1 style="border-bottom: 2px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 2rem;">Upcoming Events</h1>
        <div class="calendar-list">
          ${events.length > 0 ? eventRows : '<p>No upcoming events scheduled.</p>'}
        </div>
      </div>
    `;

    return new Response(renderLayout({ title: "Events Calendar", content, activeTab: "/events" }), {
      headers: { "Content-Type": "text/html" }
    });
  }

  // --- SINGLE EVENT DETAILS ---
  if (path.length === 1) {
    const event = await getSingleEvent(path[0]);
    if (!event) return new Response("Event Not Found", { status: 404 });

    const rawDate = event.eventFields?.eventDate || event.date;
    const { month, day } = formatDateBadge(rawDate);
    const time = event.eventFields?.eventTime || "Time TBA";
    const loc = event.eventFields?.location || "Fountain Lake Area";

    const content = `
      <div class="event-hero" style="background: #1e293b; color: white; padding: 4rem 0; text-align: center;">
        <div class="container">
          <span style="background: #d4af37; color: black; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem;">UPCOMING EVENT</span>
          <h1 style="font-size: 2.5rem; margin: 1rem 0;">${event.title}</h1>
          <div style="font-size: 1.2rem; opacity: 0.9;">
            📅 ${month} ${day} &nbsp; • &nbsp; 🕒 ${time} &nbsp; • &nbsp; 📍 ${loc}
          </div>
        </div>
      </div>

      <div class="container" style="margin-top: 3rem; max-width: 800px;">
        ${event.featuredImage ? `<img src="${event.featuredImage.node.sourceUrl}" style="width:100%; border-radius:8px; margin-bottom:2rem;">` : ''}
        <div class="article-body">
          ${event.content}
        </div>
        
        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; text-align: center;">
          <a href="/events" class="btn-outline">&larr; Back to Calendar</a>
        </div>
      </div>
    `;

    return new Response(renderLayout({ title: event.title, content, activeTab: "/events" }), {
      headers: { "Content-Type": "text/html" }
    });
  }
}