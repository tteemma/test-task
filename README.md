# Staff Pulse Dashboard

Интерактивный dashboard структуры организации. Проект реализуется поэтапно; сейчас готов **Step 1**: Express API с плоским fixture из 52 узлов, runtime-валидация Zod, проверка графовых инвариантов, нормализация за `O(n)` и дерево подразделений.

## Запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:5173`. API доступен по `http://localhost:3001/api/org-tree`.

Полезные команды: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

`MOCK_DELAY_MS` (по умолчанию 400) управляет задержкой mock API; пример переменных — [.env.example](.env.example).

## Реализованное на первом этапе

- React, TypeScript strict и Vite; Express запускается одной командой с frontend.
- `GET /api/org-tree` возвращает плоский массив из 52 записей и revision header.
- TanStack Query использует `AbortSignal`, cache key `['org-tree']`, `staleTime: 5000`, одну повторную попытку и не refetch-ит на focus.
- Внешний ответ проверяется Zod, далее проверяются duplicate ID, orphan, self-parent, cycle и unreachable nodes.
- UI показывает loading, error с retry и empty states. Корневые узлы открыты — второй уровень сразу виден; вся информационная часть строки дерева — доступная кнопка выбора, а раскрытие остаётся отдельной кнопкой с `aria-expanded`.

## Использование AI

AI-ассистент Codex сгенерировал первоначальные заготовки Vite/React/Express, fixture организации, Zod-контракт, графовую нормализацию, базовые компоненты дерева и черновики документации.

Вручную доработаны: разделение слоёв (запрос и построение графа находятся в `entities/org-node/api`, а не в `shared`), обработка невалидного JSON, тестовые сценарии графа и HTTP-контракта, а также семантика и focus-state строки дерева. Эти правки внесены, чтобы зависимость `shared → entities` отсутствовала, ошибки внешнего API были понятны, а управление деревом соответствовало клавиатурной доступности.

Технический baseline этапа зафиксирован в [docs/foundation.md](docs/foundation.md).
