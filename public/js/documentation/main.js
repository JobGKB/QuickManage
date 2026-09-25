document.addEventListener('DOMContentLoaded', function () {
    // Map each menu link (by its href) to the content section it should show.
    const sections = {
        '/docs': 'content-introduction',
        '#profielplaatjes': 'content-profielplaatjes',
        '#test': 'content-test',
    };

    const contentIds = Object.values(sections);

    function showContent(targetId) {
        contentIds.forEach(function (id) {
            const el = document.getElementById(id);
            if (el) {
                el.style.display = id === targetId ? 'block' : 'none';
            }
        });
    }

    document.querySelectorAll('.menu a').forEach(function (link) {
        const href = link.getAttribute('href');
        const targetId = sections[href];
        if (!targetId) return;

        link.addEventListener('click', function (event) {
            event.preventDefault();
            showContent(targetId);
        });
    });

    // Show the introduction section by default.
    showContent('content-introduction');

    // Copy the API URL to the clipboard when the copy icon is clicked.
    const copyApiLink = document.getElementById('copy_apiLink');
    const apiUrl = document.getElementById('api_url');
    if (copyApiLink && apiUrl) {
        copyApiLink.addEventListener('click', function () {
            const url = apiUrl.textContent.trim();

            function showCopied() {
                copyApiLink.classList.remove('fa-copy');
                copyApiLink.classList.add('fa-check');
                setTimeout(function () {
                    copyApiLink.classList.remove('fa-check');
                    copyApiLink.classList.add('fa-copy');
                }, 1500);
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(showCopied);
            } else {
                const temp = document.createElement('textarea');
                temp.value = url;
                document.body.appendChild(temp);
                temp.select();
                document.execCommand('copy');
                document.body.removeChild(temp);
                showCopied();
            }
        });
    }

    // Toggle the JSON example code block open/closed.
    const jsonToggle = document.getElementById('json_toggle');
    const jsonPre = document.getElementById('json_pre');
    const jsonToggleIcon = document.getElementById('json_toggle_icon');
    if (jsonToggle && jsonPre) {
        // Start collapsed.
        jsonPre.style.display = 'none';

        jsonToggle.addEventListener('click', function () {
            const isHidden = jsonPre.style.display === 'none';
            jsonPre.style.display = isHidden ? 'block' : 'none';

            if (jsonToggleIcon) {
                jsonToggleIcon.classList.toggle('fa-arrow-right', !isHidden);
                jsonToggleIcon.classList.toggle('fa-arrow-down', isHidden);
            }
        });
    }
});
