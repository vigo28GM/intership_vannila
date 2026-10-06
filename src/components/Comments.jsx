import { formatDate } from '../format.js';
import Avatar from './Avatar.jsx';
import Button from './Button.jsx';
import Spinner from './Spinner.jsx';

function CommentItem({ comment, user, busy, onDelete }) {
    const own = Boolean(user) && user.id === comment.user_id;

    return (
        <li className="comment" data-comment-id={comment.id}>
            <Avatar label={`#${comment.user_id}`} id={comment.user_id} size="small" />
            <div className="comment-main">
                <p className="comment-meta">
                    <strong>{own ? 'Tu' : `Lietotājs #${comment.user_id}`}</strong>
                    <span className="muted">{formatDate(comment.created_at)}</span>
                    {own && (
                        <Button
                            className="link danger"
                            data-action="delete-comment"
                            loading={busy === `delete-${comment.id}`}
                            onClick={() => onDelete(comment.id)}
                        >
                            dzēst
                        </Button>
                    )}
                </p>
                <p className="comment-text">{comment.content}</p>
            </div>
        </li>
    );
}

// Viena ieraksta komentāru lodziņš: saraksts un jauna komentāra forma
export default function Comments({ loading, items, user, busy, draft, onDraftChange, onSubmit, onDelete, inputRef }) {
    if (loading) {
        return (
            <div className="comments">
                <Spinner text="Ielādē komentārus…" />
            </div>
        );
    }

    return (
        <div className="comments">
            {items.length > 0 ? (
                <ul className="comment-list">
                    {items.map((comment) => (
                        <CommentItem key={comment.id} comment={comment} user={user} busy={busy} onDelete={onDelete} />
                    ))}
                </ul>
            ) : (
                <p className="muted">Komentāru vēl nav.</p>
            )}

            {user ? (
                <form className="comment-form" onSubmit={onSubmit}>
                    <input
                        ref={inputRef}
                        name="content"
                        required
                        placeholder="Raksti komentāru…"
                        aria-label="Komentārs"
                        value={draft}
                        onChange={(event) => onDraftChange(event.target.value)}
                    />
                    <Button type="submit" className="primary" loading={busy === 'comment'}>Sūtīt</Button>
                </form>
            ) : (
                <p className="muted"><a href="#account">Pieslēdzies</a>, lai komentētu.</p>
            )}
        </div>
    );
}
