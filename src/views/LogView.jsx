import { useState } from 'react';
import { Api } from '../api.js';
import { useApp } from '../AppContext.js';
import Button from '../components/Button.jsx';
import LogEntry from '../components/LogEntry.jsx';
import View from '../components/View.jsx';

export default function LogView({ active, entries, onClear }) {
    const { notify, posts } = useApp();
    const [url, setUrl] = useState(Api.getBaseUrl);

    const saveUrl = (event) => {
        event.preventDefault();
        Api.setBaseUrl(url);
        setUrl(Api.getBaseUrl());
        notify('API adrese saglabāta.');
        posts.load();
    };

    return (
        <View name="log" active={active}>
            <header className="page-head">
                <div>
                    <h1>Pieprasījumi</h1>
                    <p className="lead">Katrs AJAX pieprasījums, ko lapa nosūtījusi serverim. Uzklikšķini, lai redzētu JSON datus.</p>
                </div>
                <Button id="clear-log" className="ghost" onClick={onClear}>Notīrīt</Button>
            </header>

            <div className="card">
                <form id="settings-form" className="settings" onSubmit={saveUrl}>
                    <label htmlFor="api-url">API adrese</label>
                    <input id="api-url" type="url" required value={url} onChange={(event) => setUrl(event.target.value)} />
                    <button type="submit">Saglabāt</button>
                </form>
            </div>

            <ol id="log" className="log">
                {entries.map((entry) => <LogEntry key={entry.id} entry={entry} />)}
            </ol>
            <p className="empty-state" id="log-empty" hidden={entries.length > 0}>Vēl nav neviena pieprasījuma.</p>
        </View>
    );
}
