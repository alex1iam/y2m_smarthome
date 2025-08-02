# y2m manager

Веб-панель администратора для управления конфигурацией устройств умного дома с интеграцией Яндекс.Алиса через yandex2mqtt.

## Возможности

- ✅ Добавление и редактирование устройств умного дома
- ✅ Настройка MQTT топиков и capabilities
- ✅ Фильтрация устройств по комнатам
- ✅ Экспорт конфигурации в формате module.exports
- ✅ Поиск устройств по названию
- ✅ Современный интерфейс на русском языке
- ✅ Интеграция с yandex2mqtt
- ✅ Скачивание полного проекта

## Установка на сервер

### Быстрая установка
1. Распакуйте проект в `/opt/yandex2mqtt/smarthome/`
2. Запустите: `chmod +x install.sh && ./install.sh`
3. Убедитесь что файл `config.js` находится в `/opt/yandex2mqtt/config.js`

### Структура файлов на сервере
```
/opt/yandex2mqtt/
├── config.js                     # Конфигурация устройств (yandex2mqtt)
└── smarthome/                    # Веб-приложение
    ├── client/                   # Frontend React приложение
    ├── server/                   # Backend Express API
    ├── shared/                   # Общие схемы TypeScript
    └── package.json              # Зависимости проекта
```

### Команды управления
```bash
cd /opt/yandex2mqtt/smarthome

# Разработка
npm run dev

# Продакшен
npm run build
npm run start

# Системная служба
sudo systemctl start smart-home-manager
sudo systemctl enable smart-home-manager
```

## Технологии

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript
- **Валидация**: Zod схемы
- **Сборка**: Vite + ESBuild
- **Интеграция**: yandex2mqtt совместимость

## Использование

1. Откройте веб-интерфейс на http://localhost:5000
2. Добавляйте устройства через кнопку "Добавить устройство"
3. Настраивайте MQTT топики и capabilities
4. Экспортируйте конфигурацию или скачайте весь проект
5. Изменения автоматически сохраняются в `/opt/yandex2mqtt/config.js`

## Подробная документация

- `server-setup.md` - детальная инструкция по установке на сервер
- `install.sh` - автоматический скрипт установки

Приложение полностью совместимо с yandex2mqtt и системами умного дома на основе Яндекс.Алисы.
