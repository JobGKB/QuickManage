document.addEventListener('DOMContentLoaded', function () {
    const defaultSection = 'introductie';
    const sections = Array.from(document.querySelectorAll('.doc-section'));
    const menuLinks = Array.from(document.querySelectorAll('.menu a[href^="#"]'));

    function sectionKey(section) {
        return section.id.replace(/^content-/, '');
    }

    function showSection(key) {
        if (!document.getElementById('content-' + key)) {
            key = defaultSection;
        }

        sections.forEach(function (section) {
            section.style.display = sectionKey(section) === key ? 'block' : 'none';
        });

        menuLinks.forEach(function (link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + key);
        });
    }

    // All in-page links (menu + links inside the content) switch sections via the hash.
    document.addEventListener('click', function (event) {
        const link = event.target.closest('a[href^="#"]');
        if (!link) return;

        const key = link.getAttribute('href').substring(1);
        if (!document.getElementById('content-' + key)) return;

        event.preventDefault();
        history.pushState(null, '', '#' + key);
        showSection(key);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('popstate', function () {
        showSection(location.hash.substring(1));
    });

    showSection(location.hash.substring(1));

    // Copy buttons: copy the text of the element referenced by data-copy-target.
    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }

        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        return Promise.resolve();
    }

    document.querySelectorAll('.copy-btn').forEach(function (button) {
        button.addEventListener('click', function () {
            const target = document.getElementById(button.dataset.copyTarget);
            if (!target) return;

            copyText(target.textContent.trim()).then(function () {
                button.classList.replace('fa-copy', 'fa-check');
                setTimeout(function () {
                    button.classList.replace('fa-check', 'fa-copy');
                }, 1500);
            });
        });
    });

    // Toggles: open/close the code block referenced by data-toggle-target.
    document.querySelectorAll('.toggle').forEach(function (toggle) {
        const target = document.getElementById(toggle.dataset.toggleTarget);
        const icon = toggle.querySelector('.toggle-icon');
        if (!target) return;

        toggle.addEventListener('click', function () {
            const isOpen = target.classList.toggle('collapsed') === false;
            if (icon) {
                icon.classList.toggle('fa-arrow-right', !isOpen);
                icon.classList.toggle('fa-arrow-down', isOpen);
            }
        });
    });

    // Search: filter menu items on the text of their section; Enter opens the first match.
    const search = document.getElementById('doc_search');
    const noResults = document.getElementById('no_results');

    function matchingLinks(query) {
        return menuLinks.filter(function (link) {
            const section = document.getElementById('content-' + link.getAttribute('href').substring(1));
            const text = (link.textContent + ' ' + (section ? section.textContent : '')).toLowerCase();
            return text.includes(query);
        });
    }

    if (search) {
        search.addEventListener('input', function () {
            const query = search.value.trim().toLowerCase();
            const matches = matchingLinks(query);

            menuLinks.forEach(function (link) {
                link.parentElement.style.display = matches.includes(link) ? '' : 'none';
            });

            document.querySelectorAll('.menu-group').forEach(function (group) {
                const hasVisible = Array.from(group.querySelectorAll('a')).some(function (link) {
                    return matches.includes(link);
                });
                group.style.display = hasVisible ? '' : 'none';
            });

            if (noResults) {
                noResults.style.display = matches.length ? 'none' : 'block';
            }
        });

        search.addEventListener('keydown', function (event) {
            if (event.key !== 'Enter') return;

            const first = matchingLinks(search.value.trim().toLowerCase())[0];
            if (first) {
                first.click();
            }
        });
    }
});
