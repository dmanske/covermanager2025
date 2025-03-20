"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, Image as ImageIcon, Check, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { 
  downloadAndStoreImage, 
  storeCustomImage, 
  getImagesByMedia, 
  getImageById,
  getImageUrl,
  deleteImage,
  ImageType
} from "@/lib/image-service"

interface ImageUploadProps {
  mediaId: string;
  mediaTitle: string;
  type: ImageType;
  currentImagePath?: string;
  onImageSelected: (imageUrl: string) => void;
  tmdbId?: string;
}

export function ImageUpload({
  mediaId,
  mediaTitle,
  type,
  currentImagePath,
  onImageSelected,
  tmdbId
}: ImageUploadProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"current" | "tmdb" | "custom">("current")
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{ url: string, path: string }>>([])
  const [localImages, setLocalImages] = useState<Array<{ id: string, url: string, timestamp: number }>>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentImage, setCurrentImage] = useState<string | null>(null)

  // Carregar imagem atual
  useEffect(() => {
    const loadCurrentImage = async () => {
      if (currentImagePath) {
        if (currentImagePath.startsWith('http') || currentImagePath.startsWith('/')) {
          setCurrentImage(currentImagePath);
        } else {
          // É um ID de imagem local
          try {
            const image = await getImageById(currentImagePath);
            if (image) {
              setCurrentImage(image.data);
            }
          } catch (error) {
            console.error('Erro ao carregar imagem atual:', error);
          }
        }
      }
    };

    loadCurrentImage();
  }, [currentImagePath]);

  // Carregar imagens locais quando o diálogo abrir
  useEffect(() => {
    if (isDialogOpen) {
      loadLocalImages();
    }
  }, [isDialogOpen, mediaId, type]);

  const loadLocalImages = async () => {
    try {
      const images = await getImagesByMedia(mediaId, type);
      
      const imageUrls = await Promise.all(
        images.map(async img => {
          const image = await getImageById(img.id);
          return image ? { 
            id: img.id, 
            url: image.data, 
            timestamp: img.metadata.timestamp 
          } : null;
        })
      );
      
      setLocalImages(imageUrls.filter(Boolean) as any[]);
    } catch (error) {
      console.error('Erro ao carregar imagens locais:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo Inválido",
        description: "Por favor, selecione uma imagem válida.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Armazenar a imagem localmente
      const imageId = await storeCustomImage(file, mediaId, type);
      
      if (imageId) {
        // Buscar a imagem armazenada
        const image = await getImageById(imageId);
        if (image) {
          // Adicionar à lista de imagens locais
          setLocalImages(prev => [
            { id: imageId, url: image.data, timestamp: Date.now() },
            ...prev
          ]);
          
          // Selecionar a nova imagem
          setSelectedImage(image.data);
        }
      }
      
      // Limpar o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Imagem Carregada",
        description: "Sua imagem foi carregada com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao fazer upload de imagem:', error);
      toast({
        title: "Erro no Upload",
        description: "Ocorreu um erro ao fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchTmdbImages = async () => {
    if (!tmdbId) {
      toast({
        title: "ID TMDB Ausente",
        description: "Este item não tem um ID do TMDB associado.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const apiKey = localStorage.getItem("imdbApiKey");
      if (!apiKey) {
        throw new Error("Chave de API do TMDB não encontrada.");
      }
      
      // Determinar o endpoint com base no tipo
      let endpoint = '';
      if (type === 'poster') {
        endpoint = `https://api.themoviedb.org/3/tv/${tmdbId}/images?api_key=${apiKey}`;
      } else if (type === 'season') {
        // Assumindo que tmdbId contém o seasonNumber como "seriesId_seasonNumber"
        const [seriesId, seasonNumber] = tmdbId.split('_');
        endpoint = `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}/images?api_key=${apiKey}`;
      } else if (type === 'backdrop') {
        endpoint = `https://api.themoviedb.org/3/tv/${tmdbId}/images?api_key=${apiKey}`;
      }
      
      if (!endpoint) {
        throw new Error("Tipo de imagem não suportado para pesquisa no TMDB.");
      }
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar imagens: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Processar resultados com base no tipo
      let results: Array<{ url: string, path: string }> = [];
      
      if (type === 'poster' && data.posters) {
        results = data.posters.map((poster: any) => ({
          url: `https://image.tmdb.org/t/p/w300${poster.file_path}`,
          path: poster.file_path
        }));
      } else if (type === 'backdrop' && data.backdrops) {
        results = data.backdrops.map((backdrop: any) => ({
          url: `https://image.tmdb.org/t/p/w300${backdrop.file_path}`,
          path: backdrop.file_path
        }));
      } else if (type === 'season' && data.posters) {
        results = data.posters.map((poster: any) => ({
          url: `https://image.tmdb.org/t/p/w300${poster.file_path}`,
          path: poster.file_path
        }));
      }
      
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({
          title: "Nenhuma Imagem Encontrada",
          description: "Não foram encontradas imagens para este item no TMDB.",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar imagens do TMDB:', error);
      toast({
        title: "Erro na Busca",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao buscar imagens.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTmdbImageSelect = async (path: string) => {
    setIsLoading(true);
    
    try {
      const imageId = await downloadAndStoreImage(path, mediaId, type);
      
      if (imageId) {
        // Buscar a imagem armazenada
        const image = await getImageById(imageId);
        if (image) {
          // Selecionar a nova imagem
          setSelectedImage(image.data);
          
          // Recarregar imagens locais
          await loadLocalImages();
        }
      }
      
      toast({
        title: "Imagem Baixada",
        description: "A imagem foi baixada e armazenada localmente.",
      });
    } catch (error) {
      console.error('Erro ao baixar imagem do TMDB:', error);
      toast({
        title: "Erro ao Baixar",
        description: "Ocorreu um erro ao baixar a imagem.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveImage = () => {
    if (selectedImage) {
      onImageSelected(selectedImage);
      setIsDialogOpen(false);
      
      toast({
        title: "Imagem Atualizada",
        description: "A imagem foi atualizada com sucesso.",
      });
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await deleteImage(id);
      
      // Atualizar a lista de imagens locais
      setLocalImages(prev => prev.filter(img => img.id !== id));
      
      // Se a imagem selecionada foi excluída, limpar a seleção
      if (selectedImage && localImages.find(img => img.id === id)?.url === selectedImage) {
        setSelectedImage(null);
      }
      
      toast({
        title: "Imagem Excluída",
        description: "A imagem foi excluída com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir imagem:', error);
      toast({
        title: "Erro ao Excluir",
        description: "Ocorreu um erro ao excluir a imagem.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={() => setIsDialogOpen(true)}
      >
        <ImageIcon className="h-4 w-4" />
        <span>Gerenciar Capa</span>
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Capa de {mediaTitle}</DialogTitle>
            <DialogDescription>
              Selecione, faça upload ou busque uma nova capa para {mediaTitle}.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Capa Atual</TabsTrigger>
              <TabsTrigger value="tmdb" onClick={searchTmdbImages}>Buscar no TMDB</TabsTrigger>
              <TabsTrigger value="custom">Upload Personal</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="min-h-[300px]">
              <div className="flex flex-col items-center justify-center">
                {currentImage ? (
                  <div className="relative">
                    <img 
                      src={currentImage} 
                      alt={mediaTitle} 
                      className="h-[300px] object-contain"
                    />
                    {selectedImage === null && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="rounded-full bg-blue-600 p-2">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-[300px] w-[200px] flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Nenhuma capa definida</p>
                  </div>
                )}
                
                {currentImage && selectedImage && (
                  <Button 
                    className="mt-4" 
                    variant="outline" 
                    onClick={() => setSelectedImage(null)}
                  >
                    Manter Capa Atual
                  </Button>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="tmdb" className="min-h-[300px]">
              {isLoading ? (
                <div className="flex h-[300px] items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : searchResults.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-3 gap-4 p-2">
                    {searchResults.map((result, index) => (
                      <div 
                        key={index}
                        className="relative cursor-pointer overflow-hidden rounded-md"
                        onClick={() => handleTmdbImageSelect(result.path)}
                      >
                        <img 
                          src={result.url} 
                          alt={`${mediaTitle} ${index + 1}`} 
                          className="h-[160px] w-full object-cover transition-transform hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    Clique no botão abaixo para buscar imagens do TMDB
                  </p>
                  <Button className="mt-4" onClick={searchTmdbImages}>
                    Buscar Imagens
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="custom" className="min-h-[300px]">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <label 
                    htmlFor="image-upload" 
                    className="flex h-[100px] w-[200px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-blue-500"
                  >
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-500">Clique para fazer upload</span>
                    <input
                      id="image-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isLoading}
                    />
                  </label>
                </div>
                
                {isLoading ? (
                  <div className="flex h-[100px] items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : localImages.length > 0 ? (
                  <ScrollArea className="h-[300px]">
                    <div className="grid grid-cols-3 gap-4 p-2">
                      {localImages.map((image) => (
                        <div key={image.id} className="relative overflow-hidden rounded-md">
                          <img 
                            src={image.url} 
                            alt="Imagem carregada" 
                            className="h-[160px] w-full cursor-pointer object-cover transition-transform hover:scale-105"
                            onClick={() => setSelectedImage(image.url)}
                          />
                          
                          {selectedImage === image.url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="rounded-full bg-blue-600 p-2">
                                <Check className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          )}
                          
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2 h-6 w-6"
                            onClick={() => handleDeleteImage(image.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex h-[200px] flex-col items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      Nenhuma imagem carregada
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveImage} 
              disabled={!selectedImage && currentImage !== null}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 