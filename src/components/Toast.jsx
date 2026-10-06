export default function Toast({ toast }) {
    return (
        <div
            id="toast"
            className={`toast toast-${toast.type}`}
            role="status"
            aria-live="polite"
            hidden={!toast.visible}
        >
            <span className="toast-icon">{toast.type === 'ok' ? '✓' : '!'}</span>
            {toast.message}
        </div>
    );
}
