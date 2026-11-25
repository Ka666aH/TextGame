# Сборка статики фронтенда. pnpm ставим отдельно: в package.json нет поля
# packageManager, а владельческий pnpm-workspace.yaml должен попасть в образ.
FROM node:24-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10

# Сначала только манифесты зависимостей: слой переживает правки исходников.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# build = type-check (vue-tsc --build) + vite build, на выходе dist/.
RUN pnpm build

# Раздача: тот же nginx-конфиг, что и для обычной выкладки, без изменений —
# прокси /api со слешем в proxy_pass, X-Forwarded-For/Proto и SPA-fallback.
# server_name в контейнере роли не играет: это единственный server-блок,
# он же сервер по умолчанию для любого Host.
# Конфиг кладётся шаблоном: образ сам прогоняет его через envsubst при старте,
# поэтому TEXTGAME_FORWARDED_PROTO берётся из окружения, а не хардкодится.
FROM nginx:1.29-alpine
COPY deploy/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
