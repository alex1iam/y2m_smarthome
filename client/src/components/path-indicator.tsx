import { useQuery } from "@tanstack/react-query";
import { FolderOpen, AlertCircle } from "lucide-react";

interface AppSettings {
  devicesFilePath: string;
}

export function PathIndicator() {
  const { data: settings, isLoading } = useQuery<AppSettings>({
    queryKey: ["/api/settings"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <FolderOpen className="mr-2 h-4 w-4" />
        Загрузка...
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center text-sm text-red-600">
        <AlertCircle className="mr-2 h-4 w-4" />
        Настройки недоступны
      </div>
    );
  }

  return (
    <div className="flex items-center text-sm text-gray-600">
      <FolderOpen className="mr-2 h-4 w-4" />
      <span className="font-mono text-xs">
        {settings.devicesFilePath}
      </span>
    </div>
  );
}