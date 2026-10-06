// AJAX slānis: visi pieprasījumi uz Laravel API notiek šeit, bez lapas pārlādes.
// Vienu un to pašu uzdevumu var veikt ar divām metodēm (pārslēdz lapā):
//   1) fetch API ar async/await   2) XMLHttpRequest
// Šis fails neko nezina par React vai lapu: tikai tīkls un JSON.

const DEFAULT_URL = 'http://127.0.0.1:8000/api';

export const store = {
    get(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
    },
    set(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* nav pieejams */ }
    },
    remove(key) {
        try { localStorage.removeItem(key); } catch { /* nav pieejams */ }
    },
};

export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

let onLog = () => {};

function getBaseUrl() {
    return store.get('apiUrl') || DEFAULT_URL;
}

function setBaseUrl(url) {
    store.set('apiUrl', url.replace(/\/+$/, ''));
}

function getToken() {
    return store.get('token');
}

function setToken(token) {
    if (token) store.set('token', token);
    else store.remove('token');
}

const MODEL_NAMES = { Post: 'Ieraksts', Comment: 'Komentārs', User: 'Lietotājs', Role: 'Loma', PostStatus: 'Statuss' };

const FIELD_NAMES = {
    title: 'Virsraksts', body: 'Teksts', content: 'Komentārs', name: 'Vārds', email: 'E-pasts',
    password: 'Parole', user_id: 'Lietotāja ID', role_id: 'Loma', post_status_id: 'Statuss',
};

// Laravel angļu valodas teksti -> saprotami latviešu teksti
function humanize(message) {
    let match = message.match(/No query results for model \[App\\Models\\(\w+)\](?: (\S+))?/);
    if (match) {
        const name = MODEL_NAMES[match[1]] ?? 'Ieraksts';
        return `${name}${match[2] ? ` #${match[2]}` : ''} netika atrasts. Iespējams, tas ir izdzēsts vai ID ir nepareizs.`;
    }
    match = message.match(/^The (.+?) field is required\.$/);
    if (match) return `Lauks „${fieldName(match[1])}” ir obligāts.`;
    match = message.match(/^The (.+?) field must be a valid email address\.$/);
    if (match) return 'Ievadi derīgu e-pasta adresi.';
    match = message.match(/^The (.+?) has already been taken\.$/);
    if (match) return `${fieldName(match[1])} jau ir aizņemts. Izvēlies citu.`;
    match = message.match(/^The (.+?) field confirmation does not match\.$/);
    if (match) return 'Paroles nesakrīt.';
    match = message.match(/^The (.+?) field must not be greater than (\d+) characters\.$/);
    if (match) return `„${fieldName(match[1])}” nedrīkst būt garāks par ${match[2]} rakstzīmēm.`;
    match = message.match(/^The selected (.+?) is invalid\.$/);
    if (match) return match[1] === 'email'
        ? 'Šāds e-pasts nav reģistrēts.'
        : `Izvēlētā vērtība („${fieldName(match[1])}”) nav derīga.`;

    const known = {
        'Unauthenticated.': 'Šai darbībai jāpieslēdzas savam kontam.',
        'You do not have the required role.': 'Šo darbību var veikt tikai administrators.',
        'This action is unauthorized.': 'Tev nav tiesību veikt šo darbību. Tu vari mainīt tikai savus ierakstus.',
        'The provided creadentials are incorrect.': 'Nepareizs e-pasts vai parole.',
        'The provided credentials are incorrect.': 'Nepareizs e-pasts vai parole.',
        'Too Many Attempts.': 'Pārāk daudz mēģinājumu. Uzgaidi mirkli un mēģini vēlreiz.',
        'Server Error': 'Servera kļūda. Mēģini vēlreiz vēlāk.',
    };
    return known[message] ?? null;
}

function fieldName(name) {
    return FIELD_NAMES[name.replace(/ /g, '_')] ?? name;
}

function statusMessage(status) {
    if (status === 0) return 'Neizdevās sazināties ar serveri. Vai API ir palaists?';
    if (status === 401) return 'Šai darbībai jāpieslēdzas savam kontam.';
    if (status === 403) return 'Tev nav tiesību veikt šo darbību.';
    if (status === 404) return 'Meklētais netika atrasts.';
    if (status === 422) return 'Ievadītie dati nav pareizi.';
    if (status === 429) return 'Pārāk daudz pieprasījumu. Uzgaidi mirkli.';
    if (status >= 500) return 'Servera kļūda. Mēģini vēlreiz vēlāk.';
    return `Kaut kas nogāja greizi (kods ${status}).`;
}

// Laravel validācijas kļūdas: { message, errors: { lauks: ["..."] } }
function errorMessage(data, status) {
    if (data && typeof data === 'object') {
        if (data.errors) {
            const messages = Object.values(data.errors).flat().map((m) => humanize(m) ?? m);
            return [...new Set(messages)].join(' ');
        }
        if (data.message) return humanize(data.message) ?? statusMessage(status);
    }
    return statusMessage(status);
}

// ---------- 1. metode: fetch API ar async/await ----------

async function sendWithFetch({ method, url, headers, body }) {
    const response = await fetch(url, { method, headers, body });
    const text = await response.text();
    return { status: response.status, text };
}

// ---------- 2. metode: XMLHttpRequest (ar notikumiem, ietīts Promise) ----------

function sendWithXhr({ method, url, headers, body }) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        for (const [name, value] of Object.entries(headers)) {
            xhr.setRequestHeader(name, value);
        }
        xhr.timeout = 15000;
        xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
        xhr.onerror = () => reject(new Error('Tīkla kļūda'));
        xhr.ontimeout = () => reject(new Error('Serveris neatbild'));
        xhr.send(body);
    });
}

const TRANSPORTS = {
    fetch: { label: 'fetch', send: sendWithFetch },
    xhr: { label: 'XHR', send: sendWithXhr },
};

// ---------- Iestatījumi: metode un lēnā tīkla simulācija ----------

const SLOW_DELAY_MS = 1500;

function getMethod() {
    const saved = store.get('ajaxMethod');
    return saved in TRANSPORTS ? saved : 'fetch';
}

function setMethod(name) {
    if (name in TRANSPORTS) store.set('ajaxMethod', name);
}

function isSlow() {
    return store.get('slowMode') === true;
}

function setSlow(value) {
    store.set('slowMode', Boolean(value));
}

// ---------- Ielādes indikators: skaita, cik pieprasījumu vēl gaida atbildi ----------

let pending = 0;
let onLoading = () => {};

function trackLoading(change) {
    pending += change;
    onLoading(pending);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------- Kopīgā pieprasījuma funkcija ----------

// Kopīgais kodols jebkuram pieprasījumam (arī uz citām vietnēm): nosūta ar izvēlēto metodi
// (fetch / XHR), skaita gaidošos pieprasījumus un raksta žurnālu. Tokenu šeit nepievieno —
// galvenes sagatavo tas, kas funkciju izsauc.
async function execute({ method, url, headers, body }) {
    const transport = TRANSPORTS[getMethod()];
    let status = 0;
    let data = null;
    let networkError = false;
    let started = performance.now();

    trackLoading(1);
    try {
        if (isSlow()) await sleep(SLOW_DELAY_MS);
        started = performance.now();

        const response = await transport.send({
            method,
            url,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        status = response.status;
        if (response.text) {
            try { data = JSON.parse(response.text); } catch { data = response.text; }
        }
    } catch {
        networkError = true; // serveris nav sasniedzams (abām metodēm vienāda apstrāde)
    } finally {
        trackLoading(-1);
        onLog({
            method, url, status, body, data,
            via: transport.label,
            ms: Math.round(performance.now() - started),
        });
    }

    return { status, data, networkError };
}

// Pieprasījums uz mūsu Laravel API (ar tokenu un latviešu kļūdu tekstiem)
async function request(method, path, body) {
    const url = getBaseUrl() + path;
    // Accept: application/json liek Laravel atgriezt kļūdas JSON formātā, nevis HTML
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const { status, data, networkError } = await execute({ method, url, headers, body });

    if (networkError) throw new ApiError(statusMessage(0), 0, null);

    // /login atgriež kļūdu ar statusu 200, tāpēc pārbaudām arī "errors" lauku
    const failed = status < 200 || status >= 300 || (data && typeof data === 'object' && data.errors);
    if (failed) throw new ApiError(errorMessage(data, status), status, data);
    return data;
}

// ---------- JokeAPI (ārējs serviss: https://v2.jokeapi.dev) ----------

const JOKE_API = 'https://v2.jokeapi.dev';

function jokeErrorMessage(data, status) {
    if (data && typeof data === 'object' && data.error) {
        if (data.code === 106) return 'Pēc šiem filtriem joki netika atrasti. Mēģini mazāk ierobežot filtrus.';
        const reason = Array.isArray(data.causedBy) ? data.causedBy.join(' ') : data.message;
        if (reason) return `JokeAPI kļūda: ${reason}`;
    }
    if (status === 429) return 'JokeAPI atļauj 120 pieprasījumus minūtē. Uzgaidi mirkli.';
    if (status >= 500) return 'JokeAPI serveris šobrīd nedarbojas. Mēģini vēlāk.';
    return `JokeAPI atbildēja ar kļūdu (kods ${status}).`;
}

// Joku meklēšana ar filtriem. Šeit NAV Authorization galvenes: mūsu Laravel token
// nedrīkst nonākt pie trešās puses servisa. Atgriež joku masīvu.
async function getJokes({
    categories = [], blacklist = [], type = '', contains = '', lang = 'en', amount = 1, safeMode = false,
} = {}) {
    const params = new URLSearchParams();
    if (blacklist.length) params.set('blacklistFlags', blacklist.join(','));
    if (type) params.set('type', type);
    if (contains.trim()) params.set('contains', contains.trim());
    if (lang !== 'en') params.set('lang', lang);
    params.set('amount', String(amount));

    // JokeAPI atpazīst "safe-mode" tikai bez vērtības. URLSearchParams uzrakstītu "safe-mode=",
    // un tad serviss filtru ignorē (pārbaudīts: atgriež arī nedrošus jokus), tāpēc to pievieno ar roku.
    const query = [params.toString(), safeMode ? 'safe-mode' : ''].filter(Boolean).join('&');

    const category = categories.length ? categories.join(',') : 'Any';
    const url = `${JOKE_API}/joke/${category}?${query}`;

    const { status, data, networkError } = await execute({
        method: 'GET',
        url,
        headers: { Accept: 'application/json' },
    });

    if (networkError) throw new ApiError('Neizdevās sazināties ar JokeAPI. Pārbaudi interneta savienojumu.', 0, null);
    if (status < 200 || status >= 300 || data?.error) throw new ApiError(jokeErrorMessage(data, status), status, data);

    // Viens joks nāk kā objekts, vairāki — kā { jokes: [...] }
    return Array.isArray(data?.jokes) ? data.jokes : [data];
}

export const Api = {
    ApiError,
    store,
    getBaseUrl,
    setBaseUrl,
    getToken,
    setToken,
    set onLog(fn) { onLog = fn; },
    set onLoading(fn) { onLoading = fn; },
    getMethod,
    setMethod,
    isSlow,
    setSlow,

    // Autentifikācija
    register: (fields) => request('POST', '/register', fields),
    login: (fields) => request('POST', '/login', fields),
    logout: () => request('POST', '/logout'),
    me: () => request('GET', '/user'),

    // Ieraksti
    getPosts: () => request('GET', '/posts'),
    getPost: (id) => request('GET', `/posts/${id}`),
    createPost: (fields) => request('POST', '/posts', fields),
    updatePost: (id, fields) => request('PUT', `/posts/${id}`, fields),
    deletePost: (id) => request('DELETE', `/posts/${id}`),
    setPostStatus: (id, statusId) => request('PATCH', `/posts/${id}/status`, { post_status_id: statusId }),

    // Komentāri (ligzdotie maršruti)
    getComments: (postId) => request('GET', `/posts/${postId}/comments`),
    createComment: (postId, content) => request('POST', `/posts/${postId}/comments`, { content }),
    deleteComment: (postId, commentId) => request('DELETE', `/posts/${postId}/comments/${commentId}`),

    // Joki (ārējais JokeAPI)
    getJokes,

    // Lomas
    assignRole: (userId, roleId) => request('POST', `/users/${userId}/assign-role`, { role_id: roleId }),
    removeRole: (userId, roleId) => request('POST', `/users/${userId}/remove-role`, { role_id: roleId }),
};
