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
└── views/              sešas lapas: PostsView, NewPostView, RolesView, JokesView, AccountView, LogView
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

## Jokes: ārējs API ar filtriem

Navigācijas joslā sadaļa **Jokes** parāda jokus no publiskā [JokeAPI](https://v2.jokeapi.dev) (`GET https://v2.jokeapi.dev/joke/{kategorijas}`). Tas ir cits serviss nekā mūsu Laravel API, tāpēc darbojas bez pieslēgšanās. Filtrus apstrādā pats JokeAPI, mēs tikai sakārtojam pieprasījuma parametrus:

| Filtrs lapā | JokeAPI parametrs | Piemērs |
|---|---|---|
| Kategorijas (ja nekas nav atzīmēts: visas) | ceļa daļa | `/joke/Programming,Pun` |
| Slēdzis „Rādīt arī Dark jokus” | ceļa daļa | ieslēgts: `/joke/Programming,Dark`; izslēgts: visas kategorijas bez Dark |
| Veids: viena rinda / ievads + atbilde | `type` | `type=twopart` |
| Valoda | `lang` | `lang=de` |
| Meklēt tekstā | `contains` | `contains=bug` |
| Daudzums (1–10) | `amount` | `amount=5` |
| Slēdzis „Tikai droši joki” | `safe-mode` | `…&safe-mode` |
| Slēpt jokus (NSFW, politiski…) | `blacklistFlags` | `blacklistFlags=nsfw,racist` |

- Katrs filtrs ir slēdzis ar uzrakstu **Ieslēgts / Izslēgts**, un zem filtriem redzams kopsavilkums „Ieslēgtie filtri”.
- **Dark joki** ir atsevišķs slēdzis (pēc noklusējuma ieslēgts). Ja ir atzīmētas kategorijas, Dark tiek pievienots tām klāt; izslēdzot slēdzi, Dark joki netiek rādīti.
- **Tikai droši joki:** JokeAPI drošajā režīmā Dark jokus neatgriež, tāpēc šis slēdzis Dark slēdzi automātiski izslēdz un pelēko. `safe-mode` jāraksta **bez vērtības** (`safe-mode`, nevis `safe-mode=`), citādi serviss to ignorē, tāpēc kods šo daļu pievieno ar roku.
- Pēc noklusējuma ir ieslēgta slēpšana visiem jutīgajiem jokiem; izslēdz attiecīgos slēdžus, lai tos redzētu.
- Ievada un atbildes jokiem („twopart”) atbilde tiek parādīta pēc pogas „Rādīt atbildi”.
- Ja neviens joks neatbilst filtriem, JokeAPI atbild ar kodu 400 (kļūda 106), un lapa parāda saprotamu paziņojumu.
- Pieprasījumi uz JokeAPI iet caur to pašu kodu kā pārējie (`fetch` vai `XMLHttpRequest`, ielādes josla, žurnāls), un žurnālā redzams serveris un visi filtri.
- **Drošība:** Laravel `Authorization` tokens uz JokeAPI **netiek sūtīts** (`getJokes()` izmanto savas galvenes). Jokus React attēlo kā tekstu, tāpēc ārēja satura HTML netiek izpildīts.
- JokeAPI atļauj 120 pieprasījumus minūtē.

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
