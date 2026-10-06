import { Api } from '../api.js';
import { useApp } from '../AppContext.js';
import AuthRequired from '../components/AuthRequired.jsx';
import Button from '../components/Button.jsx';
import View from '../components/View.jsx';
import { useRunner } from '../hooks/useRunner.js';

export default function NewPostView({ active }) {
    const { user, posts, go } = useApp();
    const [busy, perform] = useRunner();

    const submit = async (event) => {
        event.preventDefault();
        const form = event.currentTarget; // jāsaglabā pirms await
        const fields = Object.fromEntries(new FormData(form));
        const created = await perform('submit', () => Api.createPost(fields), 'Ieraksts publicēts.');
        if (!created) return;
        posts.add(created);
        form.reset();
        go('posts');
    };

    return (
        <View name="new" active={active} narrow>
            <header className="page-head">
                <div>
                    <h1>Jauns ieraksts</h1>
                    <p className="lead">Ieraksts tiks publicēts tavā vārdā. Sākotnējais statuss ir <b>public</b>.</p>
                </div>
            </header>

            {user ? (
                <div className="card">
                    <form id="post-form" className="stack" onSubmit={submit}>
                        <label>
                            Virsraksts
                            <input name="title" required maxLength={255} placeholder="Piemēram: Mana pirmā diena skolā" />
                        </label>
                        <label>
                            Teksts
                            <textarea name="body" rows={7} required placeholder="Ko vēlies pastāstīt?" />
                        </label>
                        <div className="form-actions">
                            <a href="#posts" className="button ghost">Atcelt</a>
                            <Button type="submit" className="primary" loading={busy === 'submit'}>Publicēt</Button>
                        </div>
                    </form>
                </div>
            ) : (
                <AuthRequired />
            )}

            <p className="endpoints"><code>POST /api/posts</code> — nepieciešams tokens</p>
        </View>
    );
}
