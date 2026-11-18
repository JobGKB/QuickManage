document.addEventListener('DOMContentLoaded', function () {
    const sections = Array.from(document.querySelectorAll('.doc-section'));
    const menuLinks = Array.from(document.querySelectorAll('.menu a[href^="#"]'));
    const defaultSection = sections.length ? sectionKey(sections[0]) : '';

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

    // Copy buttons are added here instead of being stored in the content, so the editor
    // only has to produce plain markup (<pre>, <p class="endpoint">).
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

    function createCopyButton(target) {
        const button = document.createElement('i');
        button.className = 'fa-solid fa-copy copy-btn';
        button.setAttribute('role', 'button');
        button.setAttribute('title', 'Kopiëren');

        button.addEventListener('click', function () {
            // Line breaks written as <br> (the editor does this inside code blocks) count as newlines.
            const clone = target.cloneNode(true);
            clone.querySelectorAll('br').forEach(function (lineBreak) {
                lineBreak.replaceWith('\n');
            });

            copyText(clone.textContent.trim()).then(function () {
                button.classList.replace('fa-copy', 'fa-check');
                setTimeout(function () {
                    button.classList.replace('fa-check', 'fa-copy');
                }, 1500);
            });
        });

        return button;
    }

    // Code blocks: wrap every <pre> in a styled block with a copy button.
    document.querySelectorAll('.doc-section pre').forEach(function (pre) {
        const block = document.createElement('div');
        block.className = 'code-block';
        pre.parentNode.insertBefore(block, pre);
        block.appendChild(createCopyButton(pre));
        block.appendChild(pre);
    });

    // Endpoint lines: copy the URL (the bold or code part), not the method badge.
    document.querySelectorAll('.doc-section .endpoint').forEach(function (endpoint) {
        const target = endpoint.querySelector('strong, b, code');
        if (target) {
            endpoint.appendChild(createCopyButton(target));
        }
    });

    // External links open in a new tab; in-page links (#section) are handled above.
    document.querySelectorAll('.doc-section a[href]').forEach(function (link) {
        if (/^https?:\/\//i.test(link.getAttribute('href'))) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
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
