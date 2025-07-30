import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { deviceSchema } from "@shared/schema";
import type { Device, MqttInstance, DeviceCapability } from "@shared/schema";

interface EditDeviceModalProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
}

const deviceTypes = [
  { value: "devices.types.light", label: "Освещение" },
  { value: "devices.types.switch", label: "Выключатель" },
  { value: "devices.types.sensor", label: "Датчик" },
  { value: "devices.types.thermostat", label: "Термостат" },
  { value: "devices.types.media_device", label: "Медиа устройство" },
  { value: "devices.types.openable", label: "Открываемое устройство" },
  { value: "devices.types.other", label: "Другое" },
];

const capabilityTypes = [
  { value: "devices.capabilities.on_off", label: "On/Off" },
  { value: "devices.capabilities.range", label: "Range" },
  { value: "devices.capabilities.toggle", label: "Toggle" },
  { value: "devices.capabilities.color_setting", label: "Color Setting" },
];

export default function EditDeviceModal({ device, isOpen, onClose }: EditDeviceModalProps) {
  const [mqttInstances, setMqttInstances] = useState<MqttInstance[]>(device.mqtt || []);
  const [capabilities, setCapabilities] = useState<DeviceCapability[]>(device.capabilities || []);
  const [newRoom, setNewRoom] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: rooms = [] } = useQuery<string[]>({
    queryKey: ["/api/rooms"],
  });

  const form = useForm<Device>({
    resolver: zodResolver(deviceSchema),
    defaultValues: device,
  });

  useEffect(() => {
    if (device) {
      form.reset(device);
      setMqttInstances(device.mqtt || []);
      setCapabilities(device.capabilities || []);
    }
  }, [device, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: Device) => {
      const response = await apiRequest("PUT", `/api/devices/${data.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      toast({
        title: "Устройство обновлено",
        description: "Изменения были успешно сохранены",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить устройство",
        variant: "destructive",
      });
    },
  });

  const addMqttInstance = () => {
    setMqttInstances([...mqttInstances, { instance: "", set: "", state: "" }]);
  };

  const removeMqttInstance = (index: number) => {
    setMqttInstances(mqttInstances.filter((_, i) => i !== index));
  };

  const updateMqttInstance = (index: number, field: keyof MqttInstance, value: string) => {
    const updated = [...mqttInstances];
    updated[index] = { ...updated[index], [field]: value };
    setMqttInstances(updated);
  };

  const addCapability = () => {
    setCapabilities([...capabilities, { type: "", retrievable: true, reportable: true }]);
  };

  const removeCapability = (index: number) => {
    setCapabilities(capabilities.filter((_, i) => i !== index));
  };

  const updateCapability = (index: number, field: keyof DeviceCapability, value: any) => {
    const updated = [...capabilities];
    updated[index] = { ...updated[index], [field]: value };
    setCapabilities(updated);
  };

  const onSubmit = (data: Device) => {
    const finalRoom = data.room === "new" ? newRoom : data.room;
    updateMutation.mutate({
      ...data,
      room: finalRoom,
      mqtt: mqttInstances,
      capabilities: capabilities,
    });
  };

  const generatePreviewJson = () => {
    const formData = form.getValues();
    const finalRoom = formData.room === "new" ? newRoom : formData.room;
    
    return {
      ...formData,
      room: finalRoom,
      mqtt: mqttInstances,
      capabilities: capabilities,
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Редактировать устройство: {device.name}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Device Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название устройства</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите название..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID устройства</FormLabel>
                    <FormControl>
                      <Input placeholder="id_device_..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="room"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Комната</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите комнату" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {rooms.map(room => (
                          <SelectItem key={room} value={room}>{room}</SelectItem>
                        ))}
                        <SelectItem value="new">+ Добавить новую комнату</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("room") === "new" && (
                <FormItem>
                  <FormLabel>Название новой комнаты</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Введите название комнаты..." 
                      value={newRoom}
                      onChange={(e) => setNewRoom(e.target.value)}
                    />
                  </FormControl>
                </FormItem>
              )}

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип устройства</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {deviceTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* MQTT Configuration */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">MQTT настройки</h4>
              <div className="space-y-4">
                {mqttInstances.map((instance, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Instance #{index + 1}</h5>
                      {mqttInstances.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMqttInstance(index)}
                          className="text-destructive hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Instance</label>
                        <Input
                          placeholder="on, brightness, etc."
                          value={instance.instance}
                          onChange={(e) => updateMqttInstance(index, "instance", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Set Topic</label>
                        <Input
                          placeholder="input/device_topic"
                          value={instance.set || ""}
                          onChange={(e) => updateMqttInstance(index, "set", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State Topic</label>
                        <Input
                          placeholder="input/device_topic"
                          value={instance.state || ""}
                          onChange={(e) => updateMqttInstance(index, "state", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addMqttInstance}
                className="mt-3"
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить MQTT instance
              </Button>
            </div>

            {/* Capabilities Configuration */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Capabilities</h4>
              <div className="space-y-4">
                {capabilities.map((capability, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Capability #{index + 1}</h5>
                      {capabilities.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCapability(index)}
                          className="text-destructive hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                        <Select 
                          value={capability.type} 
                          onValueChange={(value) => updateCapability(index, "type", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                          <SelectContent>
                            {capabilityTypes.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-4 mt-6">
                        <label className="flex items-center space-x-2">
                          <Checkbox 
                            checked={capability.retrievable || false}
                            onCheckedChange={(checked) => updateCapability(index, "retrievable", checked)}
                          />
                          <span className="text-sm">Retrievable</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <Checkbox 
                            checked={capability.reportable || false}
                            onCheckedChange={(checked) => updateCapability(index, "reportable", checked)}
                          />
                          <span className="text-sm">Reportable</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={addCapability}
                className="mt-3"
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить capability
              </Button>
            </div>

            {/* JSON Preview */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Предпросмотр JSON</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-64">
                <pre>{JSON.stringify(generatePreviewJson(), null, 2)}</pre>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
