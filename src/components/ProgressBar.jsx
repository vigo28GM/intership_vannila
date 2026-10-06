// Josla navigācijas apakšā, kamēr notiek kāds pieprasījums
export default function ProgressBar({ loading }) {
    return (
        <div id="progress" className="progress" role="progressbar" aria-label="Notiek datu ielāde" hidden={!loading}>
            <div className="progress-bar" />
        </div>
    );
}
