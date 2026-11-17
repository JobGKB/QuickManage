/**
 * Dynamic FME runner: /FmeRunDynamicURL?repo=..&workspace=..&formText=..&<published parameters>
 *
 *   1. ask the server which service the workspace is registered for
 *   2. run the workspace through that service and show the result for that service
 *
 * All FME calls go through FmeAppRunningCustomWorkspace (server-side), so there is no FME token in this file.
 */
(function () {
    'use strict';

    const API = '/FmeRunDynamicURL/api';
    // Query parameters that steer this page; everything else is a published parameter for the workspace.
    const PAGE_PARAMETERS = ['repo', 'workspace', 'formText'];
    const EXTENSIONS = {
        'application/zip': 'zip',
        'application/pdf': 'pdf',
        'application/json': 'json',
        'application/xml': 'xml',
        'text/xml': 'xml',
        'text/csv': 'csv',
        'text/plain': 'txt',
        'text/html': 'html',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    };

    const query = new URLSearchParams(window.location.search);
    const repo = query.get('repo');
    const workspace = query.get('workspace');
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
    const el = id => document.getElementById(id);

    function publishedParameters() {
        const parameters = {};
        new Set(query.keys()).forEach(name => {
            if (PAGE_PARAMETERS.includes(name)) return;
            const values = query.getAll(name);
            parameters[name] = values.length > 1 ? values : values[0];
        });
        return parameters;
    }

    // ---- page state -------------------------------------------------------------------------

    function stopLoading() {
        el('loading').style.display = 'none';
        el('mess1').style.display = 'none';
    }

    // Without content the default text of the page ("Uw export is klaar!") is shown.
    function showDone(...content) {
        stopLoading();
        if (content.length) el('mess2').replaceChildren(...content);
        el('mess2').style.display = 'block';
    }

    function showError(message) {
        stopLoading();
        el('errorMessage').textContent = message;
        el('errorMessage').style.display = 'block';
    }

    function showInFrame(html) {
        stopLoading();
        // The frame is sandboxed (see the Blade view), so the FME output cannot reach this page or its session.
        el('resultFrame').srcdoc = html;
        el('resultFrame').style.display = 'block';
    }

    // ---- helpers ----------------------------------------------------------------------------

    async function request(path, options = {}) {
        const response = await fetch(API + path, {
            credentials: 'same-origin',
            ...options,
            // Asking for JSON first makes Laravel answer errors (401/422) as JSON instead of redirects.
            headers: { 'Accept': 'application/json, */*', 'X-Requested-With': 'XMLHttpRequest', ...options.headers },
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(`${path} failed with status ${response.status}: ${body.message || ''}`);
        }
        return response;
    }

    function download(url, filename = '') {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename; // empty: the browser takes the name from the response
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    function filenameOf(response, contentType) {
        const disposition = response.headers.get('content-disposition') || '';
        // Prefer RFC 5987 filename*=UTF-8''... over the plain filename.
        const encoded = disposition.match(/filename\*=(?:[\w-]+'[^']*')?([^;]+)/i);
        if (encoded) {
            try {
                return decodeURIComponent(encoded[1].trim());
            } catch (e) { /* malformed encoding: fall back to the plain filename */ }
        }
        const plain = disposition.match(/filename="?([^";]+)"?/i);
        if (plain) return plain[1].trim();

        return `${workspace.replace(/\.fmw$/i, '')}.${EXTENSIONS[contentType] || 'dat'}`;
    }

    // ---- the logic per service --------------------------------------------------------------

    const handlers = {
        // Streamed HTML goes into the iframe; anything else is saved as a file.
        async fmedatastreaming(response) {
            const contentType = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
            const isAttachment = /^\s*attachment/i.test(response.headers.get('content-disposition') || '');

            if (contentType === 'text/html' && !isAttachment) {
                showInFrame(await response.text());
                return;
            }

            const blob = await response.blob();
            if (blob.size === 0) {
                showError('De workspace heeft geen resultaat teruggegeven.');
                return;
            }
            const blobUrl = URL.createObjectURL(blob);
            download(blobUrl, filenameOf(response, contentType));
            setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
            showDone();
        },

        // FME prepared a file; the server gives us its temporary URL.
        async fmedatadownload(response) {
            const { url } = await response.json();
            if (!/^https?:\/\//i.test(url || '')) throw new Error('No download url in the response.');
            download(url);
            showDone();
        },

        async fmejobsubmitter(response) {
            const { status } = await response.json();
            const strong = document.createElement('strong');
            strong.textContent = status;
            showDone('Uw actie is uitgevoerd met status: ', strong, ' !');
        },
    };

    async function run() {
        if (!repo || !workspace) {
            showError('Error... De parameters "repo" en "workspace" ontbreken in de URL.');
            return;
        }

        let service;
        try {
            const response = await request('/services?' + new URLSearchParams({ repo, workspace }));
            ({ service } = await response.json());
        } catch (error) {
            console.error(error);
            showError('Error... Workspace kan niet worden opgehaald!');
            return;
        }

        if (!handlers[service]) {
            showDone('Er zijn geen services beschikbaar voor deze workspace...');
            return;
        }

        try {
            const response = await request('/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ repo, workspace, service, parameters: publishedParameters() }),
            });
            await handlers[service](response);
        } catch (error) {
            console.error(error);
            showError('Error... Workspace kan niet worden uitgevoerd!');
        }
    }
 
    // Only these tokens (html elements) become markup; everything else stays literal text.
    const FORM_TAGS = { b: 'strong', h1: 'h1', h2: 'h2', h3: 'h3' ,h4: 'h4'};
    const FORM_COLORS = { rood: 'red', blauw: 'blue', groen: 'green', oranje: 'orange', zwart: 'black' };
    const FORM_TOKEN = /\{(\/?)(br|b|h1|h2|h3|h4|c:([a-z]+))\}/g;

    function renderFormText(text) {
        const root = document.createDocumentFragment();
        const stack = [{ node: root, tag: null }];
        const top = () => stack[stack.length - 1];
        let last = 0;
        let match;
     


        while ((match = FORM_TOKEN.exec(text)) !== null) {
            
            const [raw, closing, tag, color] = match;
      
            top().node.append(text.slice(last, match.index)); // append(string) = text node
            last = FORM_TOKEN.lastIndex;

            if (tag === 'br') {
                if (!closing) top().node.append(document.createElement('br'));
                continue;
            }
            if (closing) {
                if (top().tag === tag) stack.pop();
                else top().node.append(raw); // unmatched closing token: show it literally
                continue;
            }

            let node;
            if (color) {
                if (!FORM_COLORS[color]) { top().node.append(raw); continue; }
                node = document.createElement('span');
                node.style.color = FORM_COLORS[color]; // value comes from the whitelist, never from the URL
            } else {
                node = document.createElement(FORM_TAGS[tag]);
            }
            top().node.append(node);
            stack.push({ node, tag });
        }
        top().node.append(text.slice(last)); // unclosed tokens are closed automatically
        return root;
    }

    el('mess').replaceChildren(renderFormText(query.get('formText') || ' '));

    run();
})();
