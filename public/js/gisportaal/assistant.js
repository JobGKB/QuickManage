/**
 * GIS Portaal - AI assistant toggle + chatbox.
 *
 * Clicking the crow button toggles:
 *  - the two crow SVGs (professor <-> groet)
 *  - the chatbox open/closed
 */
(function () {
    const toggle = document.getElementById('assistantToggle');
    const chat = document.getElementById('assistantChat');
    const closeBtn = document.getElementById('assistantChatClose');
    const professor = document.querySelector('.assistant-icon-professor');
    const groet = document.querySelector('.assistant-icon-groet');
    const form = document.getElementById('assistantChatForm');
    const input = document.getElementById('assistantChatText');
    const messages = document.getElementById('assistantChatMessages');

    if (!toggle || !chat) {
        return;
    }

    // Source for the bot avatar shown in front of each bot message.
    const botAvatarSrc = professor ? professor.getAttribute('src') : '';

    let open = false;

    function setOpen(state) {
        open = state;
        chat.style.display = open ? 'flex' : 'none';
        // Swap the crow image: groet while open, professor while closed.
        if (professor) professor.style.display = open ? 'none' : 'block';
        if (groet) groet.style.display = open ? 'block' : 'none';
        toggle.setAttribute('aria-label', open ? 'AI-assistent sluiten' : 'AI-assistent openen');
        if (open && input) input.focus();
    }

    toggle.addEventListener('click', function () {
        setOpen(!open);
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            setOpen(false);
        });
    }

    function addMessage(text, sender) {
        if (!messages) return null;

        const row = document.createElement('div');
        row.className = 'assistant-row assistant-row-' + sender;

        if (sender === 'bot' && botAvatarSrc) {
            const avatar = document.createElement('img');
            avatar.className = 'assistant-avatar';
            avatar.src = botAvatarSrc;
            avatar.alt = '';
            row.appendChild(avatar);
        }

        const div = document.createElement('div');
        div.className = 'assistant-msg assistant-msg-' + sender;
        if (sender === 'bot') {
            div.innerHTML = renderMarkdown(text);
        } else {
            div.textContent = text;
        }
        row.appendChild(div);

        messages.appendChild(row);
        messages.scrollTop = messages.scrollHeight;

        return div;
    }

    function setMessageText(el, text) {
        if (!el) return;
        el.classList.remove('assistant-typing');
        el.innerHTML = renderMarkdown(text);
        if (messages) messages.scrollTop = messages.scrollHeight;
    }

    /**
     * Reveal a reply word-by-word so it looks like it is streaming in.
     * The Markdown is re-rendered on every step so formatting appears as the
     * text grows. Returns immediately; the animation runs on a timer.
     */
    function streamReply(el, text) {
        if (!el) return;
        el.classList.remove('assistant-typing');

        const tokens = String(text == null ? '' : text).split(/(\s+)/); // keep whitespace
        let i = 0;
        let shown = '';

        function step() {
            if (i >= tokens.length) return;
            shown += tokens[i++];
            el.innerHTML = renderMarkdown(shown);
            if (messages) messages.scrollTop = messages.scrollHeight;
            setTimeout(step, 28);
        }

        step();
    }

    /**
     * Add a bot bubble containing an animated 3-dot typing indicator.
     * Returns the message element so its content can be replaced with the
     * real reply once it arrives.
     */
    function addTypingIndicator() {
        const el = addMessage('', 'bot');
        if (el) {
            el.classList.add('assistant-typing');
            el.innerHTML =
                '<span class="assistant-dots" aria-label="Aan het typen">' +
                '<span></span><span></span><span></span></span>';
            if (messages) messages.scrollTop = messages.scrollHeight;
        }
        return el;
    }

    /**
     * Minimal, XSS-safe Markdown renderer.
     * All HTML is escaped first, then a small subset of Markdown
     * (headings, bold, italic, inline code, bullet/numbered lists) is
     * turned into tags. Only tags we generate ourselves are emitted.
     */
    function renderMarkdown(src) {
        const escaped = String(src == null ? '' : src)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        const lines = escaped.split(/\r?\n/);
        let html = '';
        let listType = null; // 'ul' | 'ol' | null

        function closeList() {
            if (listType) { html += '</' + listType + '>'; listType = null; }
        }

        function inline(text) {
            return text
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>');
        }

        for (let raw of lines) {
            const line = raw.trim();

            if (line === '') { closeList(); continue; }

            let m;
            if ((m = line.match(/^#{1,6}\s+(.*)$/))) {
                closeList();
                html += '<div class="assistant-h">' + inline(m[1]) + '</div>';
            } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
                if (listType !== 'ul') { closeList(); html += '<ul>'; listType = 'ul'; }
                html += '<li>' + inline(m[1]) + '</li>';
            } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
                if (listType !== 'ol') { closeList(); html += '<ol>'; listType = 'ol'; }
                html += '<li>' + inline(m[1]) + '</li>';
            } else {
                closeList();
                html += '<p>' + inline(line) + '</p>';
            }
        }
        closeList();

        return html || '<p></p>';
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            const text = (input.value || '').trim();
            if (!text) return;

            addMessage(text, 'user');
            input.value = '';

            sendToAssistant(text);
        });
    }

    /**
     * Send a question to the GIS Assistent backend (Claude + FME MCP) and
     * render the reply. Shows a temporary "typing" message while waiting.
     */
    function sendToAssistant(text) {
        const cfg = window.GISPortaalConfig || {};
        if (!cfg.assistantUrl) {
            addMessage('De assistent is niet correct geconfigureerd.', 'bot');
            return;
        }

        const thinking = addTypingIndicator();

        fetch(cfg.assistantUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': cfg.csrfToken || ''
            },
            body: JSON.stringify({ message: text })
        })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.json();
            })
            .then(function (data) {
                streamReply(thinking, (data && data.reply) || 'Geen antwoord ontvangen.');
            })
            .catch(function () {
                setMessageText(thinking, 'Er ging iets mis. Probeer het later opnieuw.');
            });
    }
})();
