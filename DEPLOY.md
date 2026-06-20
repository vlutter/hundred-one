# Деплой «100 к 1» на Ubuntu-сервер

Приложение — статический SPA (Vite + React), которое собирается в Docker-образ и отдаётся через nginx.

Автодеплой срабатывает при каждом push в ветку `main` через GitHub Actions.

---

## Что понадобится

- Ubuntu Server 22.04+ (или другой Linux с Docker)
- SSH-доступ к серверу
- Репозиторий на GitHub: https://github.com/vlutter/hundred-one

---

## 1. Подготовка сервера (один раз)

Подключитесь по SSH:

```bash
ssh user@your-server-ip
```

### Установка Docker

```bash
sudo apt update
sudo apt install -y ca-certificates curl git

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Выйдите из SSH и зайдите снова, чтобы группа `docker` применилась.

Проверка:

```bash
docker --version
docker compose version
```

### Клонирование проекта

```bash
sudo mkdir -p /opt/hundred-one
sudo chown "$USER":"$USER" /opt/hundred-one
git clone https://github.com/vlutter/hundred-one.git /opt/hundred-one
cd /opt/hundred-one
```

Для **приватного** репозитория настройте Deploy Key в GitHub (Settings → Deploy keys) и клонируйте по SSH:

```bash
git clone git@github.com:vlutter/hundred-one.git /opt/hundred-one
```

### Первый ручной запуск

```bash
cd /opt/hundred-one
docker compose up -d --build
```

Приложение будет доступно на порту **8080**: `http://your-server-ip:8080`

Чтобы изменить порт, создайте файл `.env` рядом с `docker-compose.yml`:

```env
APP_PORT=8080
```

### Открытие порта в firewall (если используется ufw)

```bash
sudo ufw allow 8080/tcp
sudo ufw reload
```

---

## 2. Настройка GitHub Actions

В репозитории откройте **Settings → Secrets and variables → Actions** и добавьте секреты:

| Секрет | Обязательный | Пример | Описание |
|--------|--------------|--------|----------|
| `SSH_HOST` | да | `203.0.113.10` | IP или домен сервера |
| `SSH_USER` | да | `deploy` | SSH-пользователь |
| `SSH_PRIVATE_KEY` | да | содержимое `id_ed25519` | Приватный ключ для входа на сервер |
| `SSH_PORT` | нет | `22` | SSH-порт (по умолчанию 22) |
| `DEPLOY_PATH` | нет | `/opt/hundred-one` | Путь к проекту на сервере |

### SSH-ключ для деплоя

На **локальной машине**:

```bash
ssh-keygen -t ed25519 -C "github-actions-hundred-one" -f ~/.ssh/hundred-one-deploy -N ""
```

Публичный ключ добавьте на сервер:

```bash
ssh-copy-id -i ~/.ssh/hundred-one-deploy.pub user@your-server-ip
```

Приватный ключ (`~/.ssh/hundred-one-deploy`) целиком вставьте в секрет `SSH_PRIVATE_KEY` в GitHub.

---

## 3. Как работает автодеплой

Workflow: `.github/workflows/deploy.yml`

При push в `main` GitHub Actions:

1. Подключается к серверу по SSH
2. В каталоге деплоя выполняет `git fetch` и `git reset --hard origin/main`
3. Запускает `docker compose up -d --build`
4. Удаляет неиспользуемые Docker-образы

Ручной запуск: **Actions → Deploy to Ubuntu → Run workflow**.

---

## 4. Полезные команды на сервере

```bash
cd /opt/hundred-one

# Статус контейнера
docker compose ps

# Логи
docker compose logs -f

# Пересборка после изменения game-config.json
docker compose up -d --build

# Остановка
docker compose down
```

> **Важно:** `game-config.json` вшивается в сборку на этапе `npm run build`. После изменения конфига нужна пересборка образа (`docker compose up -d --build`).

---

## 5. HTTPS и домен (опционально)

Для production рекомендуется поставить reverse proxy (Caddy или nginx) перед контейнером.

Пример: контейнер слушает `127.0.0.1:8080`, а Caddy на 443 проксирует на него и выпускает Let's Encrypt-сертификат.

Минимальный `Caddyfile`:

```caddy
your-domain.example {
    reverse_proxy 127.0.0.1:8080
}
```

В `docker-compose.yml` можно привязать порт только к localhost:

```yaml
ports:
  - "127.0.0.1:8080:80"
```

---

## 6. Локальная проверка Docker-сборки

```bash
docker compose up --build
```

Откройте http://localhost:8080

---

## 7. Устранение неполадок

| Проблема | Решение |
|----------|---------|
| GitHub Action падает с «not a git repository» | Выполните шаг 1 (клонирование) на сервере |
| `Permission denied (publickey)` | Проверьте `SSH_PRIVATE_KEY`, `SSH_USER`, `SSH_HOST` |
| Сайт не открывается снаружи | Проверьте `ufw`, security group облака, порт `APP_PORT` |
| Старый конфиг игры | Пересоберите: `docker compose up -d --build` |
| Контейнер не стартует | `docker compose logs` — смотрите вывод nginx |
