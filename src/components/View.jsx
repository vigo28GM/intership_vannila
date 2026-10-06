// Viena lapas sadaļa. Visas sadaļas vienmēr ir lapā, neaktīvās ir paslēptas,
// tāpēc to saturs (piemēram, uzrakstīts, bet neizsūtīts teksts) nepazūd, pārslēdzoties.
export default function View({ name, active, narrow = false, children }) {
    return (
        <section className={`view${narrow ? ' narrow' : ''}`} data-view={name} hidden={!active}>
            {children}
        </section>
    );
}
