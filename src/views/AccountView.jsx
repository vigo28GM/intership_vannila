import { Fragment, useEffect, useState } from 'react';
import { Api } from '../api.js';
import { useApp } from '../AppContext.js';
import Avatar from '../components/Avatar.jsx';
import Button from '../components/Button.jsx';
import View from '../components/View.jsx';
import { useRunner } from '../hooks/useRunner.js';

function Profile({ me }) {
    return (
        <>
            <div className="profile">
                <Avatar label={me.name.charAt(0).toUpperCase()} id={me.id} size="large" />
                <div>
                    <p className="profile-name">{me.name}</p>
                    <p className="muted">{`${me.email} · lietotāja ID ${me.id}`}</p>
                </div>
            </div>
            <dl className="details">
                {Object.entries(me).map(([key, value]) => (
                    <Fragment key={key}>
                        <dt>{key}</dt>
                        <dd>{String(value ?? '—')}</dd>
                    </Fragment>
                ))}
            </dl>
        </>
    );
}

export default function AccountView({ active }) {
    const { user, setSession, notify, go, run } = useApp();
    const [tab, setTab] = useState('login');
    const [me, setMe] = useState(null);
    const [busy, perform] = useRunner();

    // Atverot kontu, no servera pieprasa datus par lietotāju, kuram pieder tokens.
    // Tikai tad, kad sadaļa tiek atvērta (nevis pēc pieslēgšanās, kad lapa jau pārslēdzas citur).
    useEffect(() => {
        if (!active || !user) return undefined;
        let cancelled = false;
        setMe(null);
        run(() => Api.me()).then((result) => {
            if (!cancelled && result && result !== true) setMe(result);
        });
        return () => { cancelled = true; };
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    const login = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = Object.fromEntries(new FormData(form));
        const data = await perform('login', () => Api.login(fields));
        if (!data) return;
        setSession(data.user, data.token);
        form.reset();
        notify(`Sveiks, ${data.user.name}!`);
        go('posts');
    };

    const register = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const fields = Object.fromEntries(new FormData(form));
        const data = await perform('register', () => Api.register(fields));
        if (!data) return;
        setSession(data.user, data.token);
        form.reset();
        notify(`Konts izveidots. Sveiks, ${data.user.name}!`);
        go('posts');
    };

    const logout = async () => {
        // Lokāli izrakstāmies arī tad, ja serveris tokenu vairs neatpazīst
        await perform('logout', () => Api.logout(), 'Tu esi izrakstījies.');
        setSession(null, null);
        go('posts');
    };

    return (
        <View name="account" active={active} narrow>
            {!user ? (
                <div id="auth-box">
                    <header className="page-head">
                        <div>
                            <h1>Pieslēgties</h1>
                            <p className="lead">
                                Pēc pieslēgšanās serveris izsniedz <b>tokenu</b>, ar kuru tiek sūtīti visi turpmākie pieprasījumi.
                            </p>
                        </div>
                    </header>

                    <div className="card">
                        <div className="tabs" role="tablist">
                            <Button className={`tab${tab === 'login' ? ' active' : ''}`} data-tab="login-form" onClick={() => setTab('login')}>
                                Man ir konts
                            </Button>
                            <Button className={`tab${tab === 'register' ? ' active' : ''}`} data-tab="register-form" onClick={() => setTab('register')}>
                                Izveidot kontu
                            </Button>
                        </div>

                        <form id="login-form" className="stack" onSubmit={login} hidden={tab !== 'login'}>
                            <label>
                                E-pasts
                                <input name="email" type="email" required autoComplete="email" placeholder="vards@epasts.lv" />
                            </label>
                            <label>
                                Parole
                                <input name="password" type="password" required autoComplete="current-password" />
                            </label>
                            <Button type="submit" className="primary block" loading={busy === 'login'}>Pieslēgties</Button>
                        </form>

                        <form id="register-form" className="stack" onSubmit={register} hidden={tab !== 'register'}>
                            <label>
                                Vārds
                                <input name="name" required maxLength={255} autoComplete="name" />
                            </label>
                            <label>
                                E-pasts
                                <input name="email" type="email" required autoComplete="email" placeholder="vards@epasts.lv" />
                            </label>
                            <div className="grid-2">
                                <label>
                                    Parole
                                    <input name="password" type="password" required autoComplete="new-password" />
                                </label>
                                <label>
                                    Parole atkārtoti
                                    <input name="password_confirmation" type="password" required autoComplete="new-password" />
                                </label>
                            </div>
                            <Button type="submit" className="primary block" loading={busy === 'register'}>Izveidot kontu</Button>
                        </form>
                    </div>
                    <p className="endpoints"><code>POST /api/login</code> <code>POST /api/register</code></p>
                </div>
            ) : (
                <div id="profile-box">
                    <header className="page-head">
                        <div>
                            <h1>Mans konts</h1>
                            <p className="lead">Dati, ko serveris atgriež par lietotāju, kuram pieder tokens.</p>
                        </div>
                        <Button id="logout-btn" className="danger" loading={busy === 'logout'} onClick={logout}>Iziet</Button>
                    </header>
                    <div className="card">
                        <div id="me-output">
                            {me ? <Profile me={me} /> : <p className="muted">Ielādē…</p>}
                        </div>
                    </div>
                    <p className="endpoints"><code>GET /api/user</code> <code>POST /api/logout</code></p>
                </div>
            )}
        </View>
    );
}
