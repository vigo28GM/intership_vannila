// Mazas palīgfunkcijas datu attēlošanai (nav saistītas ar React).

export const STATUSES = { 1: 'public', 2: 'private' };
export const STATUS_LABELS = { public: 'Publisks', private: 'Privāts' };

export function formatDate(iso) {
    return iso ? new Date(iso).toLocaleString('lv-LV', { dateStyle: 'medium', timeStyle: 'short' }) : '';
}

export function statusName(id) {
    return STATUSES[id] ?? `#${id}`;
}

// Žurnālā paroles netiek rādītas
export function hidePasswords(body) {
    const copy = { ...body };
    for (const key of Object.keys(copy)) {
        if (key.startsWith('password')) copy[key] = '••••••';
    }
    return copy;
}
