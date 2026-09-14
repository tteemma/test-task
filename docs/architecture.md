# Architecture

На Step 1 frontend состоит из `app → pages → widgets/entities → shared`. Сервер расположен отдельно в `server`; общий транспортный контракт лежит в `shared/contracts`.

`GET /api/org-tree` возвращает плоский массив. Клиент валидирует каждую запись Zod, затем за два линейных прохода создаёт `Map`-индексы nodes, parents и children. Обход от roots назначает уровни и подтверждает достижимость. Query cache хранит готовый graph, поэтому рендер дерева не выполняет повторную нормализацию.
