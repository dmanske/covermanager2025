"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Edit, Search, Clock, Play, Info, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileBrowser } from "@/components/file-browser"
import type { HD, Series, Episode } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { ImageUpload } from "@/components/image-upload"
import { downloadAndStoreImage, getImageUrl } from "@/lib/image-service"

interface SeriesDetailProps {
  id: string
}

export function SeriesDetail({ id }: SeriesDetailProps) {
  const { toast } = useToast()
  const [series, setSeries] = useState<Series | null>(null)
  const [hd, setHd] = useState<HD | null>(null)
  const [episodeInfo, setEpisodeInfo] = useState<Episode | null>(null)
  const [episodeDialogOpen, setEpisodeDialogOpen] = useState(false)
  const [isLoadingImdb, setIsLoadingImdb] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditMode, setIsEditMode] = useState(false)
  const [posterImage, setPosterImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(true)

  useEffect(() => {
    loadSeriesData()
  }, [id])

  const loadSeriesData = () => {
    // Load series data from localStorage
    const storedSeries = localStorage.getItem("series")
    const storedHds = localStorage.getItem("hds")

    if (!storedSeries || !storedHds) return

    const allSeries = JSON.parse(storedSeries)
    const allHds = JSON.parse(storedHds)

    const currentSeries = allSeries.find((s: Series) => s.id === id)
    if (!currentSeries) return

    setSeries(currentSeries)
    loadSeriesImage(currentSeries)

    // Get associated HD
    const associatedHd = allHds.find((h: HD) => h.id === currentSeries.hdId)
    setHd(associatedHd || null)
  }
  
  // Função para carregar a imagem da série
  const loadSeriesImage = async (currentSeries: Series) => {
    setIsLoadingImage(true);
    try {
      if (currentSeries.poster) {
        // Se for uma URL completa ou um caminho para placeholder, usar diretamente
        if (currentSeries.poster.startsWith('http') || currentSeries.poster.startsWith('/')) {
          setPosterImage(currentSeries.poster);
        } else {
          // Se for um ID de imagem local, buscar do banco
          try {
            // Tentar obter a imagem local ou do TMDb
            let posterPath: string | undefined;
            if (currentSeries.imdbId && currentSeries.imdbId.startsWith('tmdb-')) {
              // Extrair o ID do TMDb
              posterPath = currentSeries.poster.includes('/') ? currentSeries.poster : undefined;
            }
            
            const imgResult = await getImageUrl(currentSeries.id, 'poster', posterPath);
            setPosterImage(imgResult.url);
            
            // Se a imagem não for local e for do TMDb, fazer download para armazenar localmente
            if (!imgResult.isLocal && posterPath && posterPath.startsWith('/')) {
              // Download assíncrono para não bloquear a interface
              downloadAndStoreImage(posterPath, currentSeries.id, 'poster').catch(e => 
                console.error(`Erro ao baixar imagem para ${currentSeries.title}:`, e)
              );
            }
          } catch (error) {
            console.error(`Erro ao carregar imagem para ${currentSeries.title}:`, error);
            setPosterImage('/placeholder.svg?height=450&width=300');
          }
        }
      } else {
        // Se não tiver poster, usar placeholder
        setPosterImage('/placeholder.svg?height=450&width=300');
      }
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      setPosterImage('/placeholder.svg?height=450&width=300');
    } finally {
      setIsLoadingImage(false);
    }
  };

  // Função para atualizar o poster da série
  const updateSeriesPoster = (posterUrl: string) => {
    if (!series) return;
    
    const updatedSeries = { ...series, poster: posterUrl };
    
    // Atualizar no estado local
    setSeries(updatedSeries);
    setPosterImage(posterUrl);
    
    // Atualizar no localStorage
    const storedSeries = localStorage.getItem("series");
    if (storedSeries) {
      const allSeries = JSON.parse(storedSeries);
      const updatedAllSeries = allSeries.map((s: Series) => 
        s.id === series.id ? updatedSeries : s
      );
      localStorage.setItem("series", JSON.stringify(updatedAllSeries));
      
      toast({
        title: "Capa Atualizada",
        description: "A capa da série foi atualizada com sucesso.",
      });
    }
  };

  const toggleSeriesVisibility = () => {
    if (!series) return

    const storedSeries = localStorage.getItem("series")
    if (!storedSeries) return

    const allSeries = JSON.parse(storedSeries)
    const updatedSeries = allSeries.map((s: Series) => (s.id === series.id ? { ...s, hidden: !s.hidden } : s))

    localStorage.setItem("series", JSON.stringify(updatedSeries))
    setSeries({ ...series, hidden: !series.hidden })

    toast({
      title: "Series Updated",
      description: `Series visibility has been toggled.`,
    })
  }

  const toggleEpisodeWatched = (seasonIndex: number, episodeIndex: number) => {
    if (!series) return

    const storedSeries = localStorage.getItem("series")
    if (!storedSeries) return

    const allSeries = JSON.parse(storedSeries)
    const seriesCopy = { ...series }
    
    // Verificar se seasons existe
    if (!seriesCopy.seasons) return;
    
    // Obter informações do episódio para incluir na mensagem
    const season = seriesCopy.seasons[seasonIndex];
    const episode = season.episodes[episodeIndex];
    const newStatus = !episode.watched;

    // Alternar o status de assistido
    seriesCopy.seasons[seasonIndex].episodes[episodeIndex].watched = newStatus;

    // Atualizar a série no estado e no localStorage
    const updatedSeries = allSeries.map((s: Series) => (s.id === series.id ? seriesCopy : s))

    localStorage.setItem("series", JSON.stringify(updatedSeries))
    setSeries(seriesCopy)

    toast({
      title: "Episódio Atualizado",
      description: `S${season.number}E${episode.number} - "${episode.titlePt || episode.title}" marcado como ${newStatus ? "assistido" : "não assistido"}.`,
    })
  }

  const showEpisodeInfo = (episode: Episode) => {
    setEpisodeInfo(episode)
    setEpisodeDialogOpen(true)
  }

  const calculateWatchProgress = () => {
    if (!series) return { totalEpisodes: 0, watchedEpisodes: 0, percentage: 0 }
    if (!series.seasons) return { totalEpisodes: 0, watchedEpisodes: 0, percentage: 0 }

    let totalEpisodes = 0
    let watchedEpisodes = 0

    series.seasons.forEach((season) => {
      season.episodes.forEach((episode) => {
        totalEpisodes++
        if (episode.watched) {
          watchedEpisodes++
        }
      })
    })

    return {
      totalEpisodes,
      watchedEpisodes,
      percentage: totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0,
    }
  }

  const calculateTotalWatchTime = () => {
    if (!series) return { total: 0, watched: 0, remaining: 0 }
    if (!series.seasons) return { total: 0, watched: 0, remaining: 0, totalHours: 0, watchedHours: 0, remainingHours: 0, totalDays: 0, watchedDays: 0, remainingDays: 0 }

    let totalMinutes = 0
    let watchedMinutes = 0

    series.seasons.forEach((season) => {
      season.episodes.forEach((episode) => {
        const duration = episode.duration || 0;
        totalMinutes += duration
        if (episode.watched) {
          watchedMinutes += duration
        }
      })
    })

    return {
      total: totalMinutes,
      watched: watchedMinutes,
      remaining: totalMinutes - watchedMinutes,
      totalHours: Math.round(totalMinutes / 60),
      watchedHours: Math.round(watchedMinutes / 60),
      remainingHours: Math.round((totalMinutes - watchedMinutes) / 60),
      totalDays: Math.round((totalMinutes / 60 / 8) * 10) / 10,
      watchedDays: Math.round((watchedMinutes / 60 / 8) * 10) / 10,
      remainingDays: Math.round(((totalMinutes - watchedMinutes) / 60 / 8) * 10) / 10,
    }
  }

  const updateSeriesFromImdb = async () => {
    if (!series) return

    const apiKey = localStorage.getItem("imdbApiKey")
    if (!apiKey) {
      toast({
        title: "Chave de API ausente",
        description: "Por favor, adicione sua chave de API do TMDb nas configurações primeiro.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingImdb(true)

    try {
      // Primeiro, pesquisa a série pelo título para obter o ID do TMDb
      const searchResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(series.title)}&language=pt-BR`,
      )
      
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json();
        throw new Error(errorData.status_message || `Erro ${searchResponse.status}`);
      }
      
      const searchData = await searchResponse.json()

      if (searchData.results && searchData.results.length > 0) {
        // Obter o ID do primeiro resultado
        const tmdbId = searchData.results[0].id
        const tmdbSeries = searchData.results[0];
        
        // Buscar dados detalhados da série
        const detailResponse = await fetch(
          `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=pt-BR&append_to_response=credits,content_ratings`
        )
        
        if (!detailResponse.ok) {
          const errorData = await detailResponse.json();
          throw new Error(errorData.status_message || `Erro ${detailResponse.status}`);
        }
        
        const data = await detailResponse.json()

        if (data.id) {
          // Atualizar série com dados do TMDb
          const storedSeries = localStorage.getItem("series")
          if (!storedSeries) return

          const allSeries = JSON.parse(storedSeries)
          const seriesCopy = { ...series }

          // Atualizar metadados da série
          if (data.poster_path) {
            seriesCopy.poster = `https://image.tmdb.org/t/p/w500${data.poster_path}`
          }
          
          // Atualizar IMDb ID se estiver disponível
          if (data.external_ids?.imdb_id) {
            seriesCopy.imdbId = data.external_ids.imdb_id;
          } else {
            seriesCopy.imdbId = `tmdb-${data.id}`;
          }
          
          // Se tiver temporadas disponíveis, atualizar informações das temporadas existentes
          if (data.seasons && data.seasons.length > 0 && seriesCopy.seasons) {
            // Para cada temporada na série atual
            seriesCopy.seasons = seriesCopy.seasons.map(existingSeason => {
              // Procurar a temporada correspondente no TMDb
              const tmdbSeason = data.seasons.find((s: any) => s.season_number === existingSeason.number);
              
              if (tmdbSeason) {
                return {
                  ...existingSeason,
                  totalEpisodes: tmdbSeason.episode_count,
                };
              }
              
              return existingSeason;
            });
          }

          // Atualizar a série no estado e no localStorage
          const updatedSeries = allSeries.map((s: Series) => (s.id === series.id ? seriesCopy : s))

          localStorage.setItem("series", JSON.stringify(updatedSeries))
          setSeries(seriesCopy)

          toast({
            title: "Série Atualizada",
            description: `Metadados para "${data.name}" foram atualizados do TMDb.`,
          })
        } else {
          toast({
            title: "Erro",
            description: `Falha ao buscar dados do TMDb: ${data.status_message || "Erro desconhecido"}`,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Série Não Encontrada",
          description: `Não foi possível encontrar "${series.title}" no TMDb.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: `Falha ao buscar dados do TMDb: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoadingImdb(false)
    }
  }

  const handleFileSelect = (filePath: string) => {
    toast({
      title: "File Selected",
      description: `Selected file: ${filePath}`,
    })

    // Here you would typically associate this file with an episode
    // For now, we'll just show a toast
  }

  if (!series) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Série não encontrada</h2>
          <p className="mt-2 text-gray-500">Não foi possível encontrar a série com o ID especificado.</p>
        </div>
      </div>
    )
  }

  const progress = calculateWatchProgress()
  const watchTime = calculateTotalWatchTime()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/series">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-blue-900">{series.title}</h1>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <div className="relative min-w-[200px] max-w-[300px] flex-shrink-0 overflow-hidden rounded-lg">
          {isLoadingImage ? (
            <div className="flex h-[450px] w-[300px] animate-pulse items-center justify-center bg-gray-200">
              <span className="text-sm text-gray-400">Carregando...</span>
            </div>
          ) : (
            <>
              <img 
                src={posterImage || '/placeholder.svg?height=450&width=300'} 
                alt={series.title} 
                className="h-auto w-full rounded-lg"
              />
              <div className="absolute right-2 top-2">
                <ImageUpload
                  mediaId={series.id}
                  mediaTitle={series.title}
                  type="poster"
                  currentImagePath={series.poster}
                  onImageSelected={updateSeriesPoster}
                  tmdbId={series.imdbId && series.imdbId.startsWith('tmdb-') 
                    ? series.imdbId.replace('tmdb-', '') 
                    : undefined}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <h3 className="mb-2 font-medium text-blue-900">Series Info</h3>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-blue-600">IMDb ID</div>
                <div className="flex items-center gap-2">
                  <span>{series.imdbId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-600"
                    onClick={updateSeriesFromImdb}
                    disabled={isLoadingImdb}
                  >
                    {isLoadingImdb ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    <span className="sr-only">Atualizar do IMDb</span>
                  </Button>
                </div>
              </div>

              <div>
                <div className="text-blue-600">Armazenamento</div>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: hd?.color || "#3B82F6" }} />
                  <span>{hd?.name || "HD Desconhecido"}</span>
                  <Badge variant={hd?.connected ? "default" : "destructive"} className="ml-1 text-[10px]">
                    {hd?.connected ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-blue-600">Watch Progress</div>
                <div className="mt-1">
                  <Progress value={progress.percentage} className="h-2 bg-blue-100" indicatorColor="bg-blue-600" />
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span>
                      {progress.watchedEpisodes} of {progress.totalEpisodes} episodes
                    </span>
                    <span>{progress.percentage}%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-blue-600">Total Watch Time</div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  <span>
                    {watchTime.totalHours} hours ({watchTime.totalDays} days)
                  </span>
                </div>
                <div className="mt-1 text-xs text-blue-600">
                  <div>
                    Watched: {watchTime.watchedHours} hours ({watchTime.watchedDays} days)
                  </div>
                  <div className="flex-col items-center text-center text-blue-700">
                    <Clock className="mb-1 h-5 w-5 mx-auto" />
                    <div className="text-lg font-medium">{watchTime.remainingHours}h</div>
                    <div className="text-sm">Restante</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-white p-4">
            <h3 className="mb-3 font-medium text-blue-900">Browse Files</h3>
            <FileBrowser hdId={series.hdId || ""} onFileSelect={handleFileSelect} showFolders={true} showFiles={true} />
          </div>

          <Tabs defaultValue="seasons" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="seasons">Temporadas</TabsTrigger>
              <TabsTrigger value="details">Details & Cast</TabsTrigger>
            </TabsList>

            <TabsContent value="seasons" className="mt-4">
              <div className="space-y-6">
                {series.seasons?.map((season, seasonIndex) => (
                  <div key={season.number} className="rounded-lg border border-blue-100 bg-white">
                    <div className="border-b border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-blue-900">Season {season.number}</h3>
                        <div className="text-sm text-blue-600">
                          {(season.availableEpisodes ?? 0) === (season.totalEpisodes ?? 0) ? (
                            <div className="flex items-center gap-1">
                              <Check className="h-4 w-4 text-green-600" />
                              <span>Complete ({season.totalEpisodes} episodes)</span>
                            </div>
                          ) : (
                            <span>
                              {season.availableEpisodes ?? 0} of {season.totalEpisodes ?? 0} episodes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-blue-50">
                      {season.episodes.map((episode, episodeIndex) => (
                        <div
                          key={`s${season.number}e${episode.number}`}
                          className={`flex items-center gap-3 p-3 ${episode.watched ? "bg-blue-50/50" : ""}`}
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                            {episode.number}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-blue-900">{episode.title}</div>
                            {episode.titlePt && <div className="text-sm text-blue-600">{episode.titlePt}</div>}
                            <div className="mt-1 text-xs text-blue-500">{episode.filename}</div>
                          </div>

                          <div className="flex items-center gap-1 text-sm text-blue-600">
                            <Clock className="h-4 w-4" />
                            <span>{episode.duration} min</span>
                          </div>

                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                              onClick={() => toggleEpisodeWatched(seasonIndex, episodeIndex)}
                            >
                              <Check className={`h-4 w-4 ${episode.watched ? "text-green-600" : ""}`} />
                              <span className="sr-only">Mark as {episode.watched ? "unwatched" : "watched"}</span>
                            </Button>

                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-700 hover:bg-blue-50">
                              <Play className="h-4 w-4" />
                              <span className="sr-only">Play</span>
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-700 hover:bg-blue-50"
                              onClick={() => showEpisodeInfo(episode)}
                            >
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Info</span>
                            </Button>
                          </div>
                        </div>
                      ))}

                      {(season.availableEpisodes ?? 0) < (season.totalEpisodes ?? 0) && (
                        <div className="p-3">
                          <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-3 text-center text-sm text-blue-600">
                            {(season.totalEpisodes ?? 0) - (season.availableEpisodes ?? 0)} episode(s) missing
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <div className="rounded-lg border border-blue-100 bg-white p-4">
                <h3 className="mb-3 font-medium text-blue-900">Series Details</h3>
                <p className="text-blue-700">
                  This section would contain additional details about the series, including:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-blue-600">
                  <li>Full synopsis</li>
                  <li>Cast and crew information</li>
                  <li>Release dates</li>
                  <li>Ratings and reviews</li>
                  <li>Awards and nominations</li>
                  <li>Production details</li>
                </ul>
                <p className="mt-4 text-sm text-blue-500">
                  This information would be fetched from IMDb or other sources when available.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={episodeDialogOpen} onOpenChange={setEpisodeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Episode Information</DialogTitle>
            <DialogDescription>Detailed information about this episode</DialogDescription>
          </DialogHeader>

          {episodeInfo && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-blue-900">{episodeInfo.title}</h3>
                {episodeInfo.titlePt && <p className="text-blue-600">{episodeInfo.titlePt}</p>}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-600">Duration:</span>
                  <span>{episodeInfo.duration} minutes</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-blue-600">Release Date:</span>
                  <span>{episodeInfo.releaseDate}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-blue-600">IMDb Rating:</span>
                  <span>{episodeInfo.imdbRating}/10</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-blue-600">Status:</span>
                  <Badge variant={episodeInfo.watched ? "default" : "outline"}>
                    {episodeInfo.watched ? "Assistido" : "Não Assistido"}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="mb-1 text-sm font-medium text-blue-900">Synopsis</h4>
                <p className="text-sm text-blue-700">{episodeInfo.synopsis}</p>
              </div>

              <div>
                <h4 className="mb-1 text-sm font-medium text-blue-900">File Information</h4>
                <div className="rounded-md bg-blue-50 p-2 text-xs font-mono text-blue-800">{episodeInfo.filename}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

