import { useCallback, useEffect, useState } from 'react';

export const VIEWS = ['posts', 'new', 'roles', 'account', 'log'];

function readView() {
    const name = window.location.hash.slice(1);
    return VIEWS.includes(name) ? name : 'posts';
}

// Navigācija bez lapas pārlādes: aktīvo sadaļu nosaka adreses daļa pēc #
// (kā iepriekš), un `hashchange` notikums paziņo, kad tā mainās.
export function useHashView() {
    const [view, setView] = useState(readView);

    useEffect(() => {
        const onChange = () => setView(readView());
        window.addEventListener('hashchange', onChange);
        return () => window.removeEventListener('hashchange', onChange);
    }, []);

    const go = useCallback((name) => {
        window.location.hash = name;
    }, []);

    return { view, go };
}
