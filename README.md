# Дипломный проект

Разработка интеллектуального веб-приложения для проведения конкурентного анализа интерфейсов программного обеспечения. 

## Содержание
- [Структура проекта](#структура-проекта)
- [Предварительные требования](#предварительные-требования)
- [Быстрый старт](#быстрый-старт)
- [Подробная настройка](#подробная-настройка)
  - [1. Настройка сервера (Node.js)](#1-настройка-сервера-nodejs)
  - [2. Настройка клиента (React)](#2-настройка-клиента-react)
  - [3. Настройка AI-сервиса (Python)](#3-настройка-ai-сервиса-python)
- [Запуск проекта](#запуск-проекта)
- [API Endpoints](#api-endpoints)
- [Аутентификация](#аутентификация)
- [Устранение неполадок](#устранение-неполадок)

## Структура проекта

```
diploma/
├── client/                 # React фронтенд (Vite)
│   ├── src/
│   │   ├── components/    # React компоненты (включая AuthModal)
│   │   ├── pages/        # Страницы приложения
│   │   ├── contexts/     # React контексты (AuthContext, ProtectedRoute)
│   │   ├── lib/          # Клиентские библиотеки (supabaseClient)
│   │   └── utils/        # Вспомогательные функции
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js/Express бэкенд
│   ├── server.js         # Основной серверный файл
│   ├── supabaseClient.js # Клиент Supabase
│   ├── package.json
│   └── .env              # Конфигурация окружения
├── ai-service/           # Python AI сервис
│   ├── app.py           # Flask приложение
│   └── requirements.txt # Зависимости Python
└── README.md
```

## Предварительные требования

Перед началом убедитесь, что на вашем компьютере установлены:

- **Node.js** (версия 18 или выше)
- **npm** (обычно устанавливается вместе с Node.js)
- **Python** (версия 3.8 или выше)
- **Git** (для клонирования репозитория)
- **Tesseract OCR** (для работы AI-сервиса)

### Установка Tesseract OCR

#### macOS
```bash
brew install tesseract
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr
```

#### Windows
Скачайте установщик с [официального сайта Tesseract](https://github.com/UB-Mannheim/tesseract/wiki)

## Подробная настройка

### 1. Настройка сервера (Node.js)

Проект уже настроен с готовой конфигурацией Supabase в файле `server/.env`

Установите зависимости:
```bash
cd server
npm install
```

### 2. Настройка клиента (React)

1. Перейдите в директорию `client/`
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Клиент автоматически настроен на работу с сервером на порту 3000

### 3. Настройка AI-сервиса (Python)

1. Перейдите в директорию `ai-service/`
2. Создайте виртуальное окружение (рекомендуется):
   ```bash
   python -m venv venv
   source venv/bin/activate  # На Windows: venv\Scripts\activate
   ```
3. Установите зависимости:
   ```bash
   pip install -r requirements.txt
   ```
4. Убедитесь, что Tesseract OCR установлен и доступен в PATH

## Запуск проекта

### Шаг 1: Запустите AI сервис
```bash
cd ai-service
```
Пример запуска через виртуальное окружение:
```bash
/Users/amir/Documents/diploma/ai-service/venv/bin/python /Users/amir/Documents/diploma/ai-service/app.py
```

AI сервис будет доступен по адресу: [http://localhost:5000](http://localhost:5000)

### Шаг 2: Запустите Node.js сервер
```bash
cd server
npm start
```
Сервер будет доступен по адресу: [http://localhost:3000](http://localhost:3000)

### Шаг 3: Запустите React клиент
```bash
cd client
npm run dev
```
Клиент будет доступен по адресу: [http://localhost:5173](http://localhost:5173)

## API Endpoints

### Сервер (Node.js) - порт 3000

| Метод | Endpoint | Описание |
|-------|----------|----------|
| GET | `/apps` | Получить список приложений |
| GET | `/apps/:id` | Получить детальную информацию о приложении |
| POST | `/upload` | Загрузить скриншоты для анализа |
| GET | `/categories` | Получить список категорий |
| GET | `/platforms` | Получить список платформ |

**Пример запроса:**
```bash
curl "http://localhost:3000/apps?platform=ios&limit=10"
```

### AI сервис (Python) - порт 5000

| Метод | Endpoint | Описание |
|-------|----------|----------|
| POST | `/analyze` | Анализ скриншотов с помощью AI |
| GET | `/health` | Проверка работоспособности сервиса |

## Аутентификация

Проект использует **Supabase Authentication** для управления пользователями. Реализована система входа/регистрации через email с одноразовым паролем (OTP).

### Основные возможности

- **Регистрация и вход по email**: Пользователь вводит email, получает magic‑ссылку для входа
- **Автоматическое создание профиля**: При первом входе в таблице `public.users` создаётся запись
- **Защищённые маршруты**: Страница профиля (`/profile`) доступна только авторизованным пользователям
- **Контекст аутентификации**: Глобальный React‑контекст (`AuthContext`) предоставляет состояние пользователя и методы авторизации

### Компоненты аутентификации

- `client/src/contexts/AuthContext.jsx` – React‑контекст с методами `signInWithOtp`, `signOut`, `verifyOtp`
- `client/src/components/AuthModal.jsx` – модальное окно для ввода email и отображения статуса
- `client/src/contexts/ProtectedRoute.jsx` – компонент‑обёртка для защиты маршрутов
- `client/src/lib/supabaseClient.js` – клиент Supabase, настроенный на проект

## Технические детали

- **Фронтенд:** React 19 + Vite
- **Бэкенд:** Node.js + Express
- **База данных:** Supabase (PostgreSQL)
- **AI сервис:** Python + Flask + Transformers
- **OCR:** Tesseract
- **Стили:** CSS Modules
