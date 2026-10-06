import { useCallback, useEffect, useRef, useState } from 'react';
import { Api } from './api.js';
import { AppContext } from './AppContext.js';
import NavBar from './components/NavBar.jsx';
import Toast from './components/Toast.jsx';
import { useHashView } from './hooks/useHashView.js';
import { useLoadingBar } from './hooks/useLoadingBar.js';
import { usePosts } from './hooks/usePosts.js';
import { useRequestLog } from './hooks/useRequestLog.js';
import { useToast } from './hooks/useToast.js';
import AccountView from './views/AccountView.jsx';
import JokesView from './views/JokesView.jsx';
import LogView from './views/LogView.jsx';
import NewPostView from './views/NewPostView.jsx';
import PostsView from './views/PostsView.jsx';
import RolesView from './views/RolesView.jsx';

const METHOD_NAMES = { fetch: 'fetch (async/await)', xhr: 'XMLHttpRequest' };

export default function App() {
    const { view, go } = useHashView();
    const { toast, notify } = useToast();
    const loading = useLoadingBar();
    const log = useRequestLog(view);

    const [user, setUser] = useState(() => Api.store.get('user'));
    const [menuOpen, setMenuOpen] = useState(false);
    const [method, setMethod] = useState(Api.getMethod);
    const [slow, setSlow] = useState(Api.isSlow);

    // `run` ir stabila funkcija, tāpēc tai vajag jaunāko lietotāju caur ref
    const currentUser = useRef(user);
    currentUser.current = user;

    // ---------- Sesija ----------

    const setSession = useCallback((nextUser, token) => {
        Api.setToken(token);
        if (nextUser) Api.store.set('user', nextUser);
        else Api.store.remove('user');
        setUser(nextUser);
    }, []);

    // Izpilda API izsaukumu un parāda paziņojumu par rezultātu.
    // Kļūdas gadījumā atgriež undefined, veiksmē — rezultātu (vai true, ja tā nav).
    const run = useCallback(async (task, successMessage) => {
        try {
            const result = await task();
            if (successMessage) notify(successMessage, 'ok');
            return result ?? true;
        } catch (error) {
            if (error.status === 401 && currentUser.current) {
                setSession(null, null);
                notify('Sesija beigusies, pieslēdzies no jauna.', 'error');
            } else {
                notify(error.message, 'error');
            }
            return undefined;
        }
    }, [notify, setSession]);

    const posts = usePosts(run);

    // Saraksts atkarīgs no lietotāja: privātos ierakstus redz tikai to autors,
    // un pogas "Rediģēt"/"Dzēst" parādās tikai pašu ierakstiem. Tāpēc to ielādē
    // lapas atvēršanā un pēc katras pieslēgšanās vai izrakstīšanās.
    const { load } = posts;
    const userId = user?.id ?? null;
    useEffect(() => {
        load();
    }, [load, userId]);

    // Pārejot uz citu sadaļu, lapa ritinās uz augšu un mobilā izvēlne aizveras
    useEffect(() => {
        window.scrollTo(0, 0);
        setMenuOpen(false);
    }, [view]);

    // ---------- AJAX iestatījumi ----------

    const changeMethod = (name) => {
        Api.setMethod(name);
        setMethod(name);
        notify(`Pieprasījumi tagad tiek sūtīti ar: ${METHOD_NAMES[name]}`);
        load(); // tas pats uzdevums, cita metode
    };

    const changeSlow = (value) => {
        Api.setSlow(value);
        setSlow(value);
        notify(value ? 'Lēnā savienojuma simulācija ieslēgta.' : 'Lēnā savienojuma simulācija izslēgta.');
    };

    const context = { user, setSession, run, notify, go, posts, method, changeMethod, slow, changeSlow };

    return (
        <AppContext.Provider value={context}>
            <div className={menuOpen ? 'menu-open' : undefined}>
                <NavBar
                    view={view}
                    user={user}
                    unseen={log.unseen}
                    loading={loading}
                    menuOpen={menuOpen}
                    onToggleMenu={() => setMenuOpen((open) => !open)}
                />

                <main className="container">
                    <PostsView active={view === 'posts'} />
                    <NewPostView active={view === 'new'} />
                    <RolesView active={view === 'roles'} />
                    <JokesView active={view === 'jokes'} />
                    <AccountView active={view === 'account'} />
                    <LogView active={view === 'log'} entries={log.entries} onClear={log.clear} />
                </main>

                <Toast toast={toast} />
            </div>
        </AppContext.Provider>
    );
}
