import { useCallback, useState } from 'react';
import { useApp } from '../AppContext.js';

// Izpilda API izsaukumu un atceras, kura poga to gaida (lai tai parādītu spinneri).
//   const [busy, perform] = useRunner();
//   await perform('submit', () => Api.login(data), 'Veiksmīgi!');
//   <Button loading={busy === 'submit'}>…</Button>
export function useRunner() {
    const { run } = useApp();
    const [busy, setBusy] = useState(null);

    const perform = useCallback(async (key, task, successMessage) => {
        setBusy(key);
        try {
            return await run(task, successMessage);
        } finally {
            setBusy(null);
        }
    }, [run]);

    return [busy, perform];
}
