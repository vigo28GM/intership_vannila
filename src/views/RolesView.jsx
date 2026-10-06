import { Api } from '../api.js';
import { useApp } from '../AppContext.js';
import AuthRequired from '../components/AuthRequired.jsx';
import Button from '../components/Button.jsx';
import View from '../components/View.jsx';
import { useRunner } from '../hooks/useRunner.js';

export default function RolesView({ active }) {
    const { user, notify } = useApp();
    const [busy, perform] = useRunner();

    const submit = async (event) => {
        event.preventDefault();
        const action = event.nativeEvent.submitter.value; // 'assign' vai 'remove'
        const { user_id: userId, role_id: roleId } = Object.fromEntries(new FormData(event.currentTarget));
        const call = action === 'remove' ? Api.removeRole : Api.assignRole;
        const result = await perform(action, () => call(userId, Number(roleId)));
        if (result?.message) notify(result.message);
    };

    return (
        <View name="roles" active={active} narrow>
            <header className="page-head">
                <div>
                    <h1>Lietotāju lomas</h1>
                    <p className="lead">Piešķir vai noņem lietotājam lomu. Lietotāja ID redzams pie katra ieraksta („autors #…”).</p>
                </div>
            </header>

            {user ? (
                <div className="card">
                    <form id="role-form" className="stack" onSubmit={submit}>
                        <div className="grid-2">
                            <label>
                                Lietotāja ID
                                <input name="user_id" type="number" min="1" required placeholder="1" />
                            </label>
                            <label>
                                Loma
                                <select name="role_id" defaultValue="1">
                                    <option value="1">guest</option>
                                    <option value="2">admin</option>
                                </select>
                            </label>
                        </div>
                        <div className="form-actions">
                            <Button type="submit" value="remove" className="danger" loading={busy === 'remove'}>Noņemt lomu</Button>
                            <Button type="submit" value="assign" className="primary" loading={busy === 'assign'}>Piešķirt lomu</Button>
                        </div>
                    </form>
                </div>
            ) : (
                <AuthRequired />
            )}

            <p className="endpoints">
                <code>POST /api/users/{'{id}'}/assign-role</code> <code>POST /api/users/{'{id}'}/remove-role</code>
            </p>
        </View>
    );
}
