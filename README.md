# Laravel API klients (React + Vite)

Vienas lapas klients projektam [zirodev23/laravel-api](https://github.com/zirodev23/laravel-api).
Visi pieprasījumi notiek ar AJAX, un rezultāti tiek attēloti ar React komponentiem — lapa netiek pārlādēta.

> Iepriekšējā versija bez React (tīrs HTML, CSS un JavaScript) ir saglabāta git vēsturē:
> `git checkout bb10f95`.

## Palaišana

1. Palaid API:
   ```bash
   git clone https://github.com/zirodev23/laravel-api && cd laravel-api
   composer install
   cp .env.example .env && php artisan key:generate
   touch database/database.sqlite
   php artisan migrate --seed               # lomas, lietotāji un demo ieraksti
   php artisan serve                        # http://127.0.0.1:8000
   ```
2. Palaid klientu (vajag Node.js):
   ```bash
   npm install
   npm run dev                              # http://127.0.0.1:5500
   ```
3. Ja API darbojas uz cita porta, nomaini adresi sadaļā **Pieprasījumi** un spied „Saglabāt”.

Citas komandas: `npm run build` izveido gatavo versiju mapē `dist/`, `npm run preview` to parāda.

Demo lietotāji (parole visiem `password`): `anna@example.com`, `janis@example.com`, `liga@example.com`, `admin@example.com`.

## Struktūra

```
src/
├── main.jsx            ieejas punkts: ieliek <App /> lapā
├── App.jsx             saknes komponents: stāvoklis, sesija, izkārtojums
├── AppContext.js       konteksts, ko lieto visi komponenti (lietotājs, ieraksti…)
├── api.js              AJAX: fetch vai XMLHttpRequest, JSON, tokens, kļūdu teksti
├── format.js           datumu, statusu un paroļu slēpšanas palīgfunkcijas
├── styles.css          visa izskata CSS
├── hooks/              atkārtoti lietojama loģika
│   ├── useHashView.js    navigācija ar #hash (bez pārlādes)
│   ├── usePosts.js       ierakstu saraksts un tā stāvoklis
│   ├── useRunner.js      izpilda API izsaukumu un parāda spinneri pogā
│   ├── useToast.js       īslaicīgie paziņojumi
│   ├── useLoadingBar.js  josla augšā, kamēr notiek pieprasījumi
│   └── useRequestLog.js  pieprasījumu žurnāls
├── components/         mazi atkārtoti lietojami elementi (NavBar, PostCard, Comments, Spinner…)
└── views/              piecas lapas: PostsView, NewPostView, RolesView, AccountView, LogView
```

## Kā tas atbilst iepriekšējai versijai bez React

| Iepriekš | Tagad |
|---|---|
| `js/api.js` (`const Api = (() => …)()`) | `src/api.js` — tas pats kods kā ES modulis (`import` / `export`) |
| `js/ui.js` (`UI.el(...)`, `replaceChildren`) | komponenti ar JSX; React pats atjauno DOM |
| `js/app.js` (notikumu klausītāji, `state`) | hooki (`useState`, `useEffect`) un komponentu notikumi (`onClick`, `onSubmit`) |
| `hashchange` klausītājs | `useHashView` hooks |
| `button.classList.add('loading')` | `<Button loading={…}>` |

Galvenā atšķirība: iepriekš kods **pats mainīja DOM** (`replaceChildren`, `classList`…), tagad komponents **apraksta, kā lapai jāizskatās** pie dotā stāvokļa, un React pats veic izmaiņas.
Teksts joprojām tiek ievietots kā teksts, nevis HTML (JSX to dara pats), tāpēc ieraksts ar `<script>` netiek izpildīts.

## Divas AJAX metodes vienam uzdevumam

Sadaļā **Ieraksti** ir slēdzis „AJAX metode”. Visi pieprasījumi (ieraksti, komentāri, pieslēgšanās…) tiek veikti ar izvēlēto metodi, un rezultāts lapā ir tieši tāds pats. Kods atrodas `src/api.js`:

| Metode | Funkcija | Kā darbojas |
|---|---|---|
| **fetch API + async/await** | `sendWithFetch()` | `await fetch(...)` atgriež Promise; `await response.text()` nolasa atbildi |
| **XMLHttpRequest** | `sendWithXhr()` | `xhr.open()`, `xhr.send()`, un atbildi saņem notikumos `onload` / `onerror` / `ontimeout`; ietīts Promise, lai pārējais kods nemainās |

Abas funkcijas saņem vienādus datus (metode, adrese, galvenes, ķermenis) un atgriež `{ status, text }`. Pieprasījumu žurnālā (sadaļa **Pieprasījumi**) pie katra pieprasījuma redzams, ar kuru metodi tas nosūtīts (`fetch` vai `XHR`).

## Ielādes indikatori

- **Josla navigācijas apakšā** — redzama, kamēr kaut viens pieprasījums gaida atbildi (`useLoadingBar`; `api.js` skaita gaidošos pieprasījumus).
- **Spinneris ierakstu sarakstā un komentāros** — kamēr dati tiek ielādēti.
- **Spinneris pogā** — poga tiek bloķēta un rāda griežošos aplīti, kamēr tās pieprasījums tiek izpildīts.
- **„Simulēt lēnu savienojumu”** — pievieno 1,5 s aizkavi, lai indikatorus var mierīgi parādīt (lokāli atbildes nāk pārāk ātri).

## Galapunkti

| Metode | Galapunkts | Kur lapā |
|---|---|---|
| POST | `/api/register` | Reģistrēties |
| POST | `/api/login` | Pieslēgties |
| POST | `/api/logout` | Iziet |
| GET | `/api/user` | Mans konts |
| GET | `/api/posts` | Ierakstu saraksts, „Rādīt visus” |
| GET | `/api/posts/{id}` | „Atrast” pēc ID |
| POST | `/api/posts` | Jauns ieraksts |
| PUT | `/api/posts/{id}` | Rediģēt |
| DELETE | `/api/posts/{id}` | Dzēst |
| PATCH | `/api/posts/{id}/status` | public / private izvēlne |
| GET | `/api/posts/{id}/comments` | Komentāri |
| POST | `/api/posts/{id}/comments` | Pievienot komentāru |
| DELETE | `/api/posts/{id}/comments/{id}` | Dzēst komentāru |
| POST | `/api/users/{id}/assign-role` | Lomas → Piešķirt (tikai administrators) |
| POST | `/api/users/{id}/remove-role` | Lomas → Noņemt (tikai administrators) |

Privātos ierakstus (un to komentārus) redz tikai to autors; pārējiem serveris atbild ar 404.
