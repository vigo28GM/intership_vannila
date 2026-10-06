import { useCallback, useEffect, useRef, useState } from 'react';
import { Api } from '../api.js';

const MAX_LOG_ITEMS = 100;

// Katrs AJAX pieprasījums nonāk šeit (sadaļa "Pieprasījumi").
// `unseen` skaita jaunos pieprasījumus, kamēr žurnāls nav atvērts.
export function useRequestLog(view) {
    const [entries, setEntries] = useState([]);
    const [unseen, setUnseen] = useState(0);
    const viewRef = useRef(view);
    const nextId = useRef(0);

    useEffect(() => {
        viewRef.current = view;
        if (view === 'log') setUnseen(0);
    }, [view]);

    useEffect(() => {
        Api.onLog = (entry) => {
            const item = { ...entry, id: nextId.current++, time: new Date().toLocaleTimeString('lv-LV') };
            setEntries((list) => [item, ...list].slice(0, MAX_LOG_ITEMS));
            if (viewRef.current !== 'log') setUnseen((n) => n + 1);
        };
        return () => { Api.onLog = () => {}; };
    }, []);

    const clear = useCallback(() => setEntries([]), []);

    return { entries, unseen, clear };
}
