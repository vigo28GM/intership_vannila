// Parasta poga, kas rāda spinneri un ir bloķēta, kamēr tās pieprasījums tiek izpildīts.
export default function Button({ loading = false, className = '', disabled = false, type = 'button', ...props }) {
    const classes = [className, loading ? 'loading' : ''].filter(Boolean).join(' ');
    return <button type={type} className={classes || undefined} disabled={loading || disabled} {...props} />;
}
