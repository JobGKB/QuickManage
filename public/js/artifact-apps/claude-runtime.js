/*
 * Local replacement for the Claude artifact runtime (window.claude.use(...)).
 *
 * Used by every app in config/artifact_apps.php. Implements the capabilities the
 * apps use, on top of ArtifactAppController's JSON endpoints:
 *   db        collection(c).onSnapshot/get/where(f, '==', v).get/doc(id),
 *             doc(p).onSnapshot/get/set/update/delete
 *   user      me, can, canEdit, profiles
 *   downloads save({filename, data})
 *   assets    upload(blob, {type}) -> {id, url}   (served at /<app>/_blob/<id>)
 * 'sample' (Claude AI) is not available outside Claude, so use('sample') is null.
 *
 * Realtime snapshots are emulated by polling only the collections/documents that
 * have listeners; a listener is only called when its data actually changed.
 */
(function () {
    'use strict';

    const cfg = window.ARTIFACT_RUNTIME || {};
    const API = String(cfg.api || '').replace(/\/$/, '');
    const POLL_MS = cfg.pollInterval || 15000;
    const ENABLED = new Set(cfg.capabilities || ['db', 'user', 'downloads']);
    const PATH_RE = /^[A-Za-z0-9_-]{1,64}\/[^/]{1,200}$/;
    const KEEPALIVE_MAX = 60000; // browsers cap keepalive request bodies at 64 KB

    const fail = (code, message) => Object.assign(new Error(message), { code });
    const clone = v => (v === undefined || v === null ? v : structuredClone(v));
    const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || '';

    async function request(method, url, body, extra = {}) {
        const isForm = body instanceof FormData;
        const headers = { Accept: 'application/json', 'X-CSRF-TOKEN': csrf(), 'X-Requested-With': 'XMLHttpRequest' };
        if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
        const payload = body === undefined || isForm ? body : JSON.stringify(body);
        let res;
        try {
            res = await fetch(url, {
                method, headers, body: payload, credentials: 'same-origin',
                keepalive: !!extra.keepalive && typeof payload === 'string' && payload.length < KEEPALIVE_MAX,
            });
        } catch (e) {
            throw fail('unavailable', 'server niet bereikbaar');
        }
        if (res.status === 401 || res.status === 419) throw fail('unauthenticated', 'sessie verlopen, herlaad de pagina');
        let json = null;
        try { json = await res.json(); } catch (e) { /* empty body */ }
        if (!res.ok) throw fail(json?.code || (res.status === 403 ? 'permission_denied' : 'unknown'), json?.message || 'fout ' + res.status);
        return json;
    }

    const qs = params => {
        const u = new URLSearchParams();
        for (const [k, v] of params) if (v !== undefined && v !== null) u.append(k, v);
        return u.toString();
    };

    /* ---------- db ---------- */

    let version = null;
    let colCache = new Map(); // collection -> {id: data}, valid for `version`
    let docCache = new Map(); // "col/id"   -> data | null, valid for `version`
    let pendingWrites = 0;
    let writeSeq = 0;         // bumps on every write start/end, so stale poll results are discarded
    let timer = null, polling = false, pollAgain = false;
    const listeners = new Set(); // {kind: 'col'|'doc', name, next, error, last, delivered}

    const docSnap = (path, data) => ({
        id: path.split('/').pop(), ref: { path }, exists: data !== undefined && data !== null,
        data: () => (data === null ? undefined : clone(data)), metadata: { hasPendingWrites: false, fromCache: false },
    });
    const colSnap = (name, docs) => {
        const ids = Object.keys(docs).sort();
        return {
            docs: ids.map(id => docSnap(name + '/' + id, docs[id])),
            size: ids.length, empty: !ids.length, docChanges: () => [],
            forEach(fn) { this.docs.forEach(fn); },
        };
    };

    function deliver() {
        for (const l of listeners) {
            const cached = l.kind === 'col' ? colCache.get(l.name) : docCache.get(l.name);
            if (cached === undefined) continue;
            const key = JSON.stringify(cached);
            if (l.delivered && key === l.last) continue;
            l.last = key;
            l.delivered = true;
            try { l.next(l.kind === 'col' ? colSnap(l.name, cached) : docSnap(l.name, cached)); } catch (e) { console.error(e); }
        }
    }

    function schedulePoll(delay) {
        clearTimeout(timer);
        timer = setTimeout(poll, delay);
    }

    async function poll() {
        if (!listeners.size) return;
        if (polling) { pollAgain = true; return; }
        const cols = [...new Set([...listeners].filter(l => l.kind === 'col').map(l => l.name))];
        const docs = [...new Set([...listeners].filter(l => l.kind === 'doc').map(l => l.name))];
        const allCached = cols.every(c => colCache.has(c)) && docs.every(d => docCache.has(d));
        if (document.hidden && allCached) { schedulePoll(POLL_MS); return; }

        polling = true;
        const seq = writeSeq;
        try {
            const query = qs([...cols.map(c => ['c[]', c]), ...docs.map(d => ['d[]', d]), ['since', allCached ? version : null]]);
            const res = await request('GET', API + '/snapshot?' + query);
            if (pendingWrites > 0 || seq !== writeSeq) {
                pollAgain = true; // a local write happened meanwhile; this result may be stale
            } else {
                if (!res.unchanged) {
                    version = res.version;
                    colCache = new Map(Object.entries(res.collections || {}));
                    docCache = new Map(Object.entries(res.docs || {}));
                }
                deliver();
            }
        } catch (e) {
            // Like Firestore: report errors only to listeners that never got data; retry the rest silently.
            for (const l of listeners) {
                if (!l.delivered && l.error) { listeners.delete(l); try { l.error(e); } catch (x) { console.error(x); } }
            }
            console.warn('[artifact-app] ophalen mislukt:', e.message);
        } finally {
            polling = false;
            if (pollAgain) { pollAgain = false; schedulePoll(250); } else schedulePoll(POLL_MS);
        }
    }

    function subscribe(kind, name, next, error) {
        const l = { kind, name, next, error, last: null, delivered: false };
        listeners.add(l);
        schedulePoll(0);
        return () => listeners.delete(l);
    }

    async function write(op, path, data) {
        if (!PATH_RE.test(path)) throw fail('invalid_argument', 'ongeldig pad: ' + path);
        if (op !== 'delete' && (data === null || typeof data !== 'object' || Array.isArray(data))) throw fail('invalid_argument', 'gegevens moeten een object zijn');
        pendingWrites++;
        writeSeq++;
        try {
            await request('POST', API + '/write', { op, path, data }, { keepalive: true });
        } finally {
            pendingWrites--;
            writeSeq++;
            if (pendingWrites === 0) schedulePoll(0);
        }
    }

    async function getDoc(path) {
        const res = await request('GET', API + '/snapshot?' + qs([['d[]', path]]));
        return docSnap(path, res.docs?.[path] ?? null);
    }

    async function getCollection(name, filters) {
        const res = await request('GET', API + '/query?' + qs([['collection', name], ['where', JSON.stringify(filters)]]));
        return colSnap(name, res.docs || {});
    }

    function collectionRef(name, filters = []) {
        return {
            id: name, path: name,
            doc: id => docRef(name + '/' + id),
            where: (field, op, value) => collectionRef(name, [...filters, [field, op, value]]),
            get: () => getCollection(name, filters),
            onSnapshot: (next, error) => {
                if (filters.length) throw fail('unimplemented', 'onSnapshot met where() wordt lokaal niet ondersteund');
                return subscribe('col', name, next, error);
            },
        };
    }

    function docRef(path) {
        path = String(path);
        return {
            id: path.split('/').pop(), path,
            get: () => getDoc(path),
            onSnapshot: (next, error) => subscribe('doc', path, next, error),
            set: data => write('set', path, data),
            update: data => write('update', path, data),
            delete: () => write('delete', path),
        };
    }

    const db = { collection: name => collectionRef(String(name)), doc: docRef };

    document.addEventListener('visibilitychange', () => { if (!document.hidden && listeners.size) schedulePoll(0); });

    /* ---------- user ---------- */

    const me = cfg.user || { id: 'lokaal', name: '', avatarUrl: '' };
    const user = {
        me: async () => ({ ...me, avatarUrl: me.avatarUrl || 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==' }),
        can: async () => true,
        canEdit: async () => true,
        profiles: async ids => {
            ids = [].concat(ids || []).filter(Boolean);
            return ids.length ? request('POST', API + '/profiles', { ids }) : {};
        },
    };

    /* ---------- downloads ---------- */

    const MIME = {
        pdf: 'application/pdf', json: 'application/json', csv: 'text/csv', txt: 'text/plain',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml',
    };
    const downloads = {
        async save({ filename = 'download', data, mimeType } = {}) {
            const ext = String(filename).split('.').pop().toLowerCase();
            const body = Array.isArray(data) ? new Uint8Array(data) : data;
            const blob = body instanceof Blob ? body : new Blob([body ?? ''], { type: mimeType || MIME[ext] || 'application/octet-stream' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 30000);
            return { status: 'saved' };
        },
    };

    /* ---------- assets ---------- */

    const assets = {
        async upload(blob, { type, name } = {}) {
            const form = new FormData();
            form.append('file', blob, name || 'upload');
            form.append('type', type || blob.type || '');
            return request('POST', API + '/assets', form);
        },
    };

    const capabilities = { db, user, downloads, assets };
    window.claude = { use: async name => (ENABLED.has(name) && capabilities[name]) || null };
})();
