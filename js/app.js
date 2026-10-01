// Notikumu apstrāde: lietotāja darbība -> AJAX pieprasījums -> DOM atjaunošana.
(() => {
    const $ = (selector) => document.querySelector(selector);
    const postsEl = $('#posts');
    const logEl = $('#log');
    const MAX_LOG_ITEMS = 100;
    const VIEWS = ['posts', 'new', 'roles', 'account', 'log'];

    const state = {
        user: Api.store.get('user'),
        posts: new Map(), // id -> ieraksts
        logCount: 0,
    };

    // ---------- Palīgfunkcijas ----------

    // Izpilda API izsaukumu, bloķē pogu, parāda kļūdu. Kļūdas gadījumā atgriež undefined.
    async function run(button, task, successMessage) {
        if (button) {
            button.disabled = true;
            button.classList.add('loading'); // parāda spinneri pogā
        }
        try {
            const result = await task();
            if (successMessage) UI.toast(successMessage, 'ok');
            return result ?? true;
        } catch (error) {
            if (error.status === 401 && state.user) {
                setSession(null, null);
                UI.toast('Sesija beigusies, pieslēdzies no jauna.', 'error');
            } else {
                UI.toast(error.message, 'error');
            }
            return undefined;
        } finally {
            if (button) {
                button.disabled = false;
                button.classList.remove('loading');
            }
        }
    }

    function formData(form) {
        return Object.fromEntries(new FormData(form));
    }

    function findCard(id) {
        return postsEl.querySelector(`.post[data-id="${id}"]`);
    }

    // ---------- Navigācija (bez lapas pārlādes, ar #hash) ----------

    function currentView() {
        const name = location.hash.slice(1);
        return VIEWS.includes(name) ? name : 'posts';
    }

    function showView() {
        const view = currentView();
        document.querySelectorAll('.view').forEach((section) => {
            section.hidden = section.dataset.view !== view;
        });
        document.querySelectorAll('[data-nav]').forEach((link) => {
            link.classList.toggle('active', link.dataset.nav === view);
        });
        closeMenu();
        window.scrollTo(0, 0);

        if (view === 'account' && state.user) loadProfile();
        if (view === 'log') markLogSeen();
    }

    window.addEventListener('hashchange', showView);

    function go(view) {
        if (location.hash === `#${view}`) showView();
        else location.hash = view;
    }

    // Mobilā izvēlne
    const navToggle = $('#nav-toggle');
    function closeMenu() {
        document.body.classList.remove('menu-open');
        navToggle.setAttribute('aria-expanded', 'false');
    }
    navToggle.addEventListener('click', () => {
        const open = document.body.classList.toggle('menu-open');
        navToggle.setAttribute('aria-expanded', String(open));
    });

    // ---------- Sesija ----------

    function setSession(user, token) {
        state.user = user;
        Api.setToken(token);
        if (user) Api.store.set('user', user);
        else Api.store.remove('user');
        renderAuthState();
        // Saraksts atkarīgs no lietotāja: privātos ierakstus redz tikai to autors,
        // un pogas "Rediģēt"/"Dzēst" parādās tikai pašu ierakstiem
        loadPosts();
    }

    function renderAuthState() {
        const loggedIn = Boolean(state.user);
        UI.renderNavUser($('#nav-user'), state.user);
        $('#auth-box').hidden = loggedIn;
        $('#profile-box').hidden = !loggedIn;

        // Formas, kurām vajag tokenu, aizstājam ar paziņojumu
        document.querySelectorAll('[data-requires-auth]').forEach((card) => {
            let notice = card.previousElementSibling;
            if (!notice?.classList.contains('notice')) {
                notice = $('#auth-required').content.firstElementChild.cloneNode(true);
                card.before(notice);
            }
            notice.hidden = loggedIn;
            card.hidden = !loggedIn;
        });

        // Aktīvā saite navigācijā var būt jaunizveidota
        document.querySelectorAll('[data-nav]').forEach((link) => {
            link.classList.toggle('active', link.dataset.nav === currentView());
        });
    }

    // ---------- Ielādes indikators (josla augšā) ----------

    const progressEl = $('#progress');
    const MIN_PROGRESS_MS = 400; // lai josla nenomirgo, ja atbilde atnāk ļoti ātri
    let progressShownAt = 0;
    let progressTimer;

    Api.onLoading = (pending) => {
        clearTimeout(progressTimer);
        if (pending > 0) {
            if (progressEl.hidden) progressShownAt = Date.now();
            progressEl.hidden = false;
            return;
        }
        const wait = Math.max(0, MIN_PROGRESS_MS - (Date.now() - progressShownAt));
        progressTimer = setTimeout(() => { progressEl.hidden = true; }, wait);
    };

    // ---------- AJAX metode (fetch / XMLHttpRequest) ----------

    const METHOD_NAMES = { fetch: 'fetch (async/await)', xhr: 'XMLHttpRequest' };

    document.querySelectorAll('input[name="ajax-method"]').forEach((radio) => {
        radio.checked = radio.value === Api.getMethod();
        radio.addEventListener('change', () => {
            Api.setMethod(radio.value);
            UI.toast(`Pieprasījumi tagad tiek sūtīti ar: ${METHOD_NAMES[radio.value]}`);
            loadPosts(); // tas pats uzdevums, cita metode
        });
    });

    const slowToggle = $('#slow-mode');
    slowToggle.checked = Api.isSlow();
    slowToggle.addEventListener('change', () => {
        Api.setSlow(slowToggle.checked);
        UI.toast(slowToggle.checked ? 'Lēnā savienojuma simulācija ieslēgta.' : 'Lēnā savienojuma simulācija izslēgta.');
    });

    // ---------- Pieprasījumu žurnāls ----------

    Api.onLog = (entry) => {
        logEl.prepend(UI.logItem(entry));
        while (logEl.children.length > MAX_LOG_ITEMS) logEl.lastElementChild.remove();
        $('#log-empty').hidden = true;
        if (currentView() === 'log') return;
        state.logCount += 1;
        $('#log-count').textContent = state.logCount;
        $('#log-count').classList.add('has-new');
    };

    function markLogSeen() {
        state.logCount = 0;
        $('#log-count').textContent = '0';
        $('#log-count').classList.remove('has-new');
    }

    $('#clear-log').addEventListener('click', () => {
        logEl.replaceChildren();
        $('#log-empty').hidden = false;
    });

    $('#api-url').value = Api.getBaseUrl();
    $('#settings-form').addEventListener('submit', (event) => {
        event.preventDefault();
        Api.setBaseUrl($('#api-url').value);
        $('#api-url').value = Api.getBaseUrl();
        UI.toast('API adrese saglabāta.');
        loadPosts();
    });

    // ---------- Konts ----------

    document.querySelectorAll('.tab').forEach((tab) => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach((t) => {
                t.classList.toggle('active', t === tab);
                document.getElementById(t.dataset.tab).hidden = t !== tab;
            });
        });
    });

    $('#login-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = await run(event.submitter, () => Api.login(formData(form)));
        if (!data) return;
        setSession(data.user, data.token);
        form.reset();
        UI.toast(`Sveiks, ${data.user.name}!`);
        go('posts');
    });

    $('#register-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = await run(event.submitter, () => Api.register(formData(form)));
        if (!data) return;
        setSession(data.user, data.token);
        form.reset();
        UI.toast(`Konts izveidots. Sveiks, ${data.user.name}!`);
        go('posts');
    });

    $('#logout-btn').addEventListener('click', async (event) => {
        // Lokāli izrakstāmies arī tad, ja serveris tokenu vairs neatpazīst
        await run(event.currentTarget, () => Api.logout(), 'Tu esi izrakstījies.');
        setSession(null, null);
        go('posts');
    });

    async function loadProfile() {
        const user = await run(null, () => Api.me());
        if (user) UI.renderUser($('#me-output'), user);
    }

    // ---------- Ieraksti ----------

    function renderAllPosts() {
        const posts = [...state.posts.values()].reverse();
        UI.renderPosts(postsEl, posts, state.user);
        updateSummary(`${posts.length} ${posts.length === 1 ? 'ieraksts' : 'ieraksti'}`);
    }

    function updateSummary(text) {
        $('#posts-summary').textContent = text;
    }

    async function loadPosts(button) {
        postsEl.replaceChildren(UI.spinner('Ielādē ierakstus…'));
        const posts = await run(button, () => Api.getPosts());
        if (!posts) {
            postsEl.replaceChildren(UI.el('div', { class: 'empty-state' },
                UI.el('p', { class: 'empty-title' }, 'Neizdevās ielādēt ierakstus'),
                UI.el('p', {}, 'Pārbaudi, vai API darbojas, un adresi sadaļā „Pieprasījumi”.')));
            return;
        }
        state.posts = new Map(posts.map((post) => [post.id, post]));
        renderAllPosts();
    }

    $('#reload-btn').addEventListener('click', (event) => {
        $('#find-form').reset();
        loadPosts(event.currentTarget);
    });

    $('#find-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = formData(event.currentTarget).id;
        const post = await run(event.submitter, () => Api.getPost(id));
        if (!post) return;
        state.posts.set(post.id, post);
        UI.renderPosts(postsEl, [post], state.user);
        updateSummary(`Atrasts ieraksts #${post.id}`);
    });

    $('#post-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const created = await run(event.submitter, () => Api.createPost(formData(form)), 'Ieraksts publicēts.');
        if (!created) return;
        // POST atbildē nav post_status_id, bet datubāzē noklusējums ir 1 (public)
        state.posts.set(created.id, { post_status_id: 1, ...created });
        form.reset();
        renderAllPosts();
        go('posts');
        findCard(created.id)?.classList.add('highlight');
    });

    // Viens klikšķu klausītājs visām ierakstu kartītēm (notikumu deleģēšana)
    postsEl.addEventListener('click', async (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const card = button.closest('.post');
        const id = Number(card.dataset.id);
        const post = state.posts.get(id);

        switch (button.dataset.action) {
            case 'toggle-comments': {
                const box = card.querySelector('.comments');
                if (!box.hidden) {
                    box.hidden = true;
                    button.setAttribute('aria-expanded', 'false');
                    return;
                }
                box.replaceChildren(UI.spinner('Ielādē komentārus…'));
                box.hidden = false;
                button.setAttribute('aria-expanded', 'true');
                if (await loadComments(box, id, button)) {
                    box.querySelector('input')?.focus();
                } else {
                    box.hidden = true;
                    button.setAttribute('aria-expanded', 'false');
                }
                break;
            }
            case 'edit':
                card.replaceWith(UI.editCard(post));
                findCard(id).querySelector('input').focus();
                break;
            case 'cancel-edit':
                card.replaceWith(UI.postCard(post, state.user));
                break;
            case 'delete': {
                if (!confirm(`Vai tiešām dzēst ierakstu „${post.title}”?`)) return;
                const ok = await run(button, () => Api.deletePost(id), 'Ieraksts izdzēsts.');
                if (!ok) return;
                state.posts.delete(id);
                card.classList.add('removing');
                card.addEventListener('animationend', () => {
                    card.remove();
                    if (!postsEl.children.length) renderAllPosts();
                }, { once: true });
                updateSummary(`${state.posts.size} ${state.posts.size === 1 ? 'ieraksts' : 'ieraksti'}`);
                break;
            }
            case 'delete-comment': {
                const commentId = button.closest('li').dataset.commentId;
                const ok = await run(button, () => Api.deleteComment(id, commentId), 'Komentārs izdzēsts.');
                if (ok) await loadComments(card.querySelector('.comments'), id);
                break;
            }
        }
    });

    // Statusa maiņa (public/private)
    postsEl.addEventListener('change', async (event) => {
        const select = event.target.closest('select[data-action="status"]');
        if (!select) return;
        const card = select.closest('.post');
        const id = Number(card.dataset.id);
        const statusId = Number(select.value);

        const updated = await run(select, () => Api.setPostStatus(id, statusId), 'Statuss nomainīts.');
        if (!updated) {
            select.value = state.posts.get(id).post_status_id; // atgriežam iepriekšējo vērtību
            return;
        }
        state.posts.set(id, { ...state.posts.get(id), post_status_id: updated.post_status_id });
        card.querySelector('.badge').replaceWith(UI.statusBadge(updated.post_status_id));
    });

    // Rediģēšanas un komentāru formas kartītēs
    postsEl.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.target;
        const card = form.closest('.post');
        const id = Number(card.dataset.id);

        if (form.classList.contains('edit-form')) {
            const updated = await run(event.submitter, () => Api.updatePost(id, formData(form)), 'Izmaiņas saglabātas.');
            if (!updated) return;
            state.posts.set(id, updated);
            card.replaceWith(UI.postCard(updated, state.user));
        }

        if (form.classList.contains('comment-form')) {
            const { content } = formData(form);
            const created = await run(event.submitter, () => Api.createComment(id, content), 'Komentārs pievienots.');
            if (created) {
                const box = card.querySelector('.comments');
                await loadComments(box, id);
                box.querySelector('input')?.focus();
            }
        }
    });

    async function loadComments(box, postId, button) {
        const comments = await run(button, () => Api.getComments(postId));
        if (!comments) return false;
        UI.renderComments(box, comments, state.user);
        return true;
    }

    // ---------- Lomas ----------

    $('#role-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const { user_id, role_id } = formData(event.currentTarget);
        const action = event.submitter.value === 'remove' ? Api.removeRole : Api.assignRole;
        const result = await run(event.submitter, () => action(user_id, Number(role_id)));
        if (result) UI.toast(result.message);
    });

    // ---------- Starts ----------

    renderAuthState();
    showView();
    loadPosts();
})();
