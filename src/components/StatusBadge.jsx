import { STATUS_LABELS, statusName } from '../format.js';

export default function StatusBadge({ id }) {
    const name = statusName(id);
    return <span className={`badge badge-${name}`}>{STATUS_LABELS[name] ?? name}</span>;
}
