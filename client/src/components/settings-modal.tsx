import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, FolderOpen, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AppSettings {
  devicesFilePath: string;
}

interface PathTestResult {
  valid: boolean;
  message: string;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [devicesPath, setDevicesPath] = useState("");
  const [isTestingPath, setIsTestingPath] = useState(false);
  const [pathTestResult, setPathTestResult] = useState<PathTestResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current settings
  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
    enabled: open,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<AppSettings>) => {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Настройки сохранены",
        description: "Путь к файлу config.js обновлен",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    },
  });

  // Test path mutation
  const testPathMutation = useMutation({
    mutationFn: async (path: string): Promise<PathTestResult> => {
      const response = await fetch("/api/settings/test-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      if (!response.ok) throw new Error("Failed to test path");
      return response.json();
    },
    onSuccess: (result: PathTestResult) => {
      setPathTestResult(result);
    },
    onError: () => {
      setPathTestResult({
        valid: false,
        message: "Ошибка при проверке пути",
      });
    },
    onSettled: () => {
      setIsTestingPath(false);
    },
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setDevicesPath(settings.devicesFilePath);
    }
  }, [settings]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPathTestResult(null);
    }
  }, [open]);

  const handleTestPath = async () => {
    if (!devicesPath.trim()) return;
    
    setIsTestingPath(true);
    setPathTestResult(null);
    testPathMutation.mutate(devicesPath.trim());
  };

  const handleSave = () => {
    if (!devicesPath.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите путь к файлу config.js",
        variant: "destructive",
      });
      return;
    }

    updateSettingsMutation.mutate({
      devicesFilePath: devicesPath.trim(),
    });
  };

  const commonPaths = [
    "/opt/yandex2mqtt/config.js",
    "/home/user/yandex2mqtt/config.js",
    "./config.js",
    "/etc/yandex2mqtt/config.js",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Настройки приложения
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="devices-path">Путь к файлу config.js</Label>
              <div className="flex gap-2">
                <Input
                  id="devices-path"
                  value={devicesPath}
                  onChange={(e) => {
                    setDevicesPath(e.target.value);
                    setPathTestResult(null);
                  }}
                  placeholder="/opt/yandex2mqtt/config.js"
                  disabled={isLoading}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleTestPath}
                  disabled={isTestingPath || !devicesPath.trim()}
                >
                  {isTestingPath ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FolderOpen className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {pathTestResult && (
                <div className={`flex items-center gap-2 text-sm ${
                  pathTestResult.valid ? "text-green-600" : "text-red-600"
                }`}>
                  {pathTestResult.valid ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {pathTestResult.message}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Часто используемые пути:</Label>
              <div className="grid grid-cols-1 gap-1">
                {commonPaths.map((path) => (
                  <Button
                    key={path}
                    variant="ghost"
                    size="sm"
                    className="justify-start text-xs h-8"
                    onClick={() => {
                      setDevicesPath(path);
                      setPathTestResult(null);
                    }}
                  >
                    {path}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending || !devicesPath.trim()}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохраняем...
                </>
              ) : (
                "Сохранить"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}