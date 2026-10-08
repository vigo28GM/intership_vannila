import { useCallback, useSyncExternalStore } from 'react';

export const VIEWS = ['posts', 'new', 'roles', 'jokes', 'account', 'log'];

// Adreses daļa pēc # ir "ārējs avots": pārlūka stāvoklis, ko React nepārvalda.
// useSyncExternalStore ir React veids, kā to droši lasīt un sekot izmaiņām.
function subscribe(onChange) {
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
}

const getSnapshot = () => window.location.hash;

// Navigācija bez lapas pārlādes: aktīvo sadaļu nosaka adreses daļa pēc #
export function useHashView() {
    const name = useSyncExternalStore(subscribe, getSnapshot).slice(1);
    const view = VIEWS.includes(name) ? name : 'posts';

    const go = useCallback((target) => {
        window.location.hash = target;
    }, []);

    return { view, go };
}
