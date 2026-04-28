# Calendar Booking

## Hexlet tests and linter status

[![Actions Status](https://github.com/AfifeAblyakimova/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/AfifeAblyakimova/ai-for-developers-project-386/actions)

API-контракт описан в `main.tsp`. Фронтенд находится в `frontend/` и работает только через HTTP API по этому контракту.

Перед запуском используйте версию Node из `.nvmrc`:

```bash
nvm use
npm install
npm run backend:dev
```

Команда `backend:dev` запускает реальный API с хранением данных в памяти на `http://localhost:3000`.
После перезапуска сервиса созданные типы событий и бронирования сбрасываются.

В другом терминале запустите фронтенд:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Основные страницы:

- `http://localhost:5173/booking` — публичная страница для гостя.
- `http://localhost:5173/admin` — админка владельца календаря.

Команда `mock:api` остается доступной для проверки контракта через Prism: она генерирует OpenAPI из TypeSpec и запускает mock API на `http://127.0.0.1:3000`.

## Docker

Приложение можно собрать в один Docker-образ: внутри контейнера Express запускает API и раздаёт собранный фронтенд с одного порта.

```bash
docker build -t calendar-booking .
docker run --rm -p 3000:3000 -e PORT=3000 calendar-booking
```

После запуска контейнера доступны страницы:

- `http://localhost:3000/booking` — публичная страница для гостя.
- `http://localhost:3000/admin` — админка владельца календаря.

Для деплоя можно использовать этот же `Dockerfile`; платформа должна передать порт запуска через переменную окружения `PORT`. Публичная ссылка будет добавлена после отдельного шага деплоя.

## Интеграционные сценарии

E2E-проверки написаны на Playwright и запускают приложение в реальном браузере вместе с реальным Express API. Перед сценарием тесты настраивают рабочее время через API, чтобы наличие свободных слотов не зависело от дня недели.

Покрытые пользовательские сценарии:

- гость открывает страницу бронирования, выбирает тип события и свободный слот, вводит имя и email, создает бронирование и видит успешное уведомление;
- владелец календаря открывает страницу предстоящих встреч в админке и видит созданное гостем бронирование;
- форма бронирования не позволяет отправить заявку, пока не выбран слот и не заполнено имя гостя.

Локальный запуск:

```bash
nvm use
npm install
cd frontend && npm install && cd ..
npx playwright install chromium
npm run test:e2e
```

Playwright сам поднимает API на `http://127.0.0.1:3000` и фронтенд на `http://127.0.0.1:5173`.
В CI эти проверки запускаются workflow `.github/workflows/e2e.yml`.
