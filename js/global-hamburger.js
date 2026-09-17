// js/hamburger.js

export function toggleHelpSidebar() {
  const sidebar = document.getElementById('helpSidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
  }
}

window.toggleHelpSidebar = toggleHelpSidebar;

export function initHamburger() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = navLinks.classList.toggle('active');
      hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', (event) => {
      const isClickInsideNav = navLinks.contains(event.target);
      const isClickOnHamburger = hamburgerBtn.contains(event.target);

      if (!isClickInsideNav && !isClickOnHamburger && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.querySelectorAll('.nav-item.has-dropdown').forEach((navItem) => {
    const toggle = navItem.querySelector('.nav-dropdown-toggle');
    if (!toggle) return;

    let closeTimer = null;

    function openDropdown() {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      navItem.classList.add('dropdown-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      navItem.classList.remove('dropdown-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    function scheduleClose() {
      closeTimer = setTimeout(() => {
        closeDropdown();
        closeTimer = null;
      }, 300);
    }

    navItem.addEventListener('mouseenter', openDropdown);
    navItem.addEventListener('mouseleave', scheduleClose);

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      if (navItem.classList.contains('dropdown-open')) {
        closeDropdown();
      } else {
        openDropdown();
      }
    });

    document.addEventListener('click', (event) => {
      if (!navItem.contains(event.target) && navItem.classList.contains('dropdown-open')) {
        closeDropdown();
      }
    });
  });

  document.addEventListener('click', (event) => {
    const infoIcon = document.querySelector('.info-icon');
    if (infoIcon && !infoIcon.contains(event.target)) {
      infoIcon.classList.remove('active');
    }
  });
}