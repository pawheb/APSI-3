# Opis klas diagramu klasowego

![alt text](./diagrams/class_diagram.svg)

## User

Reprezentuje konto użytkownika w systemie. Przechowuje dane uwierzytelniające i podstawowe informacje profilowe.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `id` | ObjectId | Unikalny identyfikator w bazie MongoDB |
| `email` | str | Adres email, używany do logowania |
| `password_hash` | str | Hash hasła (bcrypt/argon2), nigdy plaintext |
| `username` | str | Wyświetlana nazwa użytkownika |
| `created_at` | datetime | Data i czas założenia konta |
| `is_active` | bool | Flaga określająca czy konto jest aktywne |

**Metody**

| Metoda | Zwraca | Opis |
|---|---|---|
| `register(email, password)` | User | Tworzy nowe konto, hashuje hasło przed zapisem |
| `login(email, password)` | JWT | Weryfikuje dane i wydaje parę tokenów access + refresh |
| `update_profile()` | void | Aktualizuje dane profilowe użytkownika |
| `deactivate()` | void | Dezaktywuje konto bez usuwania danych z bazy |

---

## UserPreferences

Przechowuje preferencje spacerowe powiązane z konkretnym użytkownikiem. Używane przez RouteOptimizer do dopasowania trasy.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `id` | ObjectId | Unikalny identyfikator w bazie MongoDB |
| `user_id` | ObjectId | Referencja do właściciela preferencji |
| `noise_level` | int (1–5) | Akceptowalny poziom hałasu na trasie (1 = cisza, 5 = bez ograniczeń) |
| `lighting_level` | int (1–5) | Wymagany poziom oświetlenia (1 = tylko dobrze oświetlone, 5 = bez ograniczeń) |
| `max_distance_km` | float | Maksymalna długość trasy w kilometrach |
| `prefer_green_areas` | bool | Czy trasa powinna maksymalizować bliskość terenów zielonych |

**Metody**

| Metoda | Zwraca | Opis |
|---|---|---|
| `save()` | void | Zapisuje lub aktualizuje preferencje w bazie danych |
| `get_by_user(user_id)` | Prefs | Pobiera preferencje dla danego użytkownika |
| `reset_to_defaults()` | void | Przywraca wszystkie preferencje do wartości domyślnych |

---

## Route

Reprezentuje wyznaczoną trasę spacerową między dwoma punktami. Trasa jest obliczana przez RouteOptimizer na podstawie preferencji użytkownika.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `id` | ObjectId | Unikalny identyfikator w bazie MongoDB |
| `user_id` | ObjectId | Referencja do użytkownika, który stworzył trasę |
| `start_point` | GeoPoint | Punkt początkowy trasy |
| `end_point` | GeoPoint | Punkt końcowy trasy |
| `waypoints` | [GeoPoint] | Lista punktów pośrednich definiujących przebieg trasy |
| `distance_km` | float | Całkowita długość trasy w kilometrach |
| `green_area_ratio` | float | Udział terenów zielonych w trasie (0.0–1.0) |

**Metody**

| Metoda | Zwraca | Opis |
|---|---|---|
| `calculate(prefs)` | Route | Wywołuje RouteOptimizer i zwraca optymalną trasę dla danych preferencji |
| `get_by_id(id)` | Route | Pobiera trasę po identyfikatorze |
| `list_by_user(user_id)` | [Route] | Zwraca wszystkie trasy danego użytkownika |
| `delete()` | void | Usuwa trasę z bazy danych |

---

## Walk

Reprezentuje konkretny spacer — pojedyncze użycie trasy przez użytkownika. Zapisuje rzeczywisty przebieg spaceru, który może różnić się od planowanej trasy.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `id` | ObjectId | Unikalny identyfikator w bazie MongoDB |
| `user_id` | ObjectId | Referencja do użytkownika wykonującego spacer |
| `route_id` | ObjectId | Referencja do planowanej trasy |
| `started_at` | datetime | Czas rozpoczęcia spaceru |
| `ended_at` | datetime | Czas zakończenia spaceru |
| `status` | WalkStatus | Aktualny stan spaceru |
| `actual_path` | [GeoPoint] | Rzeczywista ścieżka przebyta przez użytkownika |

**Metody**

| Metoda | Zwraca | Opis |
|---|---|---|
| `start()` | void | Rozpoczyna spacer, ustawia `started_at` i status `IN_PROGRESS` |
| `stop()` | void | Kończy spacer, ustawia `ended_at` i status `COMPLETED` lub `CANCELLED` |
| `repeat(walk_id)` | Walk | Tworzy nowy spacer na podstawie trasy poprzedniego |
| `list_by_user(user_id)` | [Walk] | Zwraca historię spacerów danego użytkownika |

---

## WalkStatistics

Przechowuje obliczone statystyki dla pojedynczego spaceru. Tworzona automatycznie po zakończeniu spaceru, nierozerwalnie z nim powiązana.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `id` | ObjectId | Unikalny identyfikator w bazie MongoDB |
| `walk_id` | ObjectId | Referencja do spaceru, którego dotyczą statystyki |
| `distance_km` | float | Faktyczny dystans przebyty podczas spaceru |
| `green_area_km` | float | Dystans przebyty przez tereny zielone |
| `duration_min` | int | Czas trwania spaceru w minutach |
| `total_walks` | int | Łączna liczba spacerów użytkownika (statystyka sumaryczna) |

**Metody**

| Metoda | Zwraca | Opis |
|---|---|---|
| `calculate(walk)` | Statistics | Oblicza wszystkie statystyki na podstawie danych z zakończonego spaceru |
| `get_summary(user_id)` | dict | Zwraca zagregowane statystyki wszystkich spacerów użytkownika |

---

## GeoPoint

Klasa pomocnicza reprezentująca punkt geograficzny. Używana jako embedded document w MongoDB — nie jest oddzielną kolekcją.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `lat` | float | Szerokość geograficzna (latitude) |
| `lng` | float | Długość geograficzna (longitude) |
| `address` | str | Opcjonalny czytelny adres punktu |

**Metody**

| Metoda | Zwraca | Opis |
|---|---|---|
| `to_geojson()` | dict | Konwertuje punkt do formatu GeoJSON kompatybilnego z Leaflet.js |
| `distance_to(other: GeoPoint)` | float | Oblicza odległość w kilometrach do innego punktu (wzór Haversine) |
| `is_in_green_area()` | bool | Sprawdza przez MapService czy punkt leży na terenie zielonym |

---

## WalkStatus

Enumeracja określająca możliwe stany spaceru.

| Wartość | Opis |
|---|---|
| `IN_PROGRESS` | Spacer trwa |
| `COMPLETED` | Spacer zakończony poprawnie |
| `CANCELLED` | Spacer przerwany przez użytkownika |
| `PAUSED` | Spacer wstrzymany |

---

## MapService

Interfejs definiujący kontrakt dla serwisów mapowych. Dzięki niemu RouteOptimizer jest niezależny od konkretnego dostawcy danych — można podmienić implementację bez zmiany logiki biznesowej.

**Metody**

| Metoda | Zwraca | Opis |
|---|---|---|
| `get_green_areas()` | [Area] | Pobiera listę terenów zielonych w okolicy |
| `get_noise_level()` | float | Pobiera poziom hałasu dla danego obszaru |
| `get_lighting()` | [Zone] | Pobiera dane o strefach oświetlenia |
| `get_map_tiles()` | TileURL | Zwraca URL do kafelków mapy dla Leaflet.js |

---

## LeafletMapService

Konkretna implementacja interfejsu MapService. Łączy się z zewnętrznymi API Warszawy i serwuje dane do RouteOptimizera.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `api_url` | str | URL do `api.um.warszawa.pl` — dane o terenach zielonych |
| `wms_url` | str | URL do `wms.um.warszawa.pl` — dane o oświetleniu i hałasie |
| `opendata_url` | str | URL do dodatkowych zbiorów danych OpenData Warszawy |

Implementuje wszystkie metody interfejsu `MapService`. Brak dodatkowych metod publicznych.

---

## RouteOptimizer

Serwis odpowiedzialny za wyznaczenie optymalnej trasy spacerowej. Przyjmuje dwa punkty i preferencje użytkownika, a następnie oblicza najlepszą ścieżkę uwzględniając hałas, oświetlenie i tereny zielone.

**Atrybuty**

| Atrybut | Typ | Opis |
|---|---|---|
| `map_service` | MapService | Wstrzyknięta implementacja serwisu mapowego |
| `weight_noise` | float | Waga kryterium hałasu w algorytmie optymalizacji |
| `weight_green` | float | Waga kryterium terenów zielonych w algorytmie optymalizacji |
| `weight_light` | float | Waga kryterium oświetlenia w algorytmie optymalizacji |

**Metody**

| Metoda | Zwraca | Opis |
|---|---|---|
| `optimize(start, end, prefs)` | Route | Główna metoda — wyznacza optymalną trasę między punktami na podstawie preferencji |
| `score_path(waypts)` | float | Ocenia jakość proponowanej ścieżki jako suma ważona kryteriów |
