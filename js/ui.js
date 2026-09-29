// DOM slānis: no API datiem veido HTML elementus un ievieto tos lapā.
const UI = (() => {
    const STATUSES = { 1: 'public', 2: 'private' };
    const STATUS_LABELS = { public: 'Publisks', private: 'Privāts' };

    // el('p', { class: 'x' }, 'teksts', citsElements) -> <p class="x">teksts…</p>
    // Teksts tiek ievietots kā textNode, tāpēc lietotāja ievadītais HTML netiek izpildīts.
    function el(tag, attrs = {}, ...children) {
        const node = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
            if (value === undefined || value === null || value === false) continue;
            if (key === 'class') node.className = value;
            else if (key === 'dataset') Object.assign(node.dataset, value);
            else node.setAttribute(key, value === true ? '' : value);
        }
        for (const child of children.flat(Infinity)) {
            if (child === undefined || child === null || child === false) continue;
            node.append(child instanceof Node ? child : String(child));
        }
        return node;
    }

    function formatDate(iso) {
        return iso ? new Date(iso).toLocaleString('lv-LV', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    }

    function statusName(id) {
        return STATUSES[id] ?? `#${id}`;
    }

    function statusBadge(id) {
        const name = statusName(id);
        return el('span', { class: `badge badge-${name}` }, STATUS_LABELS[name] ?? name);
    }

    // Krāsains aplītis ar burtu vai numuru – krāsa atkarīga no lietotāja ID
    function avatar(label, id, size = '') {
        const hue = (Number(id) * 67) % 360;
        return el('span', { class: `avatar ${size}`, style: `--hue:${hue}`, 'aria-hidden': 'true' }, label);
    }

    function statusSelect(currentId) {
        return el('select', { 'data-action': 'status', 'aria-label': 'Mainīt statusu' },
            Object.entries(STATUSES).map(([id, name]) =>
                el('option', { value: id, selected: Number(id) === currentId }, STATUS_LABELS[name])));
    }

    function postCard(post, user) {
        const own = Boolean(user) && user.id === post.user_id;
        return el('article', { class: 'post card', dataset: { id: post.id } },
            el('header', { class: 'post-head' },
                avatar(`#${post.user_id}`, post.user_id),
                el('div', { class: 'post-author' },
                    el('strong', {}, own ? 'Tu' : `Lietotājs #${post.user_id}`),
                    el('span', { class: 'muted' }, `${formatDate(post.created_at)} · ieraksts #${post.id}`)),
                statusBadge(post.post_status_id)),
            el('h2', { class: 'post-title' }, post.title),
            el('p', { class: 'post-body' }, post.body),
            el('footer', { class: 'post-actions' },
                el('button', { type: 'button', class: 'ghost', 'data-action': 'toggle-comments', 'aria-expanded': 'false' },
                    '💬 Komentāri'),
                own && el('span', { class: 'spacer' }),
                own && statusSelect(post.post_status_id),
                own && el('button', { type: 'button', class: 'ghost', 'data-action': 'edit' }, '✎ Rediģēt'),
                own && el('button', { type: 'button', class: 'ghost danger', 'data-action': 'delete' }, 'Dzēst')),
            el('div', { class: 'comments', hidden: true }));
    }

    function editCard(post) {
        return el('article', { class: 'post card editing', dataset: { id: post.id } },
            el('p', { class: 'editing-label' }, `Rediģē ierakstu #${post.id}`),
            el('form', { class: 'edit-form stack' },
                el('label', {}, 'Virsraksts',
                    el('input', { name: 'title', value: post.title, required: true, maxlength: 255 })),
                el('label', {}, 'Teksts',
                    el('textarea', { name: 'body', rows: 5, required: true }, post.body)),
                el('div', { class: 'form-actions' },
                    el('button', { type: 'button', class: 'ghost', 'data-action': 'cancel-edit' }, 'Atcelt'),
                    el('button', { type: 'submit', class: 'primary' }, 'Saglabāt izmaiņas'))));
    }

    // Rotējoša ikona ar tekstu, ko rāda, kamēr dati tiek ielādēti
    function spinner(text) {
        return el('div', { class: 'loading-block', role: 'status' },
            el('span', { class: 'spinner', 'aria-hidden': 'true' }),
            el('span', {}, text));
    }

    function emptyState(title, text, action) {
        return el('div', { class: 'empty-state' },
            el('p', { class: 'empty-title' }, title),
            text && el('p', {}, text),
            action);
    }

    function renderPosts(container, posts, user) {
        if (posts.length === 0) {
            container.replaceChildren(emptyState('Ierakstu vēl nav', 'Esi pirmais, kas kaut ko uzraksta!',
                el('a', { href: '#new', class: 'button primary' }, '+ Jauns ieraksts')));
            return;
        }
        container.replaceChildren(...posts.map((post) => postCard(post, user)));
    }

    function commentItem(comment, user) {
        const own = Boolean(user) && user.id === comment.user_id;
        return el('li', { class: 'comment', dataset: { commentId: comment.id } },
            avatar(`#${comment.user_id}`, comment.user_id, 'small'),
            el('div', { class: 'comment-main' },
                el('p', { class: 'comment-meta' },
                    el('strong', {}, own ? 'Tu' : `Lietotājs #${comment.user_id}`),
                    el('span', { class: 'muted' }, formatDate(comment.created_at)),
                    own && el('button', { type: 'button', class: 'link danger', 'data-action': 'delete-comment' }, 'dzēst')),
                el('p', { class: 'comment-text' }, comment.content)));
    }

    function renderComments(container, comments, user) {
        const list = comments.length
            ? el('ul', { class: 'comment-list' }, comments.map((c) => commentItem(c, user)))
            : el('p', { class: 'muted' }, 'Komentāru vēl nav.');

        const form = user
            ? el('form', { class: 'comment-form' },
                el('input', { name: 'content', required: true, placeholder: 'Raksti komentāru…', 'aria-label': 'Komentārs' }),
                el('button', { type: 'submit', class: 'primary' }, 'Sūtīt'))
            : el('p', { class: 'muted' }, el('a', { href: '#account' }, 'Pieslēdzies'), ', lai komentētu.');

        container.replaceChildren(list, form);
    }

    function renderNavUser(container, user) {
        if (!user) {
            container.replaceChildren(el('a', { href: '#account', class: 'button primary small', 'data-nav': 'account' }, 'Pieslēgties'));
            return;
        }
        container.replaceChildren(
            el('a', { href: '#account', class: 'user-chip', 'data-nav': 'account', title: 'Mans konts' },
                avatar(user.name.charAt(0).toUpperCase(), user.id, 'small'),
                el('span', {}, user.name)));
    }

    function renderUser(container, user) {
        const rows = Object.entries(user).map(([key, value]) =>
            [el('dt', {}, key), el('dd', {}, value ?? '—')]);
        container.replaceChildren(
            el('div', { class: 'profile' },
                avatar(user.name.charAt(0).toUpperCase(), user.id, 'large'),
                el('div', {},
                    el('p', { class: 'profile-name' }, user.name),
                    el('p', { class: 'muted' }, `${user.email} · lietotāja ID ${user.id}`))),
            el('dl', { class: 'details' }, rows));
    }

    function logItem({ method, url, status, body, data, ms, via }) {
        const ok = status >= 200 && status < 300;
        return el('li', { class: ok ? 'ok' : 'fail' },
            el('details', {},
                el('summary', {},
                    el('span', { class: `method method-${method.toLowerCase()}` }, method),
                    el('span', { class: 'url' }, new URL(url).pathname),
                    el('span', { class: `via via-${via.toLowerCase()}`, title: 'Ar kuru metodi nosūtīts' }, via),
                    el('span', { class: 'status' }, status || 'nav savienojuma'),
                    el('span', { class: 'muted' }, `${ms} ms`),
                    el('span', { class: 'muted time' }, new Date().toLocaleTimeString('lv-LV'))),
                el('div', { class: 'log-body' },
                    body !== undefined && el('div', {},
                        el('p', { class: 'log-label' }, 'Nosūtīts'),
                        el('pre', {}, JSON.stringify(hidePasswords(body), null, 2))),
                    el('div', {},
                        el('p', { class: 'log-label' }, 'Saņemts'),
                        el('pre', {}, typeof data === 'string' ? data : JSON.stringify(data, null, 2))))));
    }

    function hidePasswords(body) {
        const copy = { ...body };
        for (const key of Object.keys(copy)) {
            if (key.startsWith('password')) copy[key] = '••••••';
        }
        return copy;
    }

    let toastTimer;
    function toast(message, type = 'ok') {
        const node = document.getElementById('toast');
        node.replaceChildren(el('span', { class: 'toast-icon' }, type === 'ok' ? '✓' : '!'), message);
        node.className = `toast toast-${type}`;
        node.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { node.hidden = true; }, 4000);
    }

    return {
        el, spinner, postCard, editCard, renderPosts, renderComments, renderNavUser,
        renderUser, logItem, toast, statusName, statusBadge,
    };
})();
