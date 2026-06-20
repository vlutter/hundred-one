# Деплой «100 к 1» на Ubuntu-сервер

Приложение — статический SPA (Vite + React), которое собирается в Docker-образ и отдаётся через nginx внутри контейнера.

На production-сервере перед контейнером ставится **системный nginx** с поддоменом и HTTPS.

Автодеплой срабатывает при каждом push в ветку `main` через GitHub Actions.

---

## Что понадобится

- Ubuntu Server 22.04+ (или другой Linux с Docker)
- SSH-доступ к серверу
- Домен с возможностью добавить A-запись для поддомена
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

Контейнер слушает только **localhost:8080** (порт наружу не открывается):

```bash
curl -I http://127.0.0.1:8080
```

Чтобы изменить порт, создайте файл `.env` рядом с `docker-compose.yml`:

```env
APP_PORT=8080
```

---

## 2. nginx с поддоменом и HTTPS

Схема:

```text
Интернет → nginx на сервере (80/443) → 127.0.0.1:8080 → Docker-контейнер
```

### DNS

В панели домена добавьте A-запись:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `game` (или другой поддомен) | IP вашего сервера |

Пример: `game.example.com` → `203.0.113.10`

### Установка nginx и certbot

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Конфиг nginx

В репозитории есть шаблон: `deploy/nginx/hundred-one.conf`.

Скопируйте его на сервер и замените `game.example.com` на ваш поддомен:

```bash
sudo cp /opt/hundred-one/deploy/nginx/hundred-one.conf /etc/nginx/sites-available/hundred-one
sudo nano /etc/nginx/sites-available/hundred-one
```

Включите сайт:

```bash
sudo ln -sf /etc/nginx/sites-available/hundred-one /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Firewall

Откройте HTTP/HTTPS, порт 8080 наружу не нужен:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw reload
```

### HTTPS (Let's Encrypt)

```bash
sudo certbot --nginx -d game.example.com
```

Certbot добавит SSL и редирект с HTTP на HTTPS. Проверка автообновления:

```bash
sudo certbot renew --dry-run
```

После certbot конфиг будет примерно таким:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name game.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name game.example.com;

    ssl_certificate /etc/letsencrypt/live/game.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/game.example.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Проверка

```bash
curl -I https://game.example.com
sudo systemctl status nginx
docker compose -f /opt/hundred-one/docker-compose.yml ps
```

> После деплоя через GitHub Actions nginx перезапускать не нужно — меняется только контейнер.

---

## 3. Настройка GitHub Actions

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

## 4. Как работает автодеплой

Workflow: `.github/workflows/deploy.yml`

При push в `main` GitHub Actions:

1. Подключается к серверу по SSH
2. В каталоге деплоя выполняет `git fetch` и `git reset --hard origin/main`
3. Запускает `docker compose up -d --build`
4. Удаляет неиспользуемые Docker-образы

Ручной запуск: **Actions → Deploy to Ubuntu → Run workflow**.

---

## 5. Полезные команды на сервере

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

# Логи и статус nginx
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

> **Важно:** `game-config.json` вшивается в сборку на этапе `npm run build`. После изменения конфига нужна пересборка образа (`docker compose up -d --build`).

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
| 502 Bad Gateway | Контейнер не запущен: `docker compose ps`, проверьте `curl http://127.0.0.1:8080` |
| Сайт не открывается по домену | DNS, `ufw allow 'Nginx Full'`, security group облака |
| Certbot не выдаёт сертификат | A-запись должна указывать на IP сервера, порт 80 открыт |
| Старый конфиг игры | Пересоберите: `docker compose up -d --build` |
| Контейнер не стартует | `docker compose logs` — смотрите вывод nginx |
