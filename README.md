# Laravel API klients (vanilla JavaScript)

Vienas lapas klients projektam [zirodev23/laravel-api](https://github.com/zirodev23/laravel-api).
Visi pieprasījumi notiek ar AJAX (`fetch`), un rezultāti tiek ievietoti lapā ar DOM manipulācijām — lapa netiek pārlādēta.

## Palaišana

1. Palaid API:
   ```bash
   git clone https://github.com/zirodev23/laravel-api && cd laravel-api
   composer install
   cp .env.example .env && php artisan key:generate
   touch database/database.sqlite
   php artisan migrate
   php artisan db:seed --class=RoleSeeder   # lomas guest (1) un admin (2)
   php artisan serve                        # http://127.0.0.1:8000
   ```
2. Atver `index.html` pārlūkā (vai ar VS Code "Live Server").
3. Ja API darbojas uz cita porta, nomaini adresi augšā un spied "Saglabāt".

## Struktūra

| Fails | Uzdevums |
|---|---|
| `js/api.js` | **AJAX** — pieprasījumi ar `fetch()` vai `XMLHttpRequest`, JSON, `Authorization: Bearer` tokens, kļūdu apstrāde, ielādes skaitītājs |
| `js/ui.js` | **DOM** — `createElement`, `replaceChildren`, `prepend`, `replaceWith`, `remove` |
| `js/app.js` | Notikumi (`submit`, `click`, `change`) un `event.preventDefault()`, lai forma nepārlādētu lapu; navigācija starp sadaļām ar `#hash` un `hashchange` notikumu |

Navigācijas joslā ir sadaļas **Ieraksti**, **Jauns ieraksts**, **Lomas**, **Pieprasījumi** un **Konts** (augšējā labajā stūrī). Pārslēdzot sadaļu, mainās tikai adreses `#` daļa — lapa netiek pārlādēta.

## Divas AJAX metodes vienam uzdevumam

Lapā, sadaļā **Ieraksti**, ir slēdzis „AJAX metode”. Visi pieprasījumi (ieraksti, komentāri, pieslēgšanās…) tiek veikti ar izvēlēto metodi, un rezultāts lapā ir tieši tāds pats. Kods atrodas `js/api.js`:

| Metode | Funkcija | Kā darbojas |
|---|---|---|
| **fetch API + async/await** | `sendWithFetch()` | `await fetch(...)` atgriež Promise; `await response.text()` nolasa atbildi |
| **XMLHttpRequest** | `sendWithXhr()` | `xhr.open()`, `xhr.send()`, un atbildi saņem notikumos `onload` / `onerror` / `ontimeout`; ietīts Promise, lai pārējais kods nemainās |

Abas funkcijas saņem vienādus datus (metode, adrese, galvenes, ķermenis) un atgriež `{ status, text }`. Pieprasījumu žurnālā (sadaļa **Pieprasījumi**) pie katra pieprasījuma redzams, ar kuru metodi tas nosūtīts (`fetch` vai `XHR`).

## Ielādes indikatori

- **Josla navigācijas apakšā** — redzama, kamēr kaut viens pieprasījums gaida atbildi (`Api.onLoading` skaita gaidošos pieprasījumus).
- **Spinneris ierakstu sarakstā un komentāros** — kamēr dati tiek ielādēti.
- **Spinneris pogā** — poga tiek bloķēta un rāda griežošos aplīti, kamēr tās pieprasījums tiek izpildīts.
- **„Simulēt lēnu savienojumu”** — pievieno 1,5 s aizkavi, lai indikatorus var mierīgi parādīt (lokāli atbildes nāk pārāk ātri).

## Galapunkti

| Metode | Galapunkts | Kur lapā |
|---|---|---|
| POST | `/api/register` | Reģistrēties |
| POST | `/api/login` | Pieslēgties |
| POST | `/api/logout` | Iziet |
| GET | `/api/user` | "Kas es esmu?" |
| GET | `/api/posts` | Ierakstu saraksts, "Rādīt visus" |
| GET | `/api/posts/{id}` | "Atrast" pēc ID |
| POST | `/api/posts` | Jauns ieraksts |
| PUT | `/api/posts/{id}` | Rediģēt |
| DELETE | `/api/posts/{id}` | Dzēst |
| PATCH | `/api/posts/{id}/status` | public / private izvēlne |
| GET | `/api/posts/{id}/comments` | Komentāri |
| POST | `/api/posts/{id}/comments` | Pievienot komentāru |
| DELETE | `/api/posts/{id}/comments/{id}` | Dzēst komentāru |
| POST | `/api/users/{id}/assign-role` | Lomas → Piešķirt |
| POST | `/api/users/{id}/remove-role` | Lomas → Noņemt |

Labajā pusē esošais **pieprasījumu žurnāls** rāda katru AJAX pieprasījumu: metodi, adresi, statusa kodu, laiku, kā arī nosūtītos un saņemtos JSON datus.
