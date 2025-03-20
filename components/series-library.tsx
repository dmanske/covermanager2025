"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Eye, EyeOff, Grid, List, HardDrive, Filter, Edit } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { HD, Series } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { downloadAndStoreImage, getImageUrl } from "@/lib/image-service"

export function SeriesLibrary() {
  const { toast } = useToast()
  const [series, setSeries] = useState<Series[]>([])
  const [hds, setHds] = useState<HD[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showHidden, setShowHidden] = useState(false)
  const [hdFilter, setHdFilter] = useState<string | null>(null)
  const [watchedFilter, setWatchedFilter] = useState<"all" | "watched" | "unwatched" | "in-progress">("all")
  const [seriesImages, setSeriesImages] = useState<Record<string, string>>({})
  const [isLoadingImages, setIsLoadingImages] = useState(true)

  useEffect(() => {
    // Load data from localStorage
    const storedSeries = localStorage.getItem("series")
    const storedHds = localStorage.getItem("hds")

    if (storedSeries) {
      const parsedSeries = JSON.parse(storedSeries);
      setSeries(parsedSeries)
      
      // Load images for each series
      loadSeriesImages(parsedSeries);
    } else {
      // Se não houver séries, adicionar exemplos
      const exampleSeries = [
        {
          id: "1",
          title: "Breaking Bad",
          hdId: "1",
          hdName: "HD Principal",
          hidden: false,
          imdbId: "tt0903747",
          poster: "/placeholder.svg?height=450&width=300",
          addedAt: new Date().toISOString(),
          seasons: [
            {
              number: 1,
              totalEpisodes: 7,
              availableEpisodes: 7,
              episodes: Array.from({ length: 7 }, (_, i) => ({
                id: `s1e${i+1}`,
                number: i + 1,
                season: 1,
                episode: i + 1,
                title: `Episódio ${i + 1}`,
                titlePt: `Episódio ${i + 1}`,
                filename: `Breaking.Bad.S01E0${i + 1}.1080p.BluRay.mkv`,
                duration: 45,
                watched: i < 5,
                synopsis: "Sinopse do episódio",
                imdbRating: 8.5,
                releaseDate: "2008-01-20",
              })),
            },
            {
              number: 2,
              totalEpisodes: 13,
              availableEpisodes: 10,
              episodes: Array.from({ length: 10 }, (_, i) => ({
                id: `s2e${i+1}`,
                number: i + 1,
                season: 2,
                episode: i + 1,
                title: `Episódio ${i + 1}`,
                titlePt: `Episódio ${i + 1}`,
                filename: `Breaking.Bad.S02E${i < 9 ? "0" : ""}${i + 1}.1080p.BluRay.mkv`,
                duration: 45,
                watched: i < 3,
                synopsis: "Sinopse do episódio",
                imdbRating: 8.7,
                releaseDate: "2009-03-08",
              })),
            },
          ],
        },
        {
          id: "2",
          title: "The Mandalorian",
          hdId: "1",
          hdName: "HD Principal",
          hidden: false,
          imdbId: "tt8111088",
          poster: "/placeholder.svg?height=450&width=300",
          addedAt: new Date().toISOString(),
          seasons: [
            {
              number: 1,
              totalEpisodes: 8,
              availableEpisodes: 8,
              episodes: Array.from({ length: 8 }, (_, i) => ({
                id: `mandalorian_s1e${i+1}`,
                number: i + 1,
                season: 1,
                episode: i + 1,
                title: `Capítulo ${i + 1}`,
                titlePt: `Capítulo ${i + 1}`,
                filename: `The.Mandalorian.S01E0${i + 1}.1080p.WEB-DL.mkv`,
                duration: 40,
                watched: i < 8,
                synopsis: "Sinopse do episódio",
                imdbRating: 8.8,
                releaseDate: "2019-11-12",
              })),
            },
          ],
        },
        {
          id: "3",
          title: "Stranger Things",
          hdId: "2",
          hdName: "Backup HD",
          hidden: false,
          imdbId: "tt4574334",
          poster: "/placeholder.svg?height=450&width=300",
          addedAt: new Date().toISOString(),
          seasons: [
            {
              number: 1,
              totalEpisodes: 8,
              availableEpisodes: 8,
              episodes: Array.from({ length: 8 }, (_, i) => ({
                id: `st_s1e${i+1}`,
                number: i + 1,
                season: 1,
                episode: i + 1,
                title: `Capítulo ${i + 1}`,
                titlePt: `Capítulo ${i + 1}`,
                filename: `Stranger.Things.S01E0${i + 1}.1080p.NF.WEB-DL.mkv`,
                duration: 50,
                watched: true,
                synopsis: "Sinopse do episódio",
                imdbRating: 8.7,
                releaseDate: "2016-07-15",
              })),
            },
          ],
        },
      ];
      
      // Salvar dados de exemplo no localStorage
      localStorage.setItem("series", JSON.stringify(exampleSeries));
      setSeries(exampleSeries);
      
      // Carregar imagens das séries de exemplo
      loadSeriesImages(exampleSeries);
      
      toast({
        title: "Séries de exemplo adicionadas",
        description: "Adicionamos algumas séries de exemplo para você começar",
      });
    }

    if (storedHds) {
      setHds(JSON.parse(storedHds))
    } else {
      // Se não houver HDs, adicionar exemplos
      const exampleHDs = [
        {
          id: "1",
          name: "HD Principal",
          label: "HD1",
          path: "D:/Media",
          connected: true,
          sizeGB: 1000,
          usedGB: 600,
          color: "#3B82F6",
        },
        {
          id: "2",
          name: "Backup HD",
          label: "HD2",
          path: "E:/Backup",
          connected: false,
          sizeGB: 2000,
          usedGB: 500,
          color: "#10B981",
        },
      ];
      
      // Salvar HDs de exemplo no localStorage
      localStorage.setItem("hds", JSON.stringify(exampleHDs));
      setHds(exampleHDs);
    }
  }, [])
  
  // Função para carregar imagens das séries
  const loadSeriesImages = async (seriesList: Series[]) => {
    setIsLoadingImages(true);
    const images: Record<string, string> = {};
    
    try {
      for (const series of seriesList) {
        // Verificar se a série tem um caminho de poster
        if (series.poster) {
          // Se for uma URL completa ou um caminho para placeholder, usar diretamente
          if (series.poster.startsWith('http') || series.poster.startsWith('/')) {
            images[series.id] = series.poster;
          } else {
            // Se for um ID de imagem local, buscar do banco
            try {
              // Tentar obter a imagem local ou do TMDb
              let posterPath: string | undefined;
              if (series.imdbId && series.imdbId.startsWith('tmdb-')) {
                // Extrair o ID do TMDb
                posterPath = series.poster.includes('/') ? series.poster : undefined;
              }
              
              const imgResult = await getImageUrl(series.id, 'poster', posterPath);
              images[series.id] = imgResult.url;
              
              // Se a imagem não for local e for do TMDb, fazer download para armazenar localmente
              if (!imgResult.isLocal && posterPath && posterPath.startsWith('/')) {
                // Download assíncrono para não bloquear a interface
                downloadAndStoreImage(posterPath, series.id, 'poster').catch(e => 
                  console.error(`Erro ao baixar imagem para ${series.title}:`, e)
                );
              }
            } catch (error) {
              console.error(`Erro ao carregar imagem para ${series.title}:`, error);
              images[series.id] = '/placeholder.svg?height=450&width=300';
            }
          }
        } else {
          // Se não tiver poster, usar placeholder
          images[series.id] = '/placeholder.svg?height=450&width=300';
        }
      }
      
      setSeriesImages(images);
    } catch (error) {
      console.error('Erro ao carregar imagens:', error);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const toggleSeriesVisibility = (id: string) => {
    const updatedSeries = series.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s))

    setSeries(updatedSeries)
    localStorage.setItem("series", JSON.stringify(updatedSeries))

    toast({
      title: "Status Atualizado",
      description: `A visibilidade da série foi alternada.`,
    })
  }
  
  // Função para atualizar a capa de uma série
  const updateSeriesPoster = (seriesId: string, posterUrl: string) => {
    const updatedSeries = series.map((s) => 
      s.id === seriesId ? { ...s, poster: posterUrl } : s
    );
    
    // Atualizar estado e localStorage
    setSeries(updatedSeries);
    localStorage.setItem("series", JSON.stringify(updatedSeries));
    
    // Atualizar o cache de imagens
    setSeriesImages(prev => ({
      ...prev,
      [seriesId]: posterUrl
    }));
  };

  const calculateWatchProgress = (series: Series) => {
    if (!series.seasons || series.seasons.length === 0) {
      return { totalEpisodes: 0, watchedEpisodes: 0, percentage: 0 };
    }

    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    series.seasons.forEach((season) => {
      if (season.episodes) {
        season.episodes.forEach((episode) => {
          totalEpisodes++;
          if (episode.watched) {
            watchedEpisodes++;
          }
        });
      }
    });

    return {
      totalEpisodes,
      watchedEpisodes,
      percentage: totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0,
    };
  }

  const getSeriesStatus = (series: Series) => {
    const progress = calculateWatchProgress(series)

    if (progress.watchedEpisodes === 0) return "unwatched"
    if (progress.watchedEpisodes === progress.totalEpisodes) return "watched"
    return "in-progress"
  }

  const filteredSeries = series.filter((s) => {
    // Filter by visibility
    if (!showHidden && s.hidden) return false

    // Filter by HD
    if (hdFilter === "connected") {
      const hd = hds.find((h) => h.id === s.hdId)
      if (!hd?.connected) return false
    } else if (hdFilter === "disconnected") {
      const hd = hds.find((h) => h.id === s.hdId)
      if (hd?.connected) return false
    } else if (hdFilter && hdFilter !== "all" && s.hdId !== hdFilter) {
      return false
    }

    // Filter by watched status
    if (watchedFilter !== "all") {
      const status = getSeriesStatus(s)
      if (watchedFilter !== status) return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Biblioteca de Séries</h1>
          <p className="text-blue-700">Gerenciar sua coleção de séries</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHidden(!showHidden)}
            className={showHidden ? "bg-blue-100" : ""}
          >
            {showHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
            {showHidden ? "Mostrar Todas" : "Ocultas: Não"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <HardDrive className="mr-2 h-4 w-4" />
                Filtrar por HD
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por HD</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={hdFilter === "all" || hdFilter === null}
                onCheckedChange={() => setHdFilter("all")}
              >
                Todos os HDs
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hdFilter === "connected"}
                onCheckedChange={() => setHdFilter("connected")}
              >
                Apenas Conectados
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={hdFilter === "disconnected"}
                onCheckedChange={() => setHdFilter("disconnected")}
              >
                Apenas Desconectados
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              {hds.map((hd) => (
                <DropdownMenuCheckboxItem
                  key={hd.id}
                  checked={hdFilter === hd.id}
                  onCheckedChange={() => setHdFilter(hd.id)}
                >
                  <div className="flex items-center">
                    <div className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: hd.color }} />
                    {hd.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={watchedFilter === "all"}
                onCheckedChange={() => setWatchedFilter("all")}
              >
                Todas as Séries
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={watchedFilter === "watched"}
                onCheckedChange={() => setWatchedFilter("watched")}
              >
                Completadas
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={watchedFilter === "in-progress"}
                onCheckedChange={() => setWatchedFilter("in-progress")}
              >
                Em Progresso
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={watchedFilter === "unwatched"}
                onCheckedChange={() => setWatchedFilter("unwatched")}
              >
                Não Iniciadas
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex rounded-md border border-input">
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-none rounded-l-md ${viewMode === "grid" ? "bg-blue-100" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
              <span className="sr-only">Visualização em grade</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-none rounded-r-md ${viewMode === "list" ? "bg-blue-100" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
              <span className="sr-only">Visualização em lista</span>
            </Button>
          </div>
        </div>
      </div>

      {filteredSeries.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
          <p className="text-blue-700">Nenhuma série encontrada com os filtros aplicados.</p>
          <Button
            variant="link"
            onClick={() => {
              setHdFilter(null)
              setWatchedFilter("all")
              setShowHidden(false)
            }}
          >
            Limpar todos os filtros
          </Button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredSeries.map((series) => {
            const progress = calculateWatchProgress(series)
            const hd = hds.find((h) => h.id === series.hdId)
            const seriesImage = seriesImages[series.id] || '/placeholder.svg?height=450&width=300'
            const tmdbId = series.imdbId && series.imdbId.startsWith('tmdb-') 
              ? series.imdbId.replace('tmdb-', '') 
              : undefined;

            return (
              <Card key={series.id} className="overflow-hidden">
                <div className="relative">
                  <Link href={`/series/${series.id}`}>
                    <img
                      src={seriesImage}
                      alt={series.title}
                      className="aspect-[2/3] w-full object-cover"
                    />
                  </Link>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                    onClick={() => toggleSeriesVisibility(series.id)}
                  >
                    {series.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="sr-only">{series.hidden ? "Mostrar série" : "Ocultar série"}</span>
                  </Button>

                  <div className="absolute left-2 top-2">
                    <ImageUpload
                      mediaId={series.id}
                      mediaTitle={series.title}
                      type="poster"
                      currentImagePath={series.poster}
                      onImageSelected={(imageUrl) => updateSeriesPoster(series.id, imageUrl)}
                      tmdbId={tmdbId}
                    />
                  </div>
                </div>

                <CardContent className="p-3">
                  <Link
                    href={`/series/${series.id}`}
                    className="line-clamp-1 font-medium text-blue-900 hover:underline"
                  >
                    {series.title}
                  </Link>

                  <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: hd?.color || "#3B82F6" }} />
                    <span>{hd?.name || "HD Desconhecido"}</span>
                    <span className="ml-1">({hd?.connected ? "Conectado" : "Desconectado"})</span>
                  </div>

                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>Progresso</span>
                      <span>{progress.percentage}%</span>
                    </div>
                    <Progress value={progress.percentage} className="h-1.5 bg-blue-100" indicatorColor="bg-blue-600" />
                    <div className="mt-1 text-xs text-blue-600">
                      {progress.watchedEpisodes} de {progress.totalEpisodes} episódios
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSeries.map((series) => {
            const progress = calculateWatchProgress(series)
            const hd = hds.find((h) => h.id === series.hdId)
            const seriesImage = seriesImages[series.id] || '/placeholder.svg?height=450&width=300'
            const tmdbId = series.imdbId && series.imdbId.startsWith('tmdb-') 
              ? series.imdbId.replace('tmdb-', '') 
              : undefined;

            return (
              <div key={series.id} className="flex items-center gap-4 rounded-lg border border-blue-100 bg-white p-3">
                <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded">
                  <img
                    src={seriesImage}
                    alt={series.title}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/series/${series.id}`} className="font-medium text-blue-900 hover:underline">
                    {series.title}
                  </Link>

                  <div className="mt-1 flex items-center gap-1 text-xs text-blue-600">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: hd?.color || "#3B82F6" }} />
                    <span>{hd?.name || "HD Desconhecido"}</span>
                    <span className="ml-1">({hd?.connected ? "Conectado" : "Desconectado"})</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={progress.percentage} className="h-1.5 w-24 bg-blue-100 sm:w-32" indicatorColor="bg-blue-600" />
                    <span className="text-xs text-blue-600">
                      {progress.watchedEpisodes} de {progress.totalEpisodes} episódios
                    </span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <ImageUpload
                    mediaId={series.id}
                    mediaTitle={series.title}
                    type="poster"
                    currentImagePath={series.poster}
                    onImageSelected={(imageUrl) => updateSeriesPoster(series.id, imageUrl)}
                    tmdbId={tmdbId}
                  />
                
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                    onClick={() => toggleSeriesVisibility(series.id)}
                  >
                    {series.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span className="sr-only">{series.hidden ? "Mostrar série" : "Ocultar série"}</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

