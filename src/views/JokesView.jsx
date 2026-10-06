import { useEffect, useRef, useState } from 'react';
import { Api } from '../api.js';
import Button from '../components/Button.jsx';
import JokeCard from '../components/JokeCard.jsx';
import Spinner from '../components/Spinner.jsx';
import View from '../components/View.jsx';

const CATEGORIES = ['Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas'];

// Joki ar šīm pazīmēm tiek izslēgti (JokeAPI parametrs blacklistFlags)
const FLAGS = [
    ['nsfw', 'NSFW (pieaugušajiem)'],
    ['religious', 'Reliģiski'],
    ['political', 'Politiski'],
    ['racist', 'Rasistiski'],
    ['sexist', 'Seksistiski'],
    ['explicit', 'Rupji (explicit)'],
];

const TYPES = [
    ['', 'Jebkurš'],
    ['single', 'Viena rinda'],
    ['twopart', 'Ievads + atbilde'],
];

const LANGUAGES = [
    ['en', 'English'],
    ['cs', 'Čeština'],
    ['de', 'Deutsch'],
    ['es', 'Español'],
    ['fr', 'Français'],
    ['pt', 'Português'],
];

const DEFAULT_FILTERS = {
    categories: [],                       // tukšs = visas kategorijas ("Any")
    type: '',
    contains: '',
    lang: 'en',
    amount: 3,
    blacklist: FLAGS.map(([name]) => name), // pēc noklusējuma izslēdz visu jutīgo
};

// Sarakstā pievieno vai izņem vērtību
const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export default function JokesView({ active }) {
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [result, setResult] = useState({ status: 'idle', jokes: [], message: '' });
    const sequence = useRef(0);
    const loadedOnce = useRef(false);

    const update = (changes) => setFilters((current) => ({ ...current, ...changes }));

    const search = async () => {
        const mine = ++sequence.current;
        setResult((current) => ({ ...current, status: 'loading' }));
        try {
            const jokes = await Api.getJokes(filters);
            if (mine === sequence.current) setResult({ status: 'ready', jokes, message: '' });
        } catch (error) {
            if (mine === sequence.current) {
                // JokeAPI kods 106 nozīmē "serviss strādā, bet neviens joks neatbilst filtriem"
                const noMatch = error.data?.code === 106;
                setResult({ status: 'error', jokes: [], message: error.message, noMatch });
            }
        }
    };

    // Pirmoreiz atverot sadaļu, uzreiz parāda dažus jokus
    useEffect(() => {
        if (active && !loadedOnce.current) {
            loadedOnce.current = true;
            search();
        }
    }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

    const submit = (event) => {
        event.preventDefault();
        search();
    };

    const loading = result.status === 'loading';

    return (
        <View name="jokes" active={active}>
            <header className="page-head">
                <div>
                    <h1>Jokes</h1>
                    <p className="lead">
                        Joki no ārēja API (<b>JokeAPI</b>). Izvēlies filtrus un spied „Atrast jokus”: filtrus apstrādā pats serviss.
                    </p>
                </div>
            </header>

            <div className="card">
                <form id="joke-form" className="stack" onSubmit={submit}>
                    <fieldset className="filter-group">
                        <legend>Kategorijas <span className="muted">(ja nekas nav atzīmēts: visas)</span></legend>
                        <div className="chips">
                            {CATEGORIES.map((name) => (
                                <label key={name} className="chip">
                                    <input
                                        type="checkbox"
                                        name="category"
                                        value={name}
                                        checked={filters.categories.includes(name)}
                                        onChange={() => update({ categories: toggle(filters.categories, name) })}
                                    />
                                    <span>{name}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div className="grid-2">
                        <fieldset className="filter-group">
                            <legend>Veids</legend>
                            <div className="segmented">
                                {TYPES.map(([value, label]) => (
                                    <label key={value || 'any'}>
                                        <input
                                            type="radio"
                                            name="joke-type"
                                            value={value}
                                            checked={filters.type === value}
                                            onChange={() => update({ type: value })}
                                        />
                                        <span>{label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <label>
                            Valoda
                            <select name="lang" value={filters.lang} onChange={(event) => update({ lang: event.target.value })}>
                                {LANGUAGES.map(([code, label]) => (
                                    <option key={code} value={code}>{label}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid-2">
                        <label>
                            Meklēt tekstā
                            <input
                                name="contains"
                                placeholder="piemēram: bug"
                                value={filters.contains}
                                onChange={(event) => update({ contains: event.target.value })}
                            />
                        </label>
                        <label>
                            Daudzums (1–10)
                            <input
                                name="amount"
                                type="number"
                                min="1"
                                max="10"
                                value={filters.amount}
                                onChange={(event) => update({ amount: Math.min(10, Math.max(1, Number(event.target.value) || 1)) })}
                            />
                        </label>
                    </div>

                    <fieldset className="filter-group">
                        <legend>Izslēgt jokus, kas ir <span className="muted">(atzīmētie netiks rādīti)</span></legend>
                        <div className="chips">
                            {FLAGS.map(([name, label]) => (
                                <label key={name} className="chip">
                                    <input
                                        type="checkbox"
                                        name="blacklist"
                                        value={name}
                                        checked={filters.blacklist.includes(name)}
                                        onChange={() => update({ blacklist: toggle(filters.blacklist, name) })}
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div className="form-actions">
                        <Button className="ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>Atiestatīt filtrus</Button>
                        <Button type="submit" className="primary" loading={loading}>Atrast jokus</Button>
                    </div>
                </form>
            </div>

            <div id="jokes" className="jokes">
                {result.status === 'loading' && <Spinner text="Meklē jokus…" />}

                {result.status === 'error' && (
                    <div className="empty-state">
                        <p className="empty-title">{result.noMatch ? 'Nekas netika atrasts' : 'Jokus neizdevās ielādēt'}</p>
                        <p>{result.message}</p>
                    </div>
                )}

                {result.status === 'ready' && (
                    <>
                        <p className="muted" id="jokes-summary">
                            {`Atrasti ${result.jokes.length} ${result.jokes.length === 1 ? 'joks' : 'joki'}`}
                        </p>
                        {result.jokes.map((joke) => <JokeCard key={`${joke.id}-${joke.lang}`} joke={joke} />)}
                    </>
                )}
            </div>

            <p className="endpoints">
                <code>GET https://v2.jokeapi.dev/joke/{'{kategorijas}'}?blacklistFlags=…&amp;type=…&amp;contains=…&amp;lang=…&amp;amount=…</code>
            </p>
        </View>
    );
}
