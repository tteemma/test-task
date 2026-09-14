# Data model

`OrgNodeDTO` содержит `id`, `name`, `parentId`, `headcount`, `budget`, `performance`, `updatedAt`. `parentId: null` означает root. Численные поля неотрицательны, performance в диапазоне 0–100, timestamp — ISO datetime с timezone.

`OrgGraph` хранит нормализованные `nodesById`, `parentById`, `childrenByParent`, `rootIds`, `levelById` и исходный порядок. Пустой массив корректен. Duplicate ID, отсутствующий parent, self-parent, cycle (в том числе disconnected cycle) и недостижимые вершины отклоняются до рендера. `X-Org-Revision` — неотрицательная целая revision внешнего состояния и обязателен для клиентского контракта.

На Step 2 `OrgAggregate` хранится рядом с графом в query-result: `nodeId`, `level`, `totalHeadcount`, `totalBudget` и `weightedPerformance`. Агрегаты включают сам узел и всех потомков. `weightedPerformance` равен `sum(performance × headcount) / sum(headcount)` или `null`, когда суммарная численность равна нулю.

`OrgNodePatch` содержит `type: 'org-node.patch'`, `revision`, `nodeId`, `updatedAt` и непустой `changes`. В `changes` допустимы только неотрицательные `headcount`, `budget` и `performance` в диапазоне 0–100; структура и имя через live-канал не изменяются.

`OrgSearchFilter` — структурированный результат server-side интерпретации естественного запроса. Он содержит необязательные `name`, `levels`, минимум и максимум для суммарных численности и бюджета, диапазон средней эффективности и сортировку. Все поля, кроме `levels`, nullable; пары minimum/maximum дополнительно валидируются. Фильтр применяется полностью на клиенте к агрегированным строкам, поэтому поиск не требует передачи орг-структуры в AI-слой.
