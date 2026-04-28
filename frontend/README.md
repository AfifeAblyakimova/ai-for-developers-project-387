# Calendar Booking Frontend

Фронтенд реализован как отдельное Vite + React + TypeScript приложение. UI работает только через API, описанное в `../main.tsp`.

## Запуск

Сначала из корня проекта запустите API или Prism mock:

```bash
nvm use
npm install
npm run mock:api
```

Затем в отдельном терминале:

```bash
cp .env.example .env
npm install
npm run dev
```

В `.env` укажите URL отдельно запущенного API:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

Если API доступно с того же origin, значение можно оставить пустым.

## Сценарии

- `/booking` — публичная страница для гостя: выбор типа события, календарь на ближайшие 14 дней, список слотов на выбранную дату и создание бронирования.
- `/admin` — отдельная админка владельца: управление типами событий и список предстоящих встреч.

## Разработка с Prism

Команда из корня проекта генерирует OpenAPI из TypeSpec и запускает Prism:

```bash
npm run mock:api
```

После этого укажите адрес Prism в `VITE_API_BASE_URL` (`http://localhost:3000`).
