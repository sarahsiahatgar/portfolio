async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`Could not load ${file}`);
        return await response.text();
    } catch (error) {
        console.error(error);
        return "";
    }
}

export async function initNavigation() {
    const rootPath = window.location.origin;
    const [headerHtml, footerHtml] = await Promise.all([
		loadComponent("header-placeholder", "/arcade-game-pwa/pwa-header.html"),
        loadComponent("footer-placeholder", "/arcade-game-pwa/pwa-footer.html")
    ]);

    if (headerHtml) {
        const headerEl = document.getElementById("header-placeholder");
        if (headerEl) headerEl.outerHTML = headerHtml;
    }
    if (footerHtml) {
        const footerEl = document.getElementById("footer-placeholder");
        if (footerEl) footerEl.outerHTML = footerHtml;
    }

    let currentPath = window.location.pathname.split("/").pop() || "pwa-home.html";
    if (currentPath === "" || currentPath === "/") currentPath = "home";
    
    let cleanCurrent = currentPath.replace(".html", "").toLowerCase();
    if (cleanCurrent === "home") cleanCurrent = "index";

    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        let cleanHref = href.replace(".html", "").toLowerCase();
        if (cleanHref === "index") cleanHref = "index";

        if (cleanHref === cleanCurrent || (cleanCurrent === "index" && cleanHref === "index")) {
            link.classList.add('active-tab');
        }
    });

    const yearSpan = document.getElementById("currentYear");
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    const backToTopBtn = document.getElementById('backToTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}