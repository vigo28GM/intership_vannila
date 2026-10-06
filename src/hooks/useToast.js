import { useCallback, useEffect, useRef, useState } from 'react';

// Īslaicīgs paziņojums apakšā ("Ieraksts publicēts.", kļūdu teksti…)
export function useToast() {
    const [toast, setToast] = useState({ message: '', type: 'ok', visible: false });
    const timer = useRef();

    const notify = useCallback((message, type = 'ok') => {
        clearTimeout(timer.current);
        setToast({ message, type, visible: true });
        timer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 4000);
    }, []);

    useEffect(() => () => clearTimeout(timer.current), []);

    return { toast, notify };
}
