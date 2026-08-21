# EkenLab backend: Verkhovskiy Handoff V2

Статус: ready for backend estimation  
Приоритет: P0  
Владелец реализации: команда EkenLab  
Клиент-контрагент: Verkhovskiy.ai

## 1. Результат

Пользователь подтверждает preview на Verkhovskiy.ai, при необходимости проходит авторизацию EkenLab и получает маршрут именно по выбранному сигналу. Существующий несвязанный черновик не может молча заменить новый handoff.

Frontend уже формирует и валидирует V2 payload, выполняет POST только после явного клика пользователя, ждёт не более 8 секунд и открывает EkenLab только после получения короткоживущего токена.

## 2. API создания handoff

`POST /api/integrations/verkhovskiy/handoffs`

Требования:

- HTTPS only;
- `Content-Type: application/json`;
- CORS allowlist только для production/staging origins Verkhovskiy.ai;
- лимит тела: 32 KB;
- rate limit по IP и анонимному client fingerprint без создания постоянного cross-site identifier;
- endpoint доступен до авторизации;
- повторный POST с тем же `routeId` идемпотентен и возвращает тот же активный handoff;
- новый токен не продлевает исходный TTL бесконечно.

Успешный ответ `201` для нового handoff или `200` для идемпотентного повтора:

```json
{
  "handoffToken": "opaque-one-time-token",
  "expiresAt": "2026-08-21T12:30:00.000Z"
}
```

Токен непрозрачный, криптографически случайный, не содержит payload и не является сериализованным JSON/JWT без шифрования. В URL передаётся только `handoffToken`.

## 3. Входная схема

```ts
type VerkhovskiyHandoffV2 = {
  schemaVersion: "2.0";
  routeId: string;       // уникален для запуска, max 160
  scenarioId: string;    // стабильный CTA/scenario id, max 160
  source: {
    surface: "hero" | "event" | "insight" | "trend" | "model" | "position";
    sourceId: string;    // стабильный id выбранного материала, max 200
    title: string;       // max 500
    url: string;         // https URL Verkhovskiy.ai, max 2000
    reportDate: string;  // YYYY-MM-DD
  };
  audience: {
    viewMode: "expert" | "executive";
    role?: string;       // max 200
    locale: "ru" | "en";
  };
  brief: {
    objective: string;              // 1..4000
    expectedArtifact: string;       // 1..4000
    recipient: string;              // 1..500
    acceptanceCriterion: string;    // 1..4000
    estimatedMinutes: number;       // integer 1..1440
    evidence: string[];              // max 20, each 1..2000
  };
  createdAt: string;  // ISO datetime
  expiresAt: string;  // ISO datetime, createdAt < expiresAt <= createdAt + 30m
};
```

Backend повторно валидирует схему независимо от frontend. Неизвестные top-level поля отклоняются. `source.url` разрешён только с allowlisted origin. HTML/Markdown хранится как текст; никакое поле не рендерится через raw HTML.

## 4. Хранение и жизненный цикл

Минимальная запись:

```ts
type PendingHandoff = {
  tokenHash: string;
  routeId: string;
  payload: VerkhovskiyHandoffV2; // encrypted at rest if shared storage
  state: "pending" | "claimed" | "consumed" | "expired";
  claimedByUserId?: string;
  claimedAt?: string;
  consumedAt?: string;
  expiresAt: string;
};
```

- TTL не более 30 минут с момента `createdAt` клиента; сервер может сократить TTL.
- Хранить только hash токена; сравнение constant-time.
- Один токен может быть claimed только одним аккаунтом.
- После успешного создания/выбора маршрута токен становится `consumed` и не открывает второй маршрут.
- Cleanup удаляет payload истёкших/consumed записей по политике retention; рекомендуемый максимум — 24 часа для диагностики метаданных, содержимое brief удалить сразу после materialization.
- Идемпотентность задаётся уникальным ключом `(integration="verkhovskiy", routeId)`.

## 5. Переход и восстановление после auth

Входная страница:

`GET /integrations/verkhovskiy?handoffToken={opaque}`

Алгоритм:

1. Разрешить token и проверить pending/TTL.
2. Если пользователь не авторизован, сохранить server-side ссылку на pending handoff в auth transaction/session. Не помещать payload в `returnTo`, cookie или query.
3. Отправить пользователя на login с внутренним transaction ID.
4. Login callback привязывает handoff к user ID атомарной операцией claim.
5. После auth снова показать summary выбранного handoff: source title, objective, expected artifact, recipient, acceptance criterion и time.
6. Только после пользовательского подтверждения materialize маршрут.
7. Проверить, что `routeId`, `scenarioId`, `sourceId`, objective и expectedArtifact совпадают с pending payload.

Auth refresh/back должен быть безопасен: один `routeId` не создаёт дубликаты. Истёкший токен не ведёт в общий dashboard или старый draft без объяснения.

## 6. Конфликт с активным черновиком

Если у пользователя есть активный черновик, показать отдельный экран выбора:

- `Создать новый маршрут по выбранному сигналу` — primary/default;
- `Продолжить существующий черновик` — secondary;
- preview обоих вариантов с названиями и датами.

Правила:

- никакого автоматического merge/overwrite;
- выбор существующего черновика не уничтожает pending handoff до явного подтверждения отказа или истечения TTL;
- при создании нового маршрута старый черновик остаётся доступен согласно обычным правилам EkenLab;
- решение пользователя логируется только идентификаторами, без текста brief.

## 7. Ошибки

Единый формат:

```json
{
  "error": {
    "code": "HANDOFF_EXPIRED",
    "message": "Handoff expired",
    "requestId": "req_...",
    "retryable": false
  }
}
```

Коды и HTTP:

| HTTP | Code | Retryable | Значение |
|---|---|---:|---|
| 400 | `HANDOFF_INVALID` | false | payload не прошёл schema/allowlist |
| 401 | `AUTH_REQUIRED` | false | только для authenticated API, не для create |
| 404 | `HANDOFF_NOT_FOUND` | false | неизвестный token |
| 409 | `HANDOFF_ALREADY_CLAIMED` | false | token принадлежит другому user |
| 409 | `ROUTE_CONFLICT` | false | требуется UI выбора draft |
| 410 | `HANDOFF_EXPIRED` | false | TTL истёк |
| 413 | `HANDOFF_TOO_LARGE` | false | body больше лимита |
| 422 | `HANDOFF_INVALID` | false | семантическая валидация |
| 429 | `RATE_LIMITED` | true | вернуть `Retry-After` |
| 500/503 | `HANDOFF_SERVICE_UNAVAILABLE` | true | временная ошибка |

Не возвращать login HTML из JSON endpoint. Ошибка materialization не должна помечать handoff consumed до успешного commit.

## 8. Безопасность и приватность

- Payload и токен запрещены в access/error logs, analytics properties, referrer и crash reports.
- Redaction для `brief.*`, `source.title`, `audience.role`, query `handoffToken`.
- `Referrer-Policy: no-referrer`; `Cache-Control: no-store` для integration/auth страниц и API.
- CSRF protection для authenticated confirm/conflict actions; create защищается строгим CORS, JSON content type, rate limits.
- Защита от replay: token hash, atomic claim/consume, TTL.
- Не доверять audience role для авторизации или выдачи прав.
- Не выполнять URL из payload и не загружать его server-side.
- Шифрование storage/backup; доступ к payload только integration service и materializer.
- Не логировать email, пароль, cookie, auth form values или содержимое старого draft.

## 9. Аналитика

Разрешённые события EkenLab:

- `handoff_token_resolved`;
- `handoff_auth_required`;
- `handoff_auth_restored`;
- `handoff_conflict_shown`;
- `handoff_new_route_selected`;
- `handoff_existing_draft_selected`;
- `handoff_route_created`;
- `handoff_route_opened`;
- `handoff_expired`;
- `handoff_backend_failed`.

Свойства: hashed/opaque route ID, scenario ID, surface, viewMode, locale, latency bucket, result/error code. Запрещены title, objective, artifact, evidence, recipient, email и token.

## 10. Наблюдаемость и SLO

- p95 create latency < 1.5 s; p99 < 4 s.
- Availability create/resolve >= 99.9% за 30 дней.
- Метрики: create success, validation failure, idempotent replay, resolve, auth restore, conflict choice, materialization success, expired, claim conflict.
- Alert: 5xx > 2% за 5 минут или auth-restore success < 95% за 15 минут.
- Request ID проходит create → auth transaction → materialization, но не выводится в пользовательский URL.

## 11. Acceptance criteria

1. Валидный anonymous POST возвращает opaque token; URL/логи не содержат payload.
2. Двойной POST с одним `routeId` создаёт одну запись и возвращает тот же активный handoff.
3. Невалидная схема/чужой origin отклоняются без сохранения payload.
4. После login восстанавливается тот же `routeId`, `scenarioId`, `sourceId`, objective и expectedArtifact.
5. Активный draft вызывает явный conflict UI; default — новый маршрут; overwrite отсутствует.
6. Token claim/consume атомарны; replay и claim другим account отклоняются.
7. После TTL пользователь видит экран истечения с возвратом на Verkhovskiy.ai, а не старый draft.
8. Ошибка materialization сохраняет retryable pending state и не создаёт частичный/дублирующий маршрут.
9. Analytics/logging проходит automated PII/token redaction test.
10. Интеграция работает для RU/EN и expert/executive payload.

## 12. Обязательные integration/E2E тесты

1. Anonymous: preview → create → login → callback → confirm → правильный новый route.
2. Authenticated без draft: create → route preview → confirm → route.
3. Authenticated со старым draft: conflict → new route; старый draft сохранён.
4. Conflict → existing draft; pending handoff не подменяет draft и обрабатывается по явному выбору.
5. Double click/retry: два POST с одним `routeId` → одна запись/route.
6. Browser refresh на login/callback/confirm → без потери или дублирования.
7. Expired, unknown, replayed и claimed-by-other tokens → корректные экраны/коды.
8. Invalid source origin, oversized body, injected HTML и неизвестные поля → reject/escaped output.
9. Simulated DB/materializer outage → retryable error, pending не consumed.
10. Проверка URL, access logs, tracing и analytics на отсутствие brief/token/PII.

## 13. Контракт поставки

Команда EkenLab предоставляет:

- staging endpoint и allowlisted staging origin;
- описание auth callback/claim flow;
- подтверждённый JSON response/error contract;
- migration/cleanup job для pending storage;
- conflict и expired UI;
- integration/E2E suite и evidence по acceptance criteria;
- production endpoint для `VITE_EKEN_HANDOFF_API_URL`.

До появления endpoint Verkhovskiy.ai остаётся в безопасном degraded mode: preview сохраняется, доступны copy и `.md`; отдельная кнопка может открыть EkenLab только с техническими идентификаторами и явным сообщением, что brief не передан.
