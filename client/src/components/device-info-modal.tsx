import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, Wifi, Power, Settings } from "lucide-react";

interface DeviceInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceInfoModal({ open, onOpenChange }: DeviceInfoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Управление устройствами
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Функции кнопок на карточке устройства:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Power className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Кнопка "Переключить"</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Включает/выключает устройство, изменяя его состояние. Работает только для устройств 
                    с capability "on_off". Состояние сохраняется в конфигурацию и будет видно при следующей загрузке.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Settings className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Кнопка "Настроить"</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Открывает форму редактирования устройства, где можно изменить название, комнату, 
                    MQTT топики и capabilities.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wifi className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">MQTT интеграция</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Приложение сохраняет состояния устройств в конфигурацию. В реальной системе 
                    состояния должны синхронизироваться с MQTT брокером и физическими устройствами.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Важно:</h4>
              <p className="text-sm text-yellow-700">
                Кнопка "Переключить" работает только в рамках веб-интерфейса. Для реального 
                управления устройствами нужна интеграция с MQTT брокером и yandex2mqtt.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Понятно
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}