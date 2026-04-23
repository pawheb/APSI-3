# Opis klas

> **Uwaga techniczna:** Projekt używa Django 4.2 + MongoEngine 0.24 + Django REST Framework 3.14.
> W tym stacku modele nie zawierają getterów, setterów ani metod CRUD - dostęp do pól odbywa się
> bezpośrednio przez atrybuty (np. `user.email`), a operacje na bazie danych są obsługiwane przez
> ViewSety i Serializery DRF. W modelach zostają wyłącznie metody z logiką biznesową.
> Uwierzytelnianie (login, register, refresh token) obsługuje osobna klasa `AuthService`
> korzystająca z `djangorestframework-simplejwt`.

---

![alt text](./diagrams/class_diagram.svg "Diagram klas")

---

## User

Model MongoEngine reprezentujący konto użytkownika. Dziedziczy z `mongoengine.Document`,
co oznacza że jest oddzielną kolekcją w MongoDB. Dane uwierzytelniające obsługuje `AuthService`.

**Atrybuty**

| Atrybut | Typ MongoEngine | Opis |
|---|---|---|
| `id` | ObjectIdField | Unikalny identyfikator, generowany automatycznie przez MongoDB |
| `email` | EmailField (unique=True) | Adres email, używany jako login - musi być unikalny |
| `password_hash` | StringField | Hash hasła generowany przez `djangorestframework-simplejwt` / bcrypt |
| `username` | StringField | Wyświetlana nazwa użytkownika |
| `created_at` | DateTimeField | Data założenia konta, ustawiana automatycznie przy tworzeniu |
| `is_active` | BooleanField | Flaga aktywności konta, używana przez Django do autoryzacji |

**Metody biznesowe**

| Metoda | Zwraca | Opis |
|---|---|---|
| `deactivate()` | void | Ustawia `is_active = False` i zapisuje - miękkie usunięcie konta bez kasowania danych |

---

## AuthService

Serwis obsługujący uwierzytelnianie. Nie jest modelem MongoEngine - to klasa serwisowa
wywoływana przez widoki DRF. Używa `djangorestframework-simplejwt` do generowania tokenów JWT.

**Metody biznesowe**

| Metoda | Zwraca | Opis |
|---|---|---|
| `register(email, password, username)` | User | Waliduje dane, hashuje hasło, tworzy dokument User w MongoDB |
| `login(email, password)` | `{access, refresh}` | Weryfikuje dane logowania, zwraca parę tokenów JWT (access: 15–60 min, refresh: 7 dni) |
| `refresh_token(refresh)` | `{access}` | Wydaje nowy access token na podstawie ważnego refresh tokenu |

---

## UserPreferences

Model MongoEngine przechowujący preferencje spacerowe. Powiązany z User przez `ReferenceField`.
Używany przez `RouteOptimizer` przy wyznaczaniu trasy.

**Atrybuty**

| Atrybut | Typ MongoEngine | Opis |
|---|---|---|
| `id` | ObjectIdField | Unikalny identyfikator |
| `user` | ReferenceField(User) | Referencja do właściciela - przy usunięciu Usera kaskadowo usuwane |
| `noise_level` | IntField (min=1, max=5) | Akceptowalny poziom hałasu (1 = tylko ciche ulice, 5 = bez ograniczeń) |
| `lighting_level` | IntField (min=1, max=5) | Wymagane oświetlenie (1 = tylko dobrze oświetlone trasy, 5 = bez ograniczeń) |
| `max_distance_km` | FloatField | Maksymalna długość trasy w kilometrach |
| `prefer_green_areas` | BooleanField | Czy algorytm ma maksymalizować udział terenów zielonych |

**Metody biznesowe**

| Metoda | Zwraca | Opis |
|---|---|---|
| `reset_to_defaults()` | void | Przywraca wszystkie pola do wartości domyślnych zdefiniowanych w modelu |

---

## Route

Model MongoEngine reprezentujący wyznaczoną trasę. `GeoPoint` jest przechowywany jako
`EmbeddedDocument` - nie jako osobna kolekcja. Trasa jest wyznaczana przez `RouteOptimizer`,
a nie przez samą klasę.

**Atrybuty**

| Atrybut | Typ MongoEngine | Opis |
|---|---|---|
| `id` | ObjectIdField | Unikalny identyfikator |
| `user` | ReferenceField(User) | Właściciel trasy |
| `start_point` | EmbeddedDocumentField(GeoPoint) | Punkt startowy wybrany przez użytkownika na mapie |
| `end_point` | EmbeddedDocumentField(GeoPoint) | Punkt końcowy wybrany przez użytkownika na mapie |
| `waypoints` | EmbeddedDocumentListField(GeoPoint) | Lista punktów pośrednich definiujących przebieg trasy |
| `distance_km` | FloatField | Całkowita długość trasy w kilometrach |
| `green_area_ratio` | FloatField (min=0.0, max=1.0) | Udział terenów zielonych w trasie obliczony przez RouteOptimizer |

**Metody biznesowe**

Brak - Route jest czystym modelem danych. Tworzenie trasy należy do `RouteOptimizer`,
a operacje CRUD obsługuje `RouteViewSet` w DRF.

---

## Walk

Model MongoEngine reprezentujący pojedynczy spacer. Przechowuje zarówno planowaną trasę
(przez `ReferenceField` do Route) jak i rzeczywistą ścieżkę (`actual_path`).

**Atrybuty**

| Atrybut | Typ MongoEngine | Opis |
|---|---|---|
| `id` | ObjectIdField | Unikalny identyfikator |
| `user` | ReferenceField(User) | Użytkownik wykonujący spacer |
| `route` | ReferenceField(Route) | Planowana trasa będąca podstawą spaceru |
| `started_at` | DateTimeField | Czas naciśnięcia "Start" przez użytkownika |
| `ended_at` | DateTimeField | Czas zakończenia lub anulowania spaceru |
| `status` | StringField (choices=WalkStatus) | Aktualny stan spaceru - wartości z enumeracji WalkStatus |
| `actual_path` | EmbeddedDocumentListField(GeoPoint) | Rzeczywista ścieżka GPS nagrana podczas spaceru |

**Metody biznesowe**

| Metoda | Zwraca | Opis |
|---|---|---|
| `start()` | void | Ustawia `started_at = now()` i `status = IN_PROGRESS`, zapisuje dokument |
| `stop()` | void | Ustawia `ended_at = now()` i `status = COMPLETED`, wyzwala obliczenie statystyk |
| `cancel()` | void | Ustawia `status = CANCELLED` - spacer przerwany przed ukończeniem trasy |

---

## WalkStatistics

Model MongoEngine z obliczonymi statystykami spaceru. Tworzony automatycznie po wywołaniu
`walk.stop()`. Jako embedded document jest częścią dokumentu Walk, nie osobną kolekcją.

**Atrybuty**

| Atrybut | Typ MongoEngine | Opis |
|---|---|---|
| `distance_km` | FloatField | Faktyczny dystans obliczony z `actual_path` metodą Haversine |
| `green_area_km` | FloatField | Część dystansu przebyta przez tereny zielone wg danych z MapService |
| `duration_min` | IntField | Czas trwania spaceru w minutach (`ended_at - started_at`) |

**Metody biznesowe**

| Metoda | Zwraca | Opis |
|---|---|---|
| `calculate(walk)` | WalkStatistics | Oblicza wszystkie pola na podstawie `actual_path` i danych z MapService |

> Statystyki sumaryczne (łączny dystans, liczba spacerów) są obliczane przez `WalkViewSet`
> w DRF przez agregację MongoDB - nie są przechowywane jako osobne pole.

---

## GeoPoint

`EmbeddedDocument` MongoEngine - nie ma własnej kolekcji w MongoDB, jest przechowywany
wewnątrz dokumentów Route i Walk. Używa natywnego indeksu geospatial MongoDB (`2dsphere`).

**Atrybuty**

| Atrybut | Typ MongoEngine | Opis |
|---|---|---|
| `lat` | FloatField | Szerokość geograficzna (latitude), zakres -90 do 90 |
| `lng` | FloatField | Długość geograficzna (longitude), zakres -180 do 180 |
| `address` | StringField | Opcjonalny czytelny adres - wypełniany przez reverse geocoding |

**Metody biznesowe**

| Metoda | Zwraca | Opis |
|---|---|---|
| `to_geojson()` | dict | Konwertuje punkt do formatu GeoJSON `{"type": "Point", "coordinates": [lng, lat]}` wymaganego przez Leaflet.js |
| `distance_to(other: GeoPoint)` | float | Oblicza odległość w kilometrach do innego punktu wzorem Haversine |
| `is_in_green_area()` | bool | Odpytuje MapService czy punkt leży na terenie zielonym wg danych `api.um.warszawa.pl` |

---

## WalkStatus

Enumeracja jako stałe klasy Python (`TextChoices`). Używana jako `choices` w polu
`StringField` modelu Walk.

| Wartość | Opis |
|---|---|
| `IN_PROGRESS` | Spacer aktualnie trwa |
| `COMPLETED` | Spacer zakończony przez użytkownika po przebyciu trasy |
| `CANCELLED` | Spacer przerwany przed ukończeniem trasy |
| `PAUSED` | Spacer wstrzymany tymczasowo |

---

## MapService

Interfejs (abstrakcyjna klasa Python z `abc.ABC`) definiujący kontrakt dla serwisów mapowych.
`RouteOptimizer` zależy od tego interfejsu, a nie od konkretnej implementacji -
umożliwia podmianę źródła danych bez zmiany logiki biznesowej (zasada DIP).

**Metody**

| Metoda | Zwraca | Opis |
|---|---|---|
| `get_green_areas(bbox)` | [Area] | Pobiera listę terenów zielonych w podanym obszarze mapy |
| `get_noise_level(point)` | float | Pobiera poziom hałasu dla danego punktu geograficznego |
| `get_lighting(bbox)` | [Zone] | Pobiera strefy oświetlenia ulicznego w podanym obszarze |
| `get_map_tiles()` | TileURL | Zwraca URL do kafelków mapy kompatybilnych z Leaflet.js |

---

## LeafletMapService

Konkretna implementacja `MapService`. Wykonuje zapytania HTTP do zewnętrznych API Warszawy
i zwraca dane w formacie wymaganym przez `RouteOptimizer`. Wyniki są cachowane w Redis
(TTL: 1 godzina) żeby nie przekraczać limitów zewnętrznych API.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `api_url` | str | `https://api.um.warszawa.pl` - dane o terenach zielonych |
| `wms_url` | str | `https://wms.um.warszawa.pl` - dane o oświetleniu i poziomie hałasu |
| `opendata_url` | str | URL do dodatkowych zbiorów OpenData Warszawy |

Implementuje wszystkie metody interfejsu `MapService`. Brak dodatkowych metod publicznych.

---

## RouteOptimizer

Serwis odpowiedzialny za wyznaczenie optymalnej trasy. Nie jest modelem MongoEngine -
to klasa serwisowa wywoływana przez `RouteViewSet`. Otrzymuje `MapService` przez
dependency injection, co umożliwia łatwe testowanie z mockiem.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `map_service` | MapService | Wstrzyknięta implementacja serwisu mapowego (domyślnie `LeafletMapService`) |
| `weight_noise` | float | Waga kryterium hałasu w funkcji oceny ścieżki |
| `weight_green` | float | Waga kryterium terenów zielonych w funkcji oceny ścieżki |
| `weight_light` | float | Waga kryterium oświetlenia w funkcji oceny ścieżki |

**Metody biznesowe**

| Metoda | Zwraca | Opis |
|---|---|---|
| `optimize(start, end, prefs)` | Route | Główna metoda - pobiera dane z MapService, generuje kandydatów na trasę, wybiera najlepszą i zwraca obiekt Route gotowy do zapisu |
| `score_path(waypoints)` | float | Ocenia jakość ścieżki jako sumę ważoną: `weight_noise * hałas + weight_green * zieleń + weight_light * oświetlenie` |
