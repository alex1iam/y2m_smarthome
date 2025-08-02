import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, Plus, Download, Search, DoorOpen, Settings, Info } from "lucide-react";
import DeviceCard from "../components/device-card";
import AddDeviceModal from "../components/add-device-modal";
import EditDeviceModal from "../components/edit-device-modal";
import ExportModal from "../components/export-modal";
import { SettingsModal } from "../components/settings-modal";
import { PathIndicator } from "../components/path-indicator";
import { DeviceInfoModal } from "../components/device-info-modal";
import type { Device } from "@shared/schema";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  // Fetch devices
  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  // Fetch rooms
  const { data: rooms = [] } = useQuery<string[]>({
    queryKey: ["/api/rooms"],
  });

  // Initialize selected rooms when rooms data is loaded
  useMemo(() => {
    if (rooms.length > 0 && selectedRooms.size === 0) {
      setSelectedRooms(new Set(rooms));
    }
  }, [rooms, selectedRooms.size]);

  // Filter devices based on search and room selection
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      const matchesSearch = device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           device.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRoom = selectedRooms.has(device.room);
      return matchesSearch && matchesRoom;
    });
  }, [devices, searchQuery, selectedRooms]);

  // Group devices by room
  const devicesByRoom = useMemo(() => {
    const groups: Record<string, Device[]> = {};
    filteredDevices.forEach(device => {
      if (!groups[device.room]) {
        groups[device.room] = [];
      }
      groups[device.room].push(device);
    });
    return groups;
  }, [filteredDevices]);

  const handleRoomToggle = (room: string, checked: boolean) => {
    const newSelectedRooms = new Set(selectedRooms);
    if (checked) {
      newSelectedRooms.add(room);
    } else {
      newSelectedRooms.delete(room);
    }
    setSelectedRooms(newSelectedRooms);
  };

  const getDeviceIcon = (type: string) => {
    if (type.includes('light')) return 'fas fa-lightbulb';
    if (type.includes('sensor')) return 'fas fa-thermometer-half';
    if (type.includes('thermostat')) return 'fas fa-temperature-high';
    if (type.includes('openable')) return 'fas fa-door-open';
    return 'fas fa-home';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Загрузка устройств...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Home className="text-primary text-2xl" />
              <h1 className="text-xl font-semibold text-gray-900">YANDEX2MQTT CONFIG MANAGER</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setIsInfoModalOpen(true)}
                variant="outline"
                size="sm"
              >
                <Info className="mr-2 h-4 w-4" />
                Справка
              </Button>
              <Button 
                onClick={() => setIsSettingsModalOpen(true)}
                variant="outline"
                size="sm"
              >
                <Settings className="mr-2 h-4 w-4" />
                Настройки
              </Button>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary text-white hover:bg-blue-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Добавить устройство
              </Button>
              <Button 
                onClick={() => setIsExportModalOpen(true)}
                className="bg-accent text-white hover:bg-orange-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Экспорт
              </Button>
              <Button 
                onClick={() => window.open('/api/project/export', '_blank')}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Download className="mr-2 h-4 w-4" />
                Скачать проект
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-20">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm h-screen fixed left-0 top-20 overflow-y-auto">
          <nav className="p-4">
            <div className="space-y-2">
            </div>

            {/* Room Filter */}
            <div className="mt-8">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Фильтр по комнатам</h3>
              <div className="space-y-1">
                {rooms.map(room => {
                  const roomDeviceCount = devices.filter(d => d.room === room).length;
                  return (
                    <label key={room} className="flex items-center space-x-2 text-sm">
                      <Checkbox 
                        checked={selectedRooms.has(room)}
                        onCheckedChange={(checked) => handleRoomToggle(room, checked as boolean)}
                      />
                      <span>{room}</span>
                      <span className="text-gray-500">({roomDeviceCount})</span>
                    </label>
                  );
                })}
              </div>
            </div>
            
            {/* Current Path Indicator */}
            <div className="mt-8 p-3 bg-gray-50 rounded-lg border">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Текущий путь к config.js:</h4>
              <PathIndicator />
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-6">
          <div id="devices-section">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Управление устройствами</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Поиск устройств..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2"
                  />
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Room Groups */}
            {Object.entries(devicesByRoom).map(([room, roomDevices]) => (
              <div key={room} className="mb-8">
                <div className="flex items-center space-x-2 mb-4">
                  <DoorOpen className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-medium text-gray-900">{room}</h3>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                    {roomDevices.length} {roomDevices.length === 1 ? 'устройство' : 'устройства'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roomDevices.map(device => (
                    <DeviceCard
                      key={device.id}
                      device={device}
                      onEdit={() => setEditingDevice(device)}
                      getDeviceIcon={getDeviceIcon}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Empty state */}
            {Object.keys(devicesByRoom).length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-8 text-center">
                <i className="fas fa-plus-circle text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Нет устройств</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery || selectedRooms.size === 0 
                    ? "Попробуйте изменить фильтры поиска" 
                    : "Создайте новое устройство с настройками MQTT и capabilities"}
                </p>
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-primary text-white hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить устройство
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddDeviceModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      
      {editingDevice && (
        <EditDeviceModal
          device={editingDevice}
          isOpen={!!editingDevice}
          onClose={() => setEditingDevice(null)}
        />
      )}
      
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      
      <SettingsModal
        open={isSettingsModalOpen}
        onOpenChange={setIsSettingsModalOpen}
      />
      
      <DeviceInfoModal
        open={isInfoModalOpen}
        onOpenChange={setIsInfoModalOpen}
      />
    </div>
  );
}
