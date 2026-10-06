import { hidePasswords } from '../format.js';

// Viens AJAX pieprasījums žurnālā: metode, adrese, statuss, laiks un nosūtītie/saņemtie dati
export default function LogEntry({ entry }) {
    const { method, url, status, body, data, ms, via, time } = entry;
    const ok = status >= 200 && status < 300;

    return (
        <li className={ok ? 'ok' : 'fail'}>
            <details>
                <summary>
                    <span className={`method method-${method.toLowerCase()}`}>{method}</span>
                    <span className="url">{new URL(url).pathname}</span>
                    <span className={`via via-${via.toLowerCase()}`} title="Ar kuru metodi nosūtīts">{via}</span>
                    <span className="status">{status || 'nav savienojuma'}</span>
                    <span className="muted">{`${ms} ms`}</span>
                    <span className="muted time">{time}</span>
                </summary>
                <div className="log-body">
                    {body !== undefined && (
                        <div>
                            <p className="log-label">Nosūtīts</p>
                            <pre>{JSON.stringify(hidePasswords(body), null, 2)}</pre>
                        </div>
                    )}
                    <div>
                        <p className="log-label">Saņemts</p>
                        <pre>{typeof data === 'string' ? data : JSON.stringify(data, null, 2)}</pre>
                    </div>
                </div>
            </details>
        </li>
    );
}
