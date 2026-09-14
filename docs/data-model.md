# Data model

`OrgNodeDTO` содержит `id`, `name`, `parentId`, `headcount`, `budget`, `performance`, `updatedAt`. `parentId: null` означает root. Численные поля неотрицательны, performance в диапазоне 0–100, timestamp — ISO datetime с timezone.

`OrgGraph` хранит нормализованные `nodesById`, `parentById`, `childrenByParent`, `rootIds`, `levelById` и исходный порядок. Пустой массив корректен. Duplicate ID, отсутствующий parent, self-parent, cycle (в том числе disconnected cycle) и недостижимые вершины отклоняются до рендера. `X-Org-Revision` — неотрицательная целая revision внешнего состояния и обязателен для клиентского контракта.
