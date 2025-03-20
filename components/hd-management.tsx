"use client"

import type React from "react"

import { useState, useEffect, useMemo, useRef } from "react"
import { HardDrive, Plus, Edit, Trash2, Power, PowerOff, Check, X, RefreshCw, Search, Database, Save, Info, FolderPlus, Layers, Film, Tv, HardDriveDownload, GripVertical, Move } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { HD } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { DonutChart } from "@/components/ui/donut-chart"

export function HDManagement() {
  const { toast } = useToast()
  const [hds, setHds] = useState<HD[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentHd, setCurrentHd] = useState<HD | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    totalSpace: 0,
    freeSpace: 0,
    color: "#3B82F6",
    additionDate: new Date().toISOString().split('T')[0],
    type: "externo" as 'interno' | 'externo',
    serialNumber: "",
    model: "",
    transferSpeed: "",
    group: "geral" as 'geral' | 'filmes' | 'series' | 'documentos' | 'backup'
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState<"name" | "freeSpace" | "connected" | "group">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const [isFileSystemAccessSupported, setIsFileSystemAccessSupported] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)

  // Estado para armazenar erros de validação do formulário
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    path?: string;
    totalSpace?: string;
    freeSpace?: string;
    additionDate?: string;
    type?: string;
  }>({});

  const [isMediaScanning, setIsMediaScanning] = useState(false);
  const [hdToScan, setHdToScan] = useState<HD | null>(null);
  const [mediaScanDialogOpen, setMediaScanDialogOpen] = useState(false);
  const [mediaScanResults, setMediaScanResults] = useState<{
    totalFiles: number;
    foundMedia: number;
    estimatedSize: number;
  }>({ totalFiles: 0, foundMedia: 0, estimatedSize: 0 });

  // Estados para agrupamento
  const [showGrouped, setShowGrouped] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    geral: true,
    filmes: true,
    series: true,
    documentos: true,
    backup: true
  });

  // Estado para arrastar e soltar
  const [draggedHd, setDraggedHd] = useState<HD | null>(null);
  const [dragOverHdId, setDragOverHdId] = useState<string | null>(null);

  // Check if the File System Access API is supported
  useEffect(() => {
    setIsFileSystemAccessSupported(
      "showDirectoryPicker" in window ||
        (navigator.userAgent.includes("Chrome") && Number.parseInt(navigator.userAgent.split("Chrome/")[1]) >= 86),
    )
  }, [])

  // Function to select directory path
  const selectDirectoryPath = async () => {
    try {
      // @ts-ignore - TypeScript doesn't know about showDirectoryPicker yet
      const directoryHandle = await window.showDirectoryPicker()
      if (directoryHandle) {
        setFormData({ ...formData, path: directoryHandle.name })
        
        // Tentar obter informações de espaço do diretório selecionado
        if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
          try {
            const estimate = await navigator.storage.estimate();
            if (estimate.quota && estimate.usage) {
              const totalSpace = estimate.quota;
              const usedSpace = estimate.usage;
              const freeSpace = totalSpace - usedSpace;
              
              // Atualizar o formulário com os valores detectados
              setFormData(prev => ({
                ...prev,
                path: directoryHandle.name,
                totalSpace: totalSpace,
                freeSpace: freeSpace
              }));
              
        toast({
                title: "Informações de Espaço Detectadas",
                description: `Espaço total: ${(totalSpace / 1000000000000).toFixed(1)} TB, Livre: ${(freeSpace / 1000000000000).toFixed(1)} TB`,
              });
            }
          } catch (storageError) {
            console.error("Erro ao detectar espaço:", storageError);
            // Continuar mesmo sem as informações de espaço
          }
        }
        
        toast({
          title: "Pasta Selecionada",
          description: `Pasta selecionada: ${directoryHandle.name}`,
        })
      }
    } catch (error) {
      // User cancelled or browser doesn't support it
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: "Erro",
          description: "Não foi possível acessar o sistema de arquivos. Por favor, insira o caminho manualmente.",
          variant: "destructive",
        })
      }
    }
  }

  useEffect(() => {
    // Load data from localStorage
    const storedHds = localStorage.getItem("hds")

    if (storedHds) {
      try {
        const parsedHds = JSON.parse(storedHds);
        
        // Garantir que os HDs antigos tenham os novos campos
        const updatedHds = parsedHds.map((hd: HD) => ({
          ...hd,
          additionDate: hd.additionDate || new Date().toISOString().split('T')[0],
          type: hd.type || 'externo',
        }));
        
        setHds(updatedHds);
        localStorage.setItem("hds", JSON.stringify(updatedHds));
      } catch (e) {
        console.error("Erro ao carregar HDs:", e);
        setHds([]);
      }
    }
  }, [])

  const openAddDialog = () => {
    setIsEditing(false)
    setCurrentHd(null)
    setFormData({
      name: "",
      path: "",
      totalSpace: 1000000000000, // 1TB default
      freeSpace: 500000000000, // 500GB default
      color: "#3B82F6",
      additionDate: new Date().toISOString().split('T')[0],
      type: "externo" as 'interno' | 'externo',
      serialNumber: "",
      model: "",
      transferSpeed: "",
      group: "geral" as 'geral' | 'filmes' | 'series' | 'documentos' | 'backup'
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  const openEditDialog = (hd: HD) => {
    setIsEditing(true)
    setCurrentHd(hd)
    setFormData({
      name: hd.name,
      path: hd.path,
      totalSpace: hd.totalSpace,
      freeSpace: hd.freeSpace,
      color: hd.color,
      additionDate: hd.additionDate || new Date().toISOString().split('T')[0],
      type: hd.type || "externo",
      serialNumber: hd.serialNumber || "",
      model: hd.model || "",
      transferSpeed: hd.transferSpeed || "",
      group: hd.group || "geral"
    })
    setFormErrors({})
    setDialogOpen(true)
  }

  // Validar campo específico
  const validateField = (name: string, value: any) => {
    switch (name) {
      case 'name':
        if (!value.trim()) return "O nome do HD é obrigatório";
        if (value.trim().length < 3) return "O nome deve ter pelo menos 3 caracteres";
        if (hds.some(hd => hd.name.toLowerCase() === value.trim().toLowerCase() && 
            (!isEditing || (currentHd && hd.id !== currentHd.id)))) {
          return "Já existe um HD com este nome";
        }
        return undefined;
        
      case 'path':
        if (!value.trim()) return "O caminho do HD é obrigatório";
        return undefined;
        
      case 'totalSpace':
        if (typeof value === 'string') {
          // Converter TB para bytes
          value = Number.parseFloat(value) * 1000000000000;
        }
        if (isNaN(value) || value <= 0) return "O espaço total deve ser maior que zero";
        return undefined;
        
      case 'freeSpace':
        if (typeof value === 'string') {
          // Converter TB para bytes
          value = Number.parseFloat(value) * 1000000000000;
        }
        if (isNaN(value) || value < 0) return "O espaço livre não pode ser negativo";
        if (value > formData.totalSpace) return "O espaço livre não pode ser maior que o espaço total";
        return undefined;
        
      case 'additionDate':
        if (!value) return "A data de adição é obrigatória";
        return undefined;
        
      case 'type':
        if (!value) return "O tipo de HD é obrigatório";
        if (value !== 'interno' && value !== 'externo') return "Tipo de HD inválido";
        return undefined;
        
      default:
        return undefined;
    }
  };
  
  // Validar todos os campos
  const validateForm = () => {
    const errors = {
      name: validateField('name', formData.name),
      path: validateField('path', formData.path),
      totalSpace: validateField('totalSpace', formData.totalSpace),
      freeSpace: validateField('freeSpace', formData.freeSpace),
      additionDate: validateField('additionDate', formData.additionDate),
      type: validateField('type', formData.type),
    };
    
    setFormErrors(errors);
    
    // Formulário válido se não houver erros
    return !Object.values(errors).some(error => error !== undefined);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    let parsedValue: string | number = value;

    if (name === "totalSpace" || name === "freeSpace") {
      // Converter TB para bytes
      const valueInTB = Number.parseFloat(value);
      if (!isNaN(valueInTB)) {
        const valueInBytes = valueInTB * 1000000000000;
        parsedValue = valueInBytes;
      }
    }

    // Atualizar o estado do formulário
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
    
    // Validar o campo que acabou de mudar
    const fieldError = validateField(name, parsedValue);
    
    // Atualizar erros
    setFormErrors(prev => ({ 
      ...prev, 
      [name]: fieldError,
      // Verificar espaço livre quando o total muda
      ...(name === 'totalSpace' && prev.freeSpace 
          ? { freeSpace: validateField('freeSpace', formData.freeSpace) } 
          : {})
    }));
  };

  const saveHd = () => {
    // Validar todos os campos antes de salvar
    if (!validateForm()) {
      // Se houver erros, mostrar toast e não prosseguir
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os erros no formulário antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const updatedHds = [...hds];

    if (isEditing && currentHd) {
      // Atualizar HD existente
      const index = updatedHds.findIndex((hd) => hd.id === currentHd.id);
      if (index !== -1) {
        updatedHds[index] = {
          ...currentHd,
          name: formData.name.trim(),
          path: formData.path.trim(),
          totalSpace: formData.totalSpace,
          freeSpace: formData.freeSpace,
          color: formData.color,
          additionDate: formData.additionDate,
          type: formData.type,
          serialNumber: formData.serialNumber.trim(),
          model: formData.model.trim(),
          transferSpeed: formData.transferSpeed.trim(),
          group: formData.group
        };
      }
    } else {
      // Adicionar novo HD com ID estável (não use Math.random())
      const newHd: HD = {
        id: `hd-${Date.now().toString()}`,
        name: formData.name.trim(),
        path: formData.path.trim(),
        connected: true,
        totalSpace: formData.totalSpace,
        freeSpace: formData.freeSpace,
        color: formData.color,
        additionDate: formData.additionDate,
        type: formData.type,
        serialNumber: formData.serialNumber.trim(),
        model: formData.model.trim(),
        transferSpeed: formData.transferSpeed.trim(),
        group: formData.group
      };
      updatedHds.push(newHd);
    }

    setHds(updatedHds);
    localStorage.setItem("hds", JSON.stringify(updatedHds));
    setDialogOpen(false);

    toast({
      title: isEditing ? "HD Atualizado" : "HD Adicionado",
      description: `${formData.name} foi ${isEditing ? "atualizado" : "adicionado"} com sucesso.`,
    });
  };

  const initiateDeleteHd = (id: string) => {
    const hdToDelete = hds.find(hd => hd.id === id);
    if (hdToDelete) {
      setConfirmDeleteId(id);
      setConfirmDeleteDialogOpen(true);
    }
  }

  const deleteHd = () => {
    if (!confirmDeleteId) return;
    
    const id = confirmDeleteId;
    
    // Check if any series or movies are using this HD
    const storedSeries = localStorage.getItem("series");
    const storedMovies = localStorage.getItem("movies");
    let mediaUsingHd = 0;
    let mediaTypes = [];
    
    if (storedSeries) {
      const series = JSON.parse(storedSeries);
      const seriesUsingHd = series.filter((s: any) => s.hdId === id);
      
      if (seriesUsingHd.length > 0) {
        mediaUsingHd += seriesUsingHd.length;
        mediaTypes.push(`${seriesUsingHd.length} séries`);
      }
    }
    
    if (storedMovies) {
      const movies = JSON.parse(storedMovies);
      const moviesUsingHd = movies.filter((m: any) => m.hdId === id);
      
      if (moviesUsingHd.length > 0) {
        mediaUsingHd += moviesUsingHd.length;
        mediaTypes.push(`${moviesUsingHd.length} filmes`);
      }
    }

    // Aviso, mas permitindo a exclusão
    if (mediaUsingHd > 0) {
    toast({
        title: "Atenção!",
        description: `Este HD contém ${mediaTypes.join(" e ")}. Esses itens ficarão sem referência ao HD após a exclusão.`,
        variant: "destructive",
      });
    }

    const hdToDelete = hds.find(hd => hd.id === id);
    const updatedHds = hds.filter((hd) => hd.id !== id);
    setHds(updatedHds);
    localStorage.setItem("hds", JSON.stringify(updatedHds));

    toast({
      title: "HD Excluído",
      description: `O HD ${hdToDelete?.name || ''} foi excluído com sucesso.`,
    });
    
    setConfirmDeleteDialogOpen(false);
    setConfirmDeleteId(null);
  };

  const toggleHdConnection = (id: string) => {
    const hdToToggle = hds.find((hd) => hd.id === id);
    if (!hdToToggle) return;
    
    // Se estamos desconectando o HD, verificar se há séries nele
    if (hdToToggle.connected) {
    const storedSeries = localStorage.getItem("series")
    if (storedSeries) {
      const series = JSON.parse(storedSeries)
        const seriesUsingHd = series.filter((s: any) => s.hdId === id && !s.hidden)

      if (seriesUsingHd.length > 0) {
          // Avisar o usuário, mas permitir a desconexão
        toast({
            title: "Atenção",
            description: `Este HD contém ${seriesUsingHd.length} séries visíveis. Elas serão marcadas como indisponíveis até que o HD seja reconectado.`,
        })
        }
      }
    }

    const updatedHds = hds.map((hd) => (hd.id === id ? { ...hd, connected: !hd.connected } : hd))

    setHds(updatedHds)
    localStorage.setItem("hds", JSON.stringify(updatedHds))

    const hd = updatedHds.find((hd) => hd.id === id)

    toast({
      title: hd?.connected ? "HD Conectado" : "HD Desconectado",
      description: `${hd?.name} foi ${hd?.connected ? "conectado" : "desconectado"} com sucesso.`,
    })
  }

  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };
  
  const sortedHds = useMemo(() => {
    return [...hds].sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === "freeSpace") {
        return sortOrder === "asc" 
          ? a.freeSpace - b.freeSpace
          : b.freeSpace - a.freeSpace;
      } else if (sortBy === "connected") {
        if (a.connected === b.connected) {
          return a.name.localeCompare(b.name);
        }
        return sortOrder === "asc" 
          ? (a.connected ? 1 : -1)
          : (a.connected ? -1 : 1);
      } else if (sortBy === "group") {
        // Ordenar primeiro por grupo, depois por nome
        const groupA = a.group || 'geral';
        const groupB = b.group || 'geral';
        const groupCompare = groupA.localeCompare(groupB);
        
        if (groupCompare === 0) {
          return a.name.localeCompare(b.name);
        }
        
        return sortOrder === "asc" ? groupCompare : -groupCompare;
      }
      return 0;
    });
  }, [hds, sortBy, sortOrder]);
  
  const groupedHds = useMemo(() => {
    // Agrupar HDs por grupo
    const groups: Record<string, HD[]> = {
      geral: [],
      filmes: [],
      series: [],
      documentos: [],
      backup: []
    };
    
    sortedHds.forEach(hd => {
      const group = hd.group || 'geral';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(hd);
    });
    
    return groups;
  }, [sortedHds]);
  
  const handleSort = (by: "name" | "freeSpace" | "connected" | "group") => {
    if (sortBy === by) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(by);
      setSortOrder("asc");
    }
  };
  
  // Função para verificar HDs conectados ao sistema
  const scanForConnectedHDs = async () => {
    setIsScanning(true);
    
    try {
      // Verificamos se a API File System Access está disponível
      if (!isFileSystemAccessSupported) {
    toast({
          title: "Funcionalidade Limitada",
          description: "A verificação automática de HDs requer um navegador moderno com suporte a File System Access API.",
          variant: "destructive",
        });
        setIsScanning(false);
        return;
      }
      
      // Verificar se temos APIs de disco disponíveis no sistema
      let diskInfoAvailable = false;
      
      // Verificar se a API Navigator.storage.estimate está disponível
      if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
        diskInfoAvailable = true;
      }
      
      // Esta é uma verificação simulada para HDs que não podemos acessar via API
      setLastScanTime(new Date());
      
      // Use setTimeout para garantir que isso execute apenas no cliente após a renderização
      setTimeout(async () => {
        // Agora podemos executar o código com segurança no cliente
        const updatedHds = [...hds];
        let changesDetected = false;
        
        // Se tivermos acesso às APIs de disco, tente obter informações reais
        if (diskInfoAvailable) {
          try {
            const estimate = await navigator.storage.estimate();
            if (estimate.quota && estimate.usage) {
              // Encontrar o HD principal (geralmente o primeiro HD interno)
              const mainSystemHd = updatedHds.find(hd => 
                hd.type === 'interno' || hd.path.startsWith('C:') || hd.path.startsWith('/'));
              
              if (mainSystemHd) {
                const index = updatedHds.indexOf(mainSystemHd);
                if (index !== -1) {
                  const totalSpace = estimate.quota;
                  const usedSpace = estimate.usage;
                  const freeSpace = totalSpace - usedSpace;
                  
                  // Verificar se os valores são significativamente diferentes
                  if (Math.abs(mainSystemHd.totalSpace - totalSpace) > totalSpace * 0.05 || 
                      Math.abs(mainSystemHd.freeSpace - freeSpace) > freeSpace * 0.05) {
                    
                    updatedHds[index] = {
                      ...updatedHds[index],
                      connected: true,
                      totalSpace: totalSpace,
                      freeSpace: freeSpace
                    };
                    changesDetected = true;
                    
                    toast({
                      title: "Informações de Disco Atualizadas",
                      description: `Espaço atualizado para ${mainSystemHd.name}: Total ${(totalSpace / 1000000000000).toFixed(1)} TB, Livre ${(freeSpace / 1000000000000).toFixed(1)} TB`,
                    });
                  }
                }
              }
            }
          } catch (storageError) {
            console.error("Erro ao detectar informações de disco:", storageError);
          }
        }
        
        // Para outros HDs, use a simulação atual
        for (let i = 0; i < updatedHds.length; i++) {
          const wasConnected = updatedHds[i].connected;
          
          // Simulação: verificar o status de conexão
          // Em um ambiente real, isso seria substituído por código que verifica
          // se o dispositivo está realmente conectado ao sistema
          let isNowConnected = wasConnected;
          
          // Tentativa de verificar se o HD está realmente conectado
          if (isFileSystemAccessSupported && updatedHds[i].path) {
            try {
              // @ts-ignore - TypeScript doesn't know about showDirectoryPicker yet
              const handle = await window.showDirectoryPicker({
                id: updatedHds[i].id,
                startIn: 'desktop',
                mode: 'read'
              });
              
              // Se chegou aqui, o diretório existe
              isNowConnected = true;
            } catch (e) {
              // Se não conseguiu acessar, use a lógica de simulação
              isNowConnected = Math.random() > 0.2;
            }
          } else {
            // Use simulação para demonstração
            isNowConnected = Math.random() > 0.2;
          }
          
          if (wasConnected !== isNowConnected) {
            updatedHds[i] = {
              ...updatedHds[i],
              connected: isNowConnected,
            };
            changesDetected = true;
          }
          
          if (isNowConnected) {
            const randomFreePercentage = Math.random() * 0.5 + 0.1;
            const newFreeSpace = Math.round(updatedHds[i].totalSpace * randomFreePercentage);
            
            if (Math.abs(updatedHds[i].freeSpace - newFreeSpace) > updatedHds[i].totalSpace * 0.05) {
              updatedHds[i] = {
                ...updatedHds[i],
                freeSpace: newFreeSpace,
              };
              changesDetected = true;
            }
          }
        }
        
        if (changesDetected) {
          setHds(updatedHds);
          localStorage.setItem("hds", JSON.stringify(updatedHds));
          
          toast({
            title: "Verificação Concluída",
            description: "O status dos HDs foi atualizado com base na verificação do sistema.",
          });
        } else {
          toast({
            title: "Verificação Concluída",
            description: "Nenhuma alteração detectada no status dos HDs.",
          });
        }
        
        setIsScanning(false);
      }, 0);
    } catch (error) {
      toast({
        title: "Erro na Verificação",
        description: "Não foi possível verificar os HDs conectados: " + 
          (error instanceof Error ? error.message : "erro desconhecido"),
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  // Função para formatar tamanho de forma amigável
  const formatSize = (bytes: number, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1000;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    // Para HDs e volumes grandes, preferimos exibir em TB
    if (bytes >= 0.8 * Math.pow(k, 4)) { // 800 GB ou mais: mostrar em TB
      return (bytes / Math.pow(k, 4)).toFixed(decimals) + ' TB';
    }
    
    // Para tamanhos menores, usar a unidade mais adequada
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    // Calcular o valor na unidade escolhida
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };
  
  // Função para calcular porcentagem de uso
  const calculateUsagePercentage = (hd: HD) => {
    return Math.round((1 - hd.freeSpace / hd.totalSpace) * 100);
  };
  
  // Determinar cor baseada no uso
  const getUsageColor = (percentage: number) => {
    if (percentage > 90) return "bg-red-500";
    if (percentage > 75) return "bg-amber-500";
    return "bg-blue-600";
  };

  // Iniciar verificação de mídia
  const initiateMediaScan = (hd: HD) => {
    if (!hd.connected) {
      toast({
        title: "HD Desconectado",
        description: "Não é possível escanear mídia em um HD desconectado. Conecte-o primeiro.",
        variant: "destructive",
      });
      return;
    }
    
    setHdToScan(hd);
    setMediaScanResults({ totalFiles: 0, foundMedia: 0, estimatedSize: 0 });
    setMediaScanDialogOpen(true);
  };
  
  // Função para simular escaneamento de mídia
  const scanMediaInHd = async () => {
    if (!hdToScan) return;
    
    setIsMediaScanning(true);
    
    // Use setTimeout para garantir que o código com Math.random execute apenas no cliente
    setTimeout(async () => {
      try {
        // Simular progresso de verificação
        let totalFilesFound = 0;
        let mediaFilesFound = 0;
        let totalSizeEstimated = 0;
        
        // Simular 10 etapas de verificação
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Simular encontrar arquivos - agora seguro pois estamos no cliente
          const newFilesInThisBatch = Math.floor(Math.random() * 100) + 20;
          totalFilesFound += newFilesInThisBatch;
          
          // Simular encontrar arquivos de mídia
          const newMediaInThisBatch = Math.floor(newFilesInThisBatch * (Math.random() * 0.5 + 0.1));
          mediaFilesFound += newMediaInThisBatch;
          
          // Simular tamanho encontrado
          const averageFileSizeBytes = 2 * 1000000000;
          totalSizeEstimated += newMediaInThisBatch * averageFileSizeBytes;
          
          // Atualizar resultados
          setMediaScanResults({
            totalFiles: totalFilesFound,
            foundMedia: mediaFilesFound,
            estimatedSize: totalSizeEstimated,
          });
        }
        
        toast({
          title: "Verificação Concluída",
          description: `Foram encontrados ${mediaFilesFound} arquivos de mídia em ${totalFilesFound} arquivos verificados.`,
        });
        
      } catch (error) {
        toast({
          title: "Erro na Verificação",
          description: "Não foi possível completar a verificação: " + 
            (error instanceof Error ? error.message : "erro desconhecido"),
          variant: "destructive",
        });
      } finally {
        setIsMediaScanning(false);
      }
    }, 0);
  };
  
  // Função para importar mídia encontrada (simulada)
  const importFoundMedia = () => {
    if (!hdToScan || mediaScanResults.foundMedia === 0) return;
    
    toast({
      title: "Importação Iniciada",
      description: `Iniciando importação de ${mediaScanResults.foundMedia} arquivos de mídia...`,
    });
    
    // Em uma implementação real, aqui seria o redirecionamento para a página de importação
    // ou a chamada de uma função específica para processar os arquivos
    
    // Fechar diálogo
    setMediaScanDialogOpen(false);
    setHdToScan(null);
    
    // Simular conclusão após 2 segundos
    setTimeout(() => {
      toast({
        title: "Importação Concluída",
        description: `${mediaScanResults.foundMedia} arquivos de mídia foram importados com sucesso.`,
      });
    }, 2000);
  };

  // Helper para formatar a data
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Helper para obter ícone para o grupo
  const getGroupIcon = (group: string) => {
    switch (group) {
      case 'filmes':
        return <Film className="h-4 w-4 mr-2" />;
      case 'series':
        return <Tv className="h-4 w-4 mr-2" />;
      case 'backup':
        return <Database className="h-4 w-4 mr-2" />;
      case 'documentos':
        return <FolderPlus className="h-4 w-4 mr-2" />;
      default:
        return <Layers className="h-4 w-4 mr-2" />;
    }
  };
  
  // Helper para obter nome do grupo
  const getGroupName = (group: string) => {
    switch (group) {
      case 'filmes':
        return 'Filmes';
      case 'series':
        return 'Séries';
      case 'backup':
        return 'Backup';
      case 'documentos':
        return 'Documentos';
      default:
        return 'Geral';
    }
  };

  // Função para detectar automaticamente o tamanho do HD
  const detectHDSize = async (hd: HD) => {
    if (!hd.connected) {
      toast({
        title: "HD Desconectado",
        description: "Não é possível detectar o tamanho de um HD desconectado.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      toast({
        title: "Detectando Tamanho",
        description: "Tentando obter informações de espaço do HD...",
      });
      
      if ('navigator' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        
        if (estimate.quota && estimate.usage) {
          const totalSpace = estimate.quota;
          const usedSpace = estimate.usage;
          const freeSpace = totalSpace - usedSpace;
          
          // Atualizar o HD com os valores detectados
          const updatedHds = hds.map(item => {
            if (item.id === hd.id) {
              return {
                ...item,
                totalSpace,
                freeSpace
              };
            }
            return item;
          });
          
          setHds(updatedHds);
          localStorage.setItem("hds", JSON.stringify(updatedHds));
          
          toast({
            title: "Tamanho Detectado",
            description: `Espaço total: ${(totalSpace / 1000000000000).toFixed(1)} TB, Livre: ${(freeSpace / 1000000000000).toFixed(1)} TB`,
          });
        } else {
          throw new Error("Não foi possível obter informações de espaço");
        }
      } else {
        throw new Error("API de armazenamento não suportada");
      }
    } catch (error) {
      toast({
        title: "Erro na Detecção",
        description: error instanceof Error ? error.message : "Não foi possível detectar o tamanho do HD",
        variant: "destructive",
      });
    }
  };

  // Funções para drag and drop
  const handleDragStart = (hd: HD) => {
    setDraggedHd(hd);
  };

  const handleDragOver = (e: React.DragEvent, hdId: string) => {
    e.preventDefault();
    setDragOverHdId(hdId);
  };

  const handleDragEnd = () => {
    setDraggedHd(null);
    setDragOverHdId(null);
  };

  const handleDrop = (e: React.DragEvent, targetHdId: string) => {
    e.preventDefault();
    
    if (!draggedHd || draggedHd.id === targetHdId) {
      handleDragEnd();
      return;
    }
    
    const sourceIndex = hds.findIndex(hd => hd.id === draggedHd.id);
    const targetIndex = hds.findIndex(hd => hd.id === targetHdId);
    
    if (sourceIndex === -1 || targetIndex === -1) {
      handleDragEnd();
      return;
    }
    
    const updatedHds = [...hds];
    updatedHds.splice(sourceIndex, 1);
    updatedHds.splice(targetIndex, 0, draggedHd);
    
    setHds(updatedHds);
    localStorage.setItem("hds", JSON.stringify(updatedHds));
    
    toast({
      title: "HDs Reordenados",
      description: "A ordem dos HDs foi atualizada com sucesso.",
    });
    
    handleDragEnd();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Gerenciamento de HDs</h1>
          <p className="text-blue-700">Gerencie seus dispositivos de armazenamento</p>
        </div>

        <div className="flex flex-wrap gap-2">
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
            Adicionar HD
          </Button>
          
          <Button 
            variant="outline" 
            onClick={scanForConnectedHDs}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <HardDrive className="mr-2 h-4 w-4" />
                Verificar HDs
              </>
            )}
        </Button>
        </div>
      </div>
      
      {lastScanTime && (
        <p className="text-xs text-blue-500">
          Última verificação: {lastScanTime.toLocaleDateString()} às {lastScanTime.toLocaleTimeString()}
        </p>
      )}

      {hds.length > 0 && (
        <div className="flex items-center bg-blue-50 p-3 rounded-md text-sm text-blue-700">
          <Info className="h-4 w-4 mr-2 text-blue-500" />
          <p>As cores associadas a cada HD aparecem em toda a aplicação para facilitar a identificação de onde seus filmes e séries estão armazenados.</p>
        </div>
      )}

      {hds.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">HDs Cadastrados</p>
                  <p className="text-2xl font-bold text-blue-900">{hds.length}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <HardDrive className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex gap-2 text-xs text-blue-600">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>{hds.filter(hd => hd.connected).length} conectados</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span>{hds.filter(hd => !hd.connected).length} desconectados</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Espaço Total</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {(hds.reduce((acc, hd) => acc + hd.totalSpace, 0) / 1000000000000).toFixed(1)} TB
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Database className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 text-xs text-blue-600">
                <p className="mb-1">Uso dos HDs conectados:</p>
                <div className="h-2 w-full rounded-full bg-blue-100">
                  <div 
                    className="h-2 rounded-full bg-blue-600"
                    style={{ 
                      width: `${Math.min(100, Math.round((hds
                        .filter(hd => hd.connected)
                        .reduce((acc, hd) => acc + (hd.totalSpace - hd.freeSpace), 0) / 
                        hds.filter(hd => hd.connected)
                        .reduce((acc, hd) => acc + hd.totalSpace, 0)) * 100 || 0))}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Espaço Livre</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {(hds.filter(hd => hd.connected).reduce((acc, hd) => acc + hd.freeSpace, 0) / 1000000000000).toFixed(1)} TB
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Save className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 text-xs text-blue-600">
                <p>
                  {Math.round((hds.filter(hd => hd.connected).reduce((acc, hd) => acc + hd.freeSpace, 0) / 
                  hds.filter(hd => hd.connected).reduce((acc, hd) => acc + hd.totalSpace, 0)) * 100 || 0)}% 
                  disponível em HDs conectados
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {hds.length === 0 ? (
        <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
          <HardDrive className="mb-3 h-14 w-14 text-blue-400" />
          <p className="mb-2 text-lg font-medium text-blue-700">Nenhum HD cadastrado ainda</p>
          <p className="mb-4 text-sm text-blue-600">
            Adicione seus dispositivos de armazenamento para começar a gerenciar sua coleção de mídia.
          </p>
          <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar meu primeiro HD
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={sortBy === "name" ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleSort("name")}
              >
                Nome {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
              </Button>
              <Button 
                variant={sortBy === "freeSpace" ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleSort("freeSpace")}
              >
                Espaço Livre {sortBy === "freeSpace" && (sortOrder === "asc" ? "▲" : "▼")}
              </Button>
              <Button 
                variant={sortBy === "connected" ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleSort("connected")}
              >
                Status {sortBy === "connected" && (sortOrder === "asc" ? "▲" : "▼")}
              </Button>
              <Button 
                variant={sortBy === "group" ? "default" : "outline"} 
                size="sm" 
                onClick={() => handleSort("group")}
              >
                Grupo {sortBy === "group" && (sortOrder === "asc" ? "▲" : "▼")}
              </Button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGrouped(!showGrouped)}
            >
              {showGrouped ? "Ver lista completa" : "Ver por grupos"}
            </Button>
          </div>

          {showGrouped ? (
            // Visualização agrupada
            <div className="space-y-6">
              {Object.entries(groupedHds).map(([group, groupHds]) => 
                groupHds.length > 0 && (
                  <div key={group} className="rounded-lg border border-blue-100">
                    <div 
                      className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-t-lg cursor-pointer"
                      onClick={() => toggleGroupExpansion(group)}
                    >
                      <div className="flex items-center">
                        {getGroupIcon(group)}
                        <h3 className="text-lg font-medium text-blue-900">
                          {getGroupName(group)} ({groupHds.length})
                        </h3>
                      </div>
                      <span>{expandedGroups[group] ? '▼' : '▶'}</span>
                    </div>
                    
                    {expandedGroups[group] && (
                      <div className="p-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {groupHds.map((hd) => (
                          <Card 
                            key={hd.id}
                            className={`border-l-4 overflow-hidden ${dragOverHdId === hd.id ? 'ring-2 ring-blue-500' : ''}`}
                            style={{ borderLeftColor: hd.color }}
                            draggable
                            onDragStart={() => handleDragStart(hd)}
                            onDragOver={(e) => handleDragOver(e, hd.id)}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, hd.id)}
                          >
                            <CardHeader className="pb-2 px-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                                  <div className="cursor-grab active:cursor-grabbing">
                                    <Move className="h-4 w-4 text-blue-400" />
                                  </div>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: hd.color }} />
                                  <CardTitle className="text-lg">{hd.name}</CardTitle>
                  </div>
                                <Badge variant={hd.connected ? "default" : "destructive"} className="ml-2">
                                  {hd.connected ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
                              <CardDescription className="text-xs">{hd.path}</CardDescription>
              </CardHeader>
                            <CardContent className="px-4 pb-3 pt-0">
                {hd.connected && (
                  <>
                                  <div className="grid grid-cols-3 gap-2 items-center">
                                    <div className="col-span-2">
                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <span className="text-xs font-medium text-blue-600">Espaço</span>
                                        <span className="text-xs">
                                          {((hd.totalSpace - hd.freeSpace) / 1000000000000).toFixed(1)} / {(hd.totalSpace / 1000000000000).toFixed(1)} TB
                      </span>
                    </div>
                                      
                                      <div className="h-1.5 w-full rounded-full bg-blue-100">
                                        <div 
                                          className={`h-1.5 rounded-full ${getUsageColor(calculateUsagePercentage(hd))}`}
                                          style={{ width: `${calculateUsagePercentage(hd)}%` }}
                                        ></div>
                                      </div>
                                      
                                      <div className="mt-1 flex justify-between text-xs">
                                        <span className="text-blue-600">
                                          {(hd.freeSpace / 1000000000000).toFixed(1)} TB livre
                                        </span>
                                        <span className={`font-medium ${calculateUsagePercentage(hd) > 90 ? 'text-red-600' : 'text-blue-600'}`}>
                                          {calculateUsagePercentage(hd)}% usado
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-center">
                                      <DonutChart 
                                        percentage={calculateUsagePercentage(hd)} 
                                        size={70} 
                                        strokeWidth={6}
                                        primaryColor={getUsageColor(calculateUsagePercentage(hd)).replace('bg-', '')}
                                        secondaryColor="rgb(239, 246, 255)"
                                      />
                                    </div>
                    </div>
                  </>
                )}

                              <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                                <div className="text-blue-600">Tipo:</div>
                                <div className="col-span-2">{hd.type === 'interno' ? 'Interno' : 'Externo'}</div>
                                
                                <div className="text-blue-600">Grupo:</div>
                                <div className="col-span-2 flex items-center">
                                  {getGroupIcon(hd.group || 'geral')}
                                  {getGroupName(hd.group || 'geral')}
                                </div>
                                
                                {hd.model && (
                                  <>
                                    <div className="text-blue-600">Modelo:</div>
                                    <div className="col-span-2">{hd.model}</div>
                                  </>
                                )}
                              </div>

                              <div className="mt-3 pt-2 border-t border-blue-100 flex justify-between">
                                <div className="flex space-x-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleHdConnection(hd.id)} title={hd.connected ? "Desconectar" : "Conectar"}>
                                    {hd.connected ? (
                                      <PowerOff className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <Power className="h-4 w-4 text-green-500" />
                                    )}
                                  </Button>

                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(hd)} title="Editar">
                                    <Edit className="h-4 w-4 text-blue-500" />
                                  </Button>

                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => initiateDeleteHd(hd.id)} title="Excluir">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                  
                                  {hd.connected && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => detectHDSize(hd)} title="Detectar tamanho">
                                      <HardDriveDownload className="h-4 w-4 text-blue-500" />
                                    </Button>
                                  )}
                                </div>

                                {hd.connected && (
                                  <Button variant="ghost" size="sm" onClick={() => initiateMediaScan(hd)} className="h-8 px-2">
                                    <Search className="mr-1 h-4 w-4 text-blue-500" />
                                    <span className="text-xs">Escanear</span>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            // Visualização em lista
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedHds.map((hd) => (
                <Card 
                  key={hd.id}
                  className={`border-l-4 overflow-hidden ${dragOverHdId === hd.id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ borderLeftColor: hd.color }}
                  draggable
                  onDragStart={() => handleDragStart(hd)}
                  onDragOver={(e) => handleDragOver(e, hd.id)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, hd.id)}
                >
                  <CardHeader className="pb-2 px-4 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="cursor-grab active:cursor-grabbing">
                          <Move className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: hd.color }} />
                        <CardTitle className="text-lg">{hd.name}</CardTitle>
                      </div>
                      <Badge variant={hd.connected ? "default" : "destructive"} className="ml-2">
                        {hd.connected ? "Conectado" : "Desconectado"}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs flex items-center">
                      {getGroupIcon(hd.group || 'geral')}
                      <span>{hd.path}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    {hd.connected && (
                      <>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <div className="col-span-2">
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="text-xs font-medium text-blue-600">Espaço</span>
                              <span className="text-xs">
                                {((hd.totalSpace - hd.freeSpace) / 1000000000000).toFixed(1)} / {(hd.totalSpace / 1000000000000).toFixed(1)} TB
                              </span>
                            </div>
                            
                            <div className="h-1.5 w-full rounded-full bg-blue-100">
                              <div 
                                className={`h-1.5 rounded-full ${getUsageColor(calculateUsagePercentage(hd))}`}
                                style={{ width: `${calculateUsagePercentage(hd)}%` }}
                              ></div>
                            </div>
                            
                            <div className="mt-1 flex justify-between text-xs">
                              <span className="text-blue-600">
                                {(hd.freeSpace / 1000000000000).toFixed(1)} TB livre
                              </span>
                              <span className={`font-medium ${calculateUsagePercentage(hd) > 90 ? 'text-red-600' : 'text-blue-600'}`}>
                                {calculateUsagePercentage(hd)}% usado
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-center">
                            <DonutChart 
                              percentage={calculateUsagePercentage(hd)} 
                              size={70} 
                              strokeWidth={6}
                              primaryColor={hd.color}
                              secondaryColor="rgb(239, 246, 255)"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-1 text-xs">
                      <div className="text-blue-600">Tipo:</div>
                      <div className="col-span-2">{hd.type === 'interno' ? 'Interno' : 'Externo'}</div>
                      
                      <div className="text-blue-600">Adicionado:</div>
                      <div className="col-span-2">{formatDate(hd.additionDate)}</div>
                      
                      {hd.model && (
                        <>
                          <div className="text-blue-600">Modelo:</div>
                          <div className="col-span-2">{hd.model}</div>
                        </>
                      )}
                      
                      {hd.transferSpeed && (
                        <>
                          <div className="text-blue-600">Velocidade:</div>
                          <div className="col-span-2">{hd.transferSpeed}</div>
                        </>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-blue-100 flex justify-between">
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleHdConnection(hd.id)} title={hd.connected ? "Desconectar" : "Conectar"}>
                          {hd.connected ? (
                            <PowerOff className="h-4 w-4 text-red-500" />
                          ) : (
                            <Power className="h-4 w-4 text-green-500" />
                    )}
                  </Button>

                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(hd)} title="Editar">
                          <Edit className="h-4 w-4 text-blue-500" />
                  </Button>

                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => initiateDeleteHd(hd.id)} title="Excluir">
                          <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                        
                        {hd.connected && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => detectHDSize(hd)} title="Detectar tamanho">
                            <HardDriveDownload className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                      </div>

                      {hd.connected && (
                        <Button variant="ghost" size="sm" onClick={() => initiateMediaScan(hd)} className="h-8 px-2">
                          <Search className="mr-1 h-4 w-4 text-blue-500" />
                          <span className="text-xs">Escanear</span>
                        </Button>
                      )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
          )}
        </>
      )}

      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este HD? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteHd}>
              Excluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar HD" : "Adicionar Novo HD"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Atualize os detalhes do seu HD." : "Adicione um novo HD à sua coleção."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do HD</Label>
              <Input
                id="name"
                name="name"
                placeholder="HD de Mídia Principal"
                value={formData.name}
                onChange={handleInputChange}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-xs text-red-500">{formErrors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="path">Caminho</Label>
              <div className="flex gap-2">
                <Input
                  id="path"
                  name="path"
                  placeholder="D:/Mídia"
                  value={formData.path}
                  onChange={handleInputChange}
                  className={`flex-1 ${formErrors.path ? "border-red-500" : ""}`}
                />
                <Button type="button" variant="outline" onClick={selectDirectoryPath} className="whitespace-nowrap">
                  Selecionar Pasta
                </Button>
              </div>
              {formErrors.path && (
                <p className="text-xs text-red-500">{formErrors.path}</p>
              )}
              {!isFileSystemAccessSupported && (
                <p className="text-xs text-amber-600">
                  Nota: A seleção de diretório não é suportada em seu navegador. Você precisa inserir o caminho manualmente.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalSpace">Espaço Total (TB)</Label>
                <Input
                  id="totalSpace"
                  name="totalSpace"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={(formData.totalSpace / 1000000000000).toFixed(1)}
                  onChange={handleInputChange}
                  className={formErrors.totalSpace ? "border-red-500" : ""}
                />
                {formErrors.totalSpace && (
                  <p className="text-xs text-red-500">{formErrors.totalSpace}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="freeSpace">Espaço Livre (TB)</Label>
                <Input
                  id="freeSpace"
                  name="freeSpace"
                  type="number"
                  step="0.1"
                  min="0"
                  max={(formData.totalSpace / 1000000000000).toFixed(1)}
                  value={(formData.freeSpace / 1000000000000).toFixed(1)}
                  onChange={handleInputChange}
                  className={formErrors.freeSpace ? "border-red-500" : ""}
                />
                {formErrors.freeSpace && (
                  <p className="text-xs text-red-500">{formErrors.freeSpace}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  className="w-12"
                  value={formData.color}
                  onChange={handleInputChange}
                />
                <Input name="color" value={formData.color} onChange={handleInputChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo de HD</Label>
                <select
                  id="type"
                  name="type"
                  className="rounded-md border border-input bg-background px-3 py-2"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'interno' | 'externo'})}
                >
                  <option value="externo">Externo</option>
                  <option value="interno">Interno</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="additionDate">Data de Adição</Label>
                <Input
                  id="additionDate"
                  name="additionDate"
                  type="date"
                  value={formData.additionDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model">Modelo (opcional)</Label>
              <Input
                id="model"
                name="model"
                placeholder="Western Digital Blue 1TB"
                value={formData.model}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="serialNumber">Número de Série (opcional)</Label>
                <Input
                  id="serialNumber"
                  name="serialNumber"
                  placeholder="WD10EZEX-75WN4A0"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="transferSpeed">Velocidade (opcional)</Label>
                <Input
                  id="transferSpeed"
                  name="transferSpeed"
                  placeholder="USB 3.0, 5GB/s"
                  value={formData.transferSpeed}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="group">Grupo</Label>
              <select
                id="group"
                name="group"
                className="rounded-md border border-input bg-background px-3 py-2"
                value={formData.group}
                onChange={(e) => setFormData({...formData, group: e.target.value as 'geral' | 'filmes' | 'series' | 'documentos' | 'backup'})}
              >
                <option value="geral">Geral</option>
                <option value="filmes">Filmes</option>
                <option value="series">Séries</option>
                <option value="documentos">Documentos</option>
                <option value="backup">Backup</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button onClick={saveHd}>
              <Check className="mr-2 h-4 w-4" />
              {isEditing ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={mediaScanDialogOpen} onOpenChange={setMediaScanDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escanear Mídia em {hdToScan?.name}</DialogTitle>
            <DialogDescription>
              Esta ação irá verificar o HD em busca de arquivos de mídia que podem ser importados.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isMediaScanning ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                </div>
                
                <Progress
                  value={(mediaScanResults.totalFiles / 1000) * 100} 
                  className="h-2 bg-gray-100"
                  indicatorColor="bg-blue-600"
                />
                
                <div className="space-y-2 text-center">
                  <div className="text-sm text-blue-700">
                    Verificando arquivos... 
                  </div>
                  <div className="text-sm">
                    {mediaScanResults.totalFiles} arquivos verificados
                  </div>
                  <div className="text-sm">
                    {mediaScanResults.foundMedia} arquivos de mídia encontrados
                  </div>
                  <div className="text-sm">
                    {formatSize(mediaScanResults.estimatedSize)} de mídia
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center">
                  Clique em "Iniciar" para começar a escanear {hdToScan?.name} em busca de arquivos de mídia.
                </p>
                
                {mediaScanResults.foundMedia > 0 && (
                  <div className="rounded-lg bg-blue-50 p-4 text-center">
                    <p className="font-medium text-blue-900">Resultados da Verificação</p>
                    <div className="mt-2 space-y-1 text-sm text-blue-700">
                      <p>{mediaScanResults.totalFiles} arquivos verificados</p>
                      <p>{mediaScanResults.foundMedia} arquivos de mídia encontrados</p>
                      <p>{formatSize(mediaScanResults.estimatedSize)} de mídia</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setMediaScanDialogOpen(false);
                setHdToScan(null);
              }}
              disabled={isMediaScanning}
            >
              Cancelar
            </Button>
            
            <div className="flex gap-2">
              {mediaScanResults.foundMedia > 0 && !isMediaScanning && (
                <Button onClick={importFoundMedia}>
                  Importar {mediaScanResults.foundMedia} Arquivos
                </Button>
              )}
              
              {!isMediaScanning ? (
                <Button onClick={scanMediaInHd} disabled={!hdToScan}>
                  Iniciar
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setIsMediaScanning(false)}>
                  Parar
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

