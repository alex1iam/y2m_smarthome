import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Info, Trash2, Power, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Device } from "@shared/schema";

interface DeviceCardProps {
  device: Device;
  onEdit: () => void;
  onShowInfo?: () => void;
  getDeviceIcon: (type: string) => string;
}

export default function DeviceCard({ device, onEdit, getDeviceIcon }: DeviceCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Устройство удалено",
        description: "Устройство было успешно удалено из конфигурации",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить устройство",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/devices/${id}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to toggle device");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "Состояние изменено",
        description: data.message,
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить состояние устройства",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm(`Вы уверены, что хотите удалить устройство "${device.name}"?`)) {
      deleteMutation.mutate(device.id);
    }
  };

  const handleToggle = () => {
    toggleMutation.mutate(device.id);
  };

  const hasOnOffCapability = device.capabilities?.some(c => c.type === 'devices.capabilities.on_off');

  const getDeviceIconColor = (type: string) => {
    if (type.includes('light')) return 'bg-yellow-100 text-yellow-600';
    if (type.includes('sensor')) return 'bg-blue-100 text-blue-600';
    if (type.includes('thermostat')) return 'bg-red-100 text-red-600';
    if (type.includes('openable')) return 'bg-green-100 text-green-600';
    return 'bg-gray-100 text-gray-600';
  };

  const getStatusInfo = () => {
    const onOffCapability = device.capabilities?.find(c => c.type === 'devices.capabilities.on_off');
    if (onOffCapability?.state) {
      return {
        status: onOffCapability.state.value === true ? 'Включено' : 'Выключено',
        color: onOffCapability.state.value === true ? 'text-success' : 'text-gray-500',
        dotColor: onOffCapability.state.value === true ? 'bg-success' : 'bg-gray-400'
      };
    }
    return { status: 'Неизвестно', color: 'text-gray-500', dotColor: 'bg-gray-400' };
  };

  const getBrightnessInfo = () => {
    const brightnessCapability = device.capabilities?.find(c => 
      c.type === 'devices.capabilities.range' && c.parameters?.instance === 'brightness'
    );
    return brightnessCapability?.state?.value || null;
  };

  const statusInfo = getStatusInfo();
  const brightnessValue = getBrightnessInfo();
  const primaryMqttTopic = device.mqtt[0]?.set || device.mqtt[0]?.state || '';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getDeviceIconColor(device.type)}`}>
              <i className={getDeviceIcon(device.type)}></i>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-mono">{device.id}</p>
              <h4 className="font-medium text-gray-900">{device.name}</h4>
              <p className="text-sm text-gray-500">{device.type}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="p-1 text-gray-400 hover:text-primary"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="p-1 text-gray-400 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {brightnessValue !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Яркость:</span>
              <span className="text-sm font-medium">{brightnessValue}%</span>
            </div>
          )}
          
          {primaryMqttTopic && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">MQTT топик:</span>
              <span className="text-xs text-gray-500 font-mono truncate max-w-32" title={primaryMqttTopic}>
                {primaryMqttTopic}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
