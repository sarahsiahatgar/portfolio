export function initWagtailCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const wagtailCursor = document.createElement('img');
  wagtailCursor.id = 'wagtail-custom-cursor';
  wagtailCursor.src = 'img/wagtail.gif';
  wagtailCursor.alt = '';
  document.body.appendChild(wagtailCursor);

  window.addEventListener('mousemove', (e) => {
    wagtailCursor.style.display = 'block';
    wagtailCursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  });

  document.addEventListener('mouseleave', () => {
    wagtailCursor.style.display = 'none';
  });
}