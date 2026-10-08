import { Component } from 'react';
import { Api } from '../api.js';

// Saglabātie iestatījumi, kas var būt bojāti un radīt kļūdu jau pie palaišanas
const STORED_KEYS = ['apiUrl', 'user', 'token', 'ajaxMethod', 'slowMode'];

// Ja kāds komponents renderēšanas laikā izmet kļūdu, React citādi noņem VISU lapu (paliek tukša lapa).
// Šis komponents to notver un parāda saprotamu ziņojumu ar iespēju atgūties.
// Kļūdu robežas notver kļūdas renderēšanā; kļūdas notikumu apstrādātājos un async kodā tās nenotver.
// (Tāpēc tā ir klase: React pagaidām atbalsta kļūdu robežas tikai klašu komponentēm.)
export default class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('React kļūda:', error, info.componentStack);
    }

    tryAgain = () => {
        this.setState({ error: null });
    };

    clearAndReload = () => {
        STORED_KEYS.forEach((key) => Api.store.remove(key));
        window.location.reload();
    };

    render() {
        const { error } = this.state;
        if (!error) return this.props.children;

        return (
            <main className="container">
                <div className="card error-screen" role="alert">
                    <h1>Kaut kas nogāja greizi</h1>
                    <p className="lead">Lapā notika neparedzēta kļūda. Dati serverī nav bojāti.</p>
                    <pre className="error-details">{String(error?.message ?? error)}</pre>
                    <div className="form-actions">
                        <button type="button" onClick={this.tryAgain}>Mēģināt vēlreiz</button>
                        <button type="button" className="primary" onClick={this.clearAndReload}>
                            Notīrīt saglabātos iestatījumus un pārlādēt
                        </button>
                    </div>
                </div>
            </main>
        );
    }
}
