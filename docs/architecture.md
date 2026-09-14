# Architecture

На Step 1 frontend состоит из `app → pages → widgets/entities → shared`. Сервер расположен отдельно в `server`; общий транспортный контракт лежит в `shared/contracts`. `shared` не зависит от доменных слоёв: загрузка `OrgTree` и преобразование DTO в граф размещены в `entities/org-node/api`.

`GET /api/org-tree` возвращает плоский массив и `X-Org-Revision`. Клиент валидирует JSON и каждую запись Zod, затем за два линейных прохода создаёт `Map`-индексы nodes, parents и children. Обход от roots назначает уровни и подтверждает достижимость; отдельный обход остатка обнаруживает disconnected cycles. Query cache хранит готовый graph, поэтому рендер дерева не выполняет повторную нормализацию.

На Step 2 `entities/org-node/model/create-org-aggregates` выполняет post-order обход один раз при загрузке. Табличный widget использует готовые агрегаты и только фильтрует/сортирует плоские строки, не пересчитывая поддеревья. Страница владеет `selectedId`; дерево раскрывает предков выбранного извне узла.

На Step 3 `OrgStore` владеет server snapshot, revision и replay-buffer. SSE передаёт минимальный `OrgNodePatch`; клиентская feature применяет его неизменно к TanStack Query cache. Вместо полного пересчёта новые aggregate строятся для изменённого узла и только его цепочки parentId. Несовместимая revision или sync-required восстанавливаются одним refetch.

На Step 4 Nginx раздаёт SPA и проксирует `/api`, отдельно отключая буферизацию SSE. Production images разделяют client и server. `POST /api/search/interpret` принимает только строку естественного языка и возвращает общий Zod-контракт `OrgSearchFilter`; данные организации в интерпретатор не передаются. Сейчас это детерминированный server-side адаптер без ключа, а в дальнейшем он может быть заменён на провайдер Responses API за интерфейсом `SearchInterpreter`. Таблица применяет возвращённый фильтр к уже закэшированным строкам; ошибка endpoint или невалидный ответ переключают UI на обычный поиск по названию.
