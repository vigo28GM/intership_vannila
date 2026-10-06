import { useState } from 'react';
import Button from './Button.jsx';

// Viens joks. Joks "single" ir viens teksts; "twopart" ir ievads un atbilde, ko var paslēpt.
export default function JokeCard({ joke }) {
    const [revealed, setRevealed] = useState(false);
    const activeFlags = Object.entries(joke.flags ?? {}).filter(([, on]) => on).map(([name]) => name);

    return (
        <article className="card joke" data-joke-id={joke.id}>
            <header className="joke-head">
                <span className="badge badge-category">{joke.category}</span>
                <span className="muted">{`#${joke.id} · ${joke.lang}`}</span>
                <span className="spacer" />
                {joke.safe && <span className="badge badge-public">Drošs</span>}
                {activeFlags.map((name) => (
                    <span key={name} className="badge badge-flag">{name}</span>
                ))}
            </header>

            {joke.type === 'single' ? (
                <p className="joke-text">{joke.joke}</p>
            ) : (
                <>
                    <p className="joke-text">{joke.setup}</p>
                    {revealed ? (
                        <p className="joke-punchline">{joke.delivery}</p>
                    ) : (
                        <div>
                            <Button className="ghost" data-action="reveal" onClick={() => setRevealed(true)}>
                                Rādīt atbildi
                            </Button>
                        </div>
                    )}
                </>
            )}
        </article>
    );
}
