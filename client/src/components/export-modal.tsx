import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Download, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Configuration } from "@shared/schema";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  const { data: configuration, isLoading } = useQuery<Configuration>({
    queryKey: ["/api/configuration"],
    enabled: isOpen,
  });

  const copyToClipboard = async () => {
    if (!configuration) return;
    
    setIsCopying(true);
    try {
      const configString = `module.exports = ${JSON.stringify(configuration, null, 4)};`;
      await navigator.clipboard.writeText(configString);
      toast({
        title: "Скопировано",
        description: "Конфигурация скопирована в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать конфигурацию",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  const downloadConfig = () => {
    if (!configuration) return;
    
    try {
      const configString = `module.exports = ${JSON.stringify(configuration, null, 4)};`;
      const blob = new Blob([configString], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'devices.js';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Файл загружен",
        description: "Конфигурация сохранена как devices.js",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить файл",
        variant: "destructive",
      });
    }
  };

  const saveConfig = async () => {
    if (!configuration) return;
    
    try {
      const response = await fetch('/api/configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configuration),
      });
      
      if (response.ok) {
        toast({
          title: "Конфигурация сохранена",
          description: "Изменения записаны в файл конфигурации",
        });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить конфигурацию",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Экспорт конфигурации
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Загрузка конфигурации...</span>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-md font-semibold text-gray-900">Полная конфигурация</h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copyToClipboard}
                    disabled={isCopying}
                    className="bg-accent text-white hover:bg-orange-600"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    {isCopying ? "Копирование..." : "Копировать"}
                  </Button>
                </div>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
                  <pre>
                    {configuration ? `module.exports = ${JSON.stringify(configuration, null, 4)};` : 'Загрузка...'}
                  </pre>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  onClick={downloadConfig}
                  className="bg-primary text-white hover:bg-blue-700"
                  disabled={!configuration}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Скачать конфигурацию
                </Button>
                <Button
                  onClick={() => window.open('/api/project/export', '_blank')}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Скачать весь проект
                </Button>
                <Button
                  onClick={saveConfig}
                  className="bg-success text-white hover:bg-green-600"
                  disabled={!configuration}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить в файл
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
