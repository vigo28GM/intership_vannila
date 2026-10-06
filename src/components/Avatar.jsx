// Krāsains aplītis ar burtu vai numuru – krāsa atkarīga no lietotāja ID
export default function Avatar({ label, id, size = '' }) {
    const hue = (Number(id) * 67) % 360;
    return (
        <span className={`avatar ${size}`.trim()} style={{ '--hue': hue }} aria-hidden="true">
            {label}
        </span>
    );
}
