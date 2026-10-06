import { useCallback, useRef, useState } from 'react';
import { Api } from '../api.js';

// Ierakstu saraksts un tā stāvoklis. `run` ir kopīgā funkcija, kas izpilda API izsaukumu
// un parāda kļūdas paziņojumu (skat. App.jsx).
export function usePosts(run) {
    const [posts, setPosts] = useState([]);           // tādā secībā, kā atnāk no API
    const [status, setStatus] = useState('loading');  // 'loading' | 'ready' | 'error'
    const [filterId, setFilterId] = useState(null);   // ja nav null, rāda tikai šo ierakstu
    const [highlightId, setHighlightId] = useState(null);
    const sequence = useRef(0);

    // Ielādē visus ierakstus no servera. Ja pa to laiku sācies jauns pieprasījums,
    // vecā atbilde tiek ignorēta.
    const load = useCallback(async () => {
        const mine = ++sequence.current;
        setStatus('loading');
        const loaded = await run(() => Api.getPosts());
        if (mine !== sequence.current) return;
        if (!loaded) {
            setStatus('error');
            return;
        }
        setPosts(loaded);
        setFilterId(null);
        setHighlightId(null);
        setStatus('ready');
    }, [run]);

    // Pievieno ierakstu vai nomaina esošo ar tādu pašu ID
    const upsert = useCallback((post) => {
        setPosts((list) => (list.some((p) => p.id === post.id)
            ? list.map((p) => (p.id === post.id ? post : p))
            : [...list, post]));
    }, []);

    // "Atrast pēc ID": parāda tikai šo ierakstu
    const showOne = useCallback((post) => {
        upsert(post);
        setFilterId(post.id);
        setStatus('ready');
    }, [upsert]);

    // Jauns ieraksts. POST atbildē nav post_status_id, bet datubāzē noklusējums ir 1 (public)
    const add = useCallback((created) => {
        upsert({ post_status_id: 1, ...created });
        setFilterId(null);
        setHighlightId(created.id);
        setStatus('ready');
    }, [upsert]);

    const remove = useCallback((id) => {
        setPosts((list) => list.filter((p) => p.id !== id));
        setFilterId((current) => (current === id ? null : current));
    }, []);

    // Jaunākie ieraksti augšā
    const visible = filterId === null
        ? [...posts].reverse()
        : posts.filter((p) => p.id === filterId);

    return {
        visible, total: posts.length, status, filterId, highlightId,
        load, showOne, add, replace: upsert, remove,
    };
}
