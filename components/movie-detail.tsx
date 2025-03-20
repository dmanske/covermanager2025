"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Trash2 } from "lucide-react"
import { badgeVariants } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { HD, Movie } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ImageUpload } from "@/components/image-upload"
import { downloadAndStoreImage, getImageUrl } from "@/lib/image-service"

export function MovieDetail({ movieId }: { movieId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [hd, setHd] = useState<HD | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [posterImage, setPosterImage] = useState<string | null>(null)
  const [isLoadingImage, setIsLoadingImage] = useState(true)

  useEffect(() => {
    loadMovieData()
  }, [movieId])

  const loadMovieData = () => {
    // Load movie data from localStorage
    const storedMovies = localStorage.getItem("movies")
    const storedHds = localStorage.getItem("hds")

    if (!storedMovies || !storedHds) return

    const allMovies = JSON.parse(storedMovies)
    const allHds = JSON.parse(storedHds)

    const currentMovie = allMovies.find((m: Movie) => m.id === movieId)
    if (!currentMovie) return

    setMovie(currentMovie)
    loadMovieImage(currentMovie)

    // Get associated HD
    const associatedHd = allHds.find((h: HD) => h.id === currentMovie.hdId)
    setHd(associatedHd || null)
  }
  
  // Função para carregar a imagem do filme
  const loadMovieImage = async (currentMovie: Movie) => {
    setIsLoadingImage(true);
    try {
      if (currentMovie.poster) {
        // Se for uma URL completa ou um caminho para placeholder, usar diretamente
        if (currentMovie.poster.startsWith('http') || currentMovie.poster.startsWith('/')) {
          setPosterImage(currentMovie.poster);
        } else {
          // Se for um ID de imagem local, buscar do banco
          try {
            // Tentar obter a imagem local ou do TMDb
            let posterPath: string | undefined;
            if (currentMovie.imdbId && currentMovie.imdbId.startsWith('tmdb-')) {
              // Extrair o ID do TMDb
              posterPath = currentMovie.poster.includes('/') ? currentMovie.poster : undefined;
            }
            
            const imgResult = await getImageUrl(currentMovie.id, 'poster', posterPath);
            setPosterImage(imgResult.url);
            
            // Se a imagem não for local e for do TMDb, fazer download para armazenar localmente
            if (!imgResult.isLocal && posterPath && posterPath.startsWith('/')) {
              // Download assíncrono para não bloquear a interface
              downloadAndStoreImage(posterPath, currentMovie.id, 'poster').catch(e => 
                console.error(`Erro ao baixar imagem para ${currentMovie.title}:`, e)
              );
            }
          } catch (error) {
            console.error(`Erro ao carregar imagem para ${currentMovie.title}:`, error);
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

  // Função para atualizar o poster do filme
  const updateMoviePoster = (posterUrl: string) => {
    if (!movie) return;
    
    const updatedMovie = { ...movie, poster: posterUrl };
    
    // Atualizar no estado local
    setMovie(updatedMovie);
    setPosterImage(posterUrl);
    
    // Atualizar no localStorage
    const storedMovies = localStorage.getItem("movies");
    if (storedMovies) {
      const allMovies = JSON.parse(storedMovies);
      const updatedAllMovies = allMovies.map((m: Movie) => 
        m.id === movie.id ? updatedMovie : m
      );
      localStorage.setItem("movies", JSON.stringify(updatedAllMovies));
      
      toast({
        title: "Capa Atualizada",
        description: "A capa do filme foi atualizada com sucesso.",
      });
    }
  };

  const toggleMovieVisibility = () => {
    if (!movie) return

    const updatedMovie = { ...movie, hidden: !movie.hidden }
    setMovie(updatedMovie)

    // Update in localStorage
    const storedMovies = localStorage.getItem("movies")
    if (storedMovies) {
      const allMovies = JSON.parse(storedMovies)
      const updatedAllMovies = allMovies.map((m: Movie) => (m.id === movieId ? updatedMovie : m))
      localStorage.setItem("movies", JSON.stringify(updatedAllMovies))

      toast({
        title: updatedMovie.hidden ? "Filme oculto" : "Filme visível",
        description: updatedMovie.hidden
          ? "O filme foi removido da visualização principal."
          : "O filme agora está visível na biblioteca.",
      })
    }
  }

  const deleteMovie = () => {
    if (!movie) return

    // Remove from localStorage
    const storedMovies = localStorage.getItem("movies")
    if (storedMovies) {
      const allMovies = JSON.parse(storedMovies)
      const updatedAllMovies = allMovies.filter((m: Movie) => m.id !== movieId)
      localStorage.setItem("movies", JSON.stringify(updatedAllMovies))

      toast({
        title: "Filme excluído",
        description: "O filme foi removido permanentemente da biblioteca.",
      })

      router.push("/movies")
    }
  }

  if (!movie) {
    return (
      <div className="flex h-60 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Filme não encontrado</h2>
          <p className="mt-2 text-gray-500">Não foi possível encontrar o filme com o ID especificado.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
                alt={movie.title} 
                className="h-auto w-full rounded-lg"
              />
              <div className="absolute right-2 top-2">
                <ImageUpload
                  mediaId={movie.id}
                  mediaTitle={movie.title}
                  type="poster"
                  currentImagePath={movie.poster}
                  onImageSelected={updateMoviePoster}
                  tmdbId={movie.imdbId && movie.imdbId.startsWith('tmdb-') 
                    ? movie.imdbId.replace('tmdb-', '') 
                    : undefined}
                />
              </div>
              
              <div className="absolute bottom-2 right-2 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/50 text-white hover:bg-black/70"
                  onClick={toggleMovieVisibility}
                >
                  {movie.hidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
                  {movie.hidden ? "Mostrar" : "Ocultar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-red-500/50 text-white hover:bg-red-500/70"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </>
          )}
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{movie.title}</h1>
            <div className="flex flex-wrap gap-2">
              {movie.year && (
                <span className={cn(badgeVariants({ variant: "outline" }), "bg-gray-100")}>
                  {movie.year}
                </span>
              )}
              {movie.genre && (
                <span className={cn(badgeVariants({ variant: "outline" }), "bg-blue-100")}>
                  {movie.genre}
                </span>
              )}
              {movie.watched && (
                <span className={cn(badgeVariants({ variant: "outline" }), "bg-green-100")}>
                  Assistido
                </span>
              )}
            </div>
          </div>

          {movie.plot && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-medium">Sinopse</h3>
              <p className="text-sm text-gray-700">{movie.plot}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-medium">Informações do Arquivo</h3>
              <dl className="space-y-2 text-sm">
                <div className="grid grid-cols-2">
                  <dt className="text-gray-500">Formato:</dt>
                  <dd>{movie.format || "Desconhecido"}</dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-gray-500">Resolução:</dt>
                  <dd>{movie.resolution || "Desconhecido"}</dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-gray-500">Duração:</dt>
                  <dd>{movie.duration || "Desconhecido"}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 font-medium">Armazenamento</h3>
              <dl className="space-y-2 text-sm">
                <div className="grid grid-cols-2">
                  <dt className="text-gray-500">HD:</dt>
                  <dd>{hd?.name || "Desconhecido"}</dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-gray-500">Caminho:</dt>
                  <dd className="break-all">{movie.path || "Desconhecido"}</dd>
                </div>
                <div className="grid grid-cols-2">
                  <dt className="text-gray-500">Status:</dt>
                  <dd>
                    {hd?.connected ? (
                      <span className="text-green-600">Disponível</span>
                    ) : (
                      <span className="text-red-600">Indisponível</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir filme?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente <strong>{movie.title}</strong> da sua biblioteca. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteMovie} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 