// Rotējoša ikona ar tekstu, ko rāda, kamēr dati tiek ielādēti
export default function Spinner({ text }) {
    return (
        <div className="loading-block" role="status">
            <span className="spinner" aria-hidden="true" />
            <span>{text}</span>
        </div>
    );
}
