// Documentation CMS: delete confirmations and the WYSIWYG editor for content.
// The editor only makes writing easier; what is stored is decided by the server-side
// sanitizer (App\Support\DocHtml), so keep the options below in line with its allowlist.
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('form[data-confirm]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            if (!window.confirm(form.dataset.confirm)) {
                event.preventDefault();
            }
        });
    });

    const textarea = document.getElementById('doc_content');
    if (!textarea) return;

    if (typeof Jodit === 'undefined') {
        // The plain textarea still works; say so instead of failing silently.
        console.error('Documentatie: de editor (Jodit) kon niet worden geladen. De inhoud kan als HTML worden bewerkt.');
        return;
    }

    const sections = JSON.parse(textarea.dataset.sections || '[]');
    const methods = { get: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', delete: 'DELETE' };

    function currentElement(editor) {
        const node = editor.s.current();
        const element = node && (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement);
        return element && editor.editor.contains(element) ? element : null;
    }

    function listKey(control) {
        return control && control.args ? control.args[0] : null;
    }

    // Puts a block at the top level of the content, after the block that holds the caret.
    // Jodit's own insert would nest it inside the current paragraph, which is invalid for
    // <details> and <p>.
    function insertBlock(editor, block, focusTarget) {
        let anchor = currentElement(editor);
        while (anchor && anchor.parentElement !== editor.editor) {
            anchor = anchor.parentElement;
        }

        if (!anchor) {
            editor.editor.appendChild(block);
        } else if (anchor.tagName === 'P' && !anchor.textContent.trim() && !anchor.querySelector('table, hr')) {
            anchor.replaceWith(block);
        } else {
            anchor.after(block);
        }

        // Keep an empty paragraph below so writing can continue after the block.
        if (!block.nextElementSibling) {
            const paragraph = editor.createInside.element('p');
            paragraph.appendChild(editor.createInside.element('br'));
            block.after(paragraph);
        }

        editor.s.select(focusTarget, true);
        editor.synchronizeValues();
    }

    const editor = Jodit.make(textarea, {
        language: 'nl',
        height: 560,
        enter: 'p',
        toolbarAdaptive: false,
        showCharsCounter: false,
        showWordsCounter: false,
        showXPathInStatusbar: false,
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
        defaultActionOnPaste: 'insert_clear_html',
        disablePlugins: ['image', 'image-properties', 'image-processor', 'file', 'video', 'media', 'drag-and-drop', 'iframe', 'speech-recognize', 'ai-assistant', 'powered-by-jodit', 'about', 'anchor'],
        link: { noFollowCheckbox: false, openInNewTabCheckbox: false, modeClassName: false },
        // <details> is a block here; without this Jodit wraps it in a paragraph.
        wrapNodes: { exclude: new Set(['hr', 'style', 'br', 'details']) },
        controls: {
            paragraph: {
                list: Jodit.atom({ p: 'Paragraaf', h3: 'Kop 3', h4: 'Kop 4', h5: 'Kop 5', blockquote: 'Citaat', pre: 'Codeblok' })
            }
        },
        buttons: [
            'paragraph', '|',
            'bold', 'italic',
            {
                name: 'docInlineCode',
                text: 'Code',
                tooltip: 'Inline code',
                exec: function (editor) {
                    editor.s.commitStyle({ element: 'code' });
                }
            }, '|',
            'ul', 'ol', '|',
            'link',
            {
                name: 'docSectionLink',
                text: 'Verwijzing',
                tooltip: 'Link naar een ander onderdeel van de documentatie',
                list: sections.map(function (section) { return section.title; }),
                exec: function (editor, current, options) {
                    const section = sections.find(function (item) { return item.title === listKey(options.control); });
                    if (!section) return;

                    const link = editor.createInside.element('a');
                    link.setAttribute('href', section.url);
                    link.textContent = editor.s.sel && String(editor.s.sel).trim() ? String(editor.s.sel) : section.title;
                    editor.s.insertNode(link);
                    editor.synchronizeValues();
                }
            }, '|',
            'table',
            {
                name: 'docHeaderRow',
                text: 'Koprij',
                tooltip: 'Maak van de huidige tabelrij een koprij (of terug)',
                exec: function (editor) {
                    const element = currentElement(editor);
                    const row = element && element.closest('tr');
                    if (!row) return;

                    const tag = row.querySelector('th') ? 'td' : 'th';
                    Array.from(row.cells).forEach(function (cell) {
                        const replacement = editor.createInside.element(tag);
                        ['colspan', 'rowspan'].forEach(function (attribute) {
                            if (cell.hasAttribute(attribute)) {
                                replacement.setAttribute(attribute, cell.getAttribute(attribute));
                            }
                        });
                        while (cell.firstChild) {
                            replacement.appendChild(cell.firstChild);
                        }
                        cell.replaceWith(replacement);
                    });
                    editor.synchronizeValues();
                }
            },
            'hr', '|',
            {
                name: 'docEndpoint',
                text: 'Endpoint',
                tooltip: 'Regel met HTTP-methode en URL (met kopieerknop in de documentatie)',
                list: methods,
                exec: function (editor, current, options) {
                    const key = listKey(options.control);
                    if (!methods[key]) return;

                    const line = editor.createInside.element('p');
                    line.className = 'endpoint';

                    const badge = editor.createInside.element('span');
                    badge.className = 'method method-' + key;
                    badge.textContent = methods[key];

                    const url = editor.createInside.element('strong');
                    url.textContent = 'https://voorbeeld.nl/api/...';

                    line.append(badge, ' ', url);
                    insertBlock(editor, line, url);
                }
            },
            {
                name: 'docCollapsible',
                text: 'Inklapbaar',
                tooltip: 'Inklapbaar blok, bijvoorbeeld voor een lang voorbeeld',
                exec: function (editor) {
                    const details = editor.createInside.element('details');
                    details.open = true;

                    const summary = editor.createInside.element('summary');
                    summary.textContent = 'Voorbeeld (JSON)';

                    const code = editor.createInside.element('pre');
                    code.textContent = '{\n    "voorbeeld": true\n}';

                    details.append(summary, code);
                    insertBlock(editor, details, summary);
                }
            }, '|',
            'eraser', 'undo', 'redo', '|',
            'source', 'fullsize'
        ]
    });

    // Jodit copies its content to the textarea with a short delay; without this, text typed
    // just before submitting would be lost.
    textarea.form.addEventListener('submit', function () {
        textarea.value = editor.value;
    });

    // Collapsible blocks stay open while editing so their content can be reached; the
    // documentation shows them collapsed (the sanitizer drops the "open" attribute).
    function openDetails() {
        editor.editor.querySelectorAll('details:not([open])').forEach(function (details) {
            details.open = true;
        });
    }

    editor.editor.addEventListener('toggle', openDetails, true);
    editor.events.on('afterSetMode change', openDetails);
    openDetails();
});
