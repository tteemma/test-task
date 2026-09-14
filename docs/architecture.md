# Architecture

На Step 1 frontend состоит из `app → pages → widgets/entities → shared`. Сервер расположен отдельно в `server`; общий транспортный контракт лежит в `shared/contracts`. `shared` не зависит от доменных слоёв: загрузка `OrgTree` и преобразование DTO в граф размещены в `entities/org-node/api`.

`GET /api/org-tree` возвращает плоский массив и `X-Org-Revision`. Клиент валидирует JSON и каждую запись Zod, затем за два линейных прохода создаёт `Map`-индексы nodes, parents и children. Обход от roots назначает уровни и подтверждает достижимость; отдельный обход остатка обнаруживает disconnected cycles. Query cache хранит готовый graph, поэтому рендер дерева не выполняет повторную нормализацию.
