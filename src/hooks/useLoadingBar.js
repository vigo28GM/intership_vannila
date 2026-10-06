import { useEffect, useState } from 'react';
import { Api } from '../api.js';

const MIN_PROGRESS_MS = 400; // lai josla nenomirgo, ja atbilde atnāk ļoti ātri

// Atgriež true, kamēr kaut viens pieprasījums gaida atbildi (josla navigācijas apakšā)
export function useLoadingBar() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let visible = false;
        let shownAt = 0;
        let timer;

        Api.onLoading = (pending) => {
            clearTimeout(timer);
            if (pending > 0) {
                if (!visible) {
                    visible = true;
                    shownAt = Date.now();
                    setLoading(true);
                }
                return;
            }
            const wait = Math.max(0, MIN_PROGRESS_MS - (Date.now() - shownAt));
            timer = setTimeout(() => {
                visible = false;
                setLoading(false);
            }, wait);
        };

        return () => {
            clearTimeout(timer);
            Api.onLoading = () => {};
        };
    }, []);

    return loading;
}
