# Foundation — Step 1

Основа проекта завершена и скорректирована коммитом `fix(step-1): harden foundation and documentation`.

- Слои frontend: `app → pages → widgets/entities → shared`; `shared` не импортирует `entities`.
- `GET /api/org-tree` отдаёт массив `OrgNodeDTO` и обязательный неотрицательный `X-Org-Revision`.
- Клиент отличает HTTP-ошибку, невалидный JSON, невалидный DTO, ошибку revision и отмену запроса.
- Граф создаётся за линейное число проходов, сохраняет входной порядок и отклоняет duplicate, orphan, self-parent и cycles, включая disconnected cycles.
- Дерево доступно с клавиатуры: выбор выполнен нативной кнопкой, а кнопка раскрытия независима и сообщает состояние через `aria-expanded`.

Проверки для этого этапа: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
