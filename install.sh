#!/bin/bash

# Smart Home Manager Installation Script
# Настройка проекта для работы с путем /opt/yandex2mqtt

echo "=== Smart Home Manager Installation ==="
echo "Настройка проекта для работы с /opt/yandex2mqtt"

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "Node.js не установлен. Устанавливаем..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "Node.js версия: $(node --version)"
echo "NPM версия: $(npm --version)"

# Создание необходимых директорий
echo "Создание директорий..."
sudo mkdir -p /opt/yandex2mqtt
sudo mkdir -p /opt/yandex2mqtt/smarthome

# Установка зависимостей
echo "Установка зависимостей..."
npm install

# Создание файла config.js если его нет
if [ ! -f "/opt/yandex2mqtt/config.js" ]; then
    echo "Создание начального файла config.js..."
    sudo cp config/devices.js /opt/yandex2mqtt/config.js
    echo "Файл config.js создан в /opt/yandex2mqtt/"
fi

# Настройка прав доступа
echo "Настройка прав доступа..."
sudo chown -R $USER:$USER /opt/yandex2mqtt
sudo chmod 755 /opt/yandex2mqtt
sudo chmod 644 /opt/yandex2mqtt/config.js

# Создание systemd службы
echo "Создание службы systemd..."
sudo tee /etc/systemd/system/smart-home-manager.service > /dev/null <<EOF
[Unit]
Description=Smart Home Manager
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/yandex2mqtt/smarthome
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

[Install]
WantedBy=multi-user.target
EOF

# Перезагрузка systemd
sudo systemctl daemon-reload

echo ""
echo "=== Установка завершена ==="
echo ""
echo "Структура файлов:"
echo "  /opt/yandex2mqtt/config.js           - файл конфигурации устройств"  
echo "  /opt/yandex2mqtt/smarthome/          - веб-приложение"
echo ""
echo "Команды для управления:"
echo "  npm run dev                          - запуск в режиме разработки"
echo "  npm run build                        - сборка для продакшена"
echo "  npm run start                        - запуск в продакшене"
echo ""
echo "Управление службой:"
echo "  sudo systemctl start smart-home-manager     - запуск службы"
echo "  sudo systemctl stop smart-home-manager      - остановка службы"
echo "  sudo systemctl enable smart-home-manager    - автозапуск"
echo "  sudo systemctl status smart-home-manager    - статус службы"
echo ""
echo "После запуска приложение будет доступно на http://localhost:5000"