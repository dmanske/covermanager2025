"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import type { HD, Movie } from "@/lib/types"
import { FilmIcon, MoreVertical, Eye, EyeOff } from "lucide-react"
import { downloadAndStoreImage, getImageUrl } from "@/lib/image-service"

export function MoviesLibrary() {
  const { toast } = useToast()
  const [movies, setMovies] = useState<Movie[]>([])
  const [hds, setHds] = useState<HD[]>([])
  const [visibleMovies, setVisibleMovies] = useState<Movie[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<"title_asc" | "title_desc" | "year_asc" | "year_desc">(
    "title_asc"
  )
  const [genreFilter, setGenreFilter] = useState<string>("all")
  const [yearFilter, setYearFilter] = useState<string>("all")
  const [hdFilter, setHdFilter] = useState<string>("all")
  const [showHidden, setShowHidden] = useState(false)
  const ITEMS_PER_PAGE = 24
  const [genres, setGenres] = useState<string[]>([])
  const [years, setYears] = useState<string[]>([])
  
  // Adicionando estado para gerenciar as imagens dos filmes
  const [movieImages, setMovieImages] = useState<Record<string, string>>({})
  const [isLoadingImages, setIsLoadingImages] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [movies, searchQuery, sortOrder, genreFilter, yearFilter, hdFilter, showHidden])

  useEffect(() => {
    calculatePagination()
  }, [visibleMovies])

  const loadData = () => {
    // Load data from localStorage
    const storedMovies = localStorage.getItem("movies")
    const storedHds = localStorage.getItem("hds")

    if (storedMovies) {
      const parsedMovies = JSON.parse(storedMovies)
      setMovies(parsedMovies)
      
      // Extract unique genres and years
      const genres = new Set<string>()
      const years = new Set<string>()
      
      parsedMovies.forEach((movie: Movie) => {
        if (movie.genre) genres.add(movie.genre)
        if (movie.year) years.add(movie.year)
      })
      
      setGenres(Array.from(genres) as string[])
      setYears(Array.from(years) as string[])
      
      // Load movie images
      loadMovieImages(parsedMovies)
    } else {
      // Se não houver filmes, adicionar exemplos
      const exampleMovies = [
        {
          id: "1",
          title: "Interestelar",
          year: "2014",
          director: "Christopher Nolan",
          genre: "Ficção Científica",
          genres: ["Ficção Científica", "Drama", "Aventura"],
          plot: "Um grupo de astronautas embarca em uma viagem interestelar através de um buraco de minhoca recentemente descoberto.",
          poster: "/placeholder.svg?height=450&width=300",
          imdbID: "tt0816692",
          runtime: "169 min",
          rated: "PG-13",
          hdId: "1",
          hdName: "HD Principal",
          filePath: "D:/Media/Movies/Interstellar (2014)/Interstellar.2014.1080p.BluRay.x264.mkv",
          watched: true,
          rating: 5,
          addedAt: new Date().toISOString(),
        },
        {
          id: "2",
          title: "A Origem",
          year: "2010",
          director: "Christopher Nolan",
          genre: "Ficção Científica",
          genres: ["Ficção Científica", "Ação", "Aventura"],
          plot: "Um ladrão que rouba segredos corporativos através do uso da tecnologia de compartilhamento de sonhos.",
          poster: "/placeholder.svg?height=450&width=300",
          imdbID: "tt1375666",
          runtime: "148 min",
          rated: "PG-13",
          hdId: "1",
          hdName: "HD Principal",
          filePath: "D:/Media/Movies/Inception (2010)/Inception.2010.1080p.BluRay.x264.mkv",
          watched: true,
          rating: 5,
          addedAt: new Date().toISOString(),
        },
        {
          id: "3",
          title: "Coringa",
          year: "2019",
          director: "Todd Phillips",
          genre: "Drama",
          genres: ["Drama", "Crime", "Thriller"],
          plot: "Em Gotham City, o comediante Arthur Fleck, um homem com problemas mentais, é desprezado pela sociedade.",
          poster: "/placeholder.svg?height=450&width=300",
          imdbID: "tt7286456",
          runtime: "122 min",
          rated: "R",
          hdId: "2",
          hdName: "Backup HD",
          filePath: "E:/Backup/Movies/Joker (2019)/Joker.2019.1080p.BluRay.x264.mkv",
          watched: false,
          rating: 0,
          addedAt: new Date().toISOString(),
        },
        {
          id: "4",
          title: "O Poderoso Chefão",
          year: "1972",
          director: "Francis Ford Coppola",
          genre: "Crime",
          genres: ["Crime", "Drama"],
          plot: "A família Corleone, sob o comando de Vito Corleone, luta para estabelecer seu domínio nos Estados Unidos no pós-guerra.",
          poster: "/placeholder.svg?height=450&width=300",
          imdbID: "tt0068646",
          runtime: "175 min",
          rated: "R",
          hdId: "1",
          hdName: "HD Principal",
          filePath: "D:/Media/Movies/The Godfather (1972)/The.Godfather.1972.1080p.BluRay.x264.mkv",
          watched: true,
          rating: 5,
          addedAt: new Date().toISOString(),
        },
        {
          id: "5",
          title: "Pulp Fiction: Tempo de Violência",
          year: "1994",
          director: "Quentin Tarantino",
          genre: "Crime",
          genres: ["Crime", "Drama"],
          plot: "As vidas de dois assassinos da máfia, um boxeador, um gângster e sua esposa, e um par de bandidos se entrelaçam em quatro histórias de violência e redenção.",
          poster: "/placeholder.svg?height=450&width=300",
          imdbID: "tt0110912",
          runtime: "154 min",
          rated: "R",
          hdId: "1",
          hdName: "HD Principal",
          filePath: "D:/Media/Movies/Pulp Fiction (1994)/Pulp.Fiction.1994.1080p.BluRay.x264.mkv",
          watched: false,
          rating: 0,
          addedAt: new Date().toISOString(),
        },
      ];
      
      // Extract unique genres and years from example movies
      const genres = new Set<string>();
      const years = new Set<string>();
      
      exampleMovies.forEach((movie) => {
        if (movie.genre) genres.add(movie.genre);
        if (movie.year) years.add(movie.year);
      });
      
      setGenres(Array.from(genres) as string[])
      setYears(Array.from(years) as string[])
      
      // Salvar dados de exemplo no localStorage
      localStorage.setItem("movies", JSON.stringify(exampleMovies));
      setMovies(exampleMovies);
      
      // Carregar imagens dos filmes de exemplo
      loadMovieImages(exampleMovies);
      
      toast({
        title: "Filmes de exemplo adicionados",
        description: "Adicionamos alguns filmes de exemplo para você começar",
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
  }
  
  // Função para carregar as imagens dos filmes
  const loadMovieImages = async (moviesList: Movie[]) => {
    setIsLoadingImages(true)
    const images: Record<string, string> = {}
    
    try {
      // Processamos em lotes para não sobrecarregar a aplicação
      const batchSize = 5
      for (let i = 0; i < moviesList.length; i += batchSize) {
        const batch = moviesList.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async (movie) => {
            try {
              if (movie.poster) {
                // Se for uma URL completa ou um caminho para placeholder, usar diretamente
                if (movie.poster.startsWith('http') || movie.poster.startsWith('/')) {
                  images[movie.id] = movie.poster
                } else {
                  // Se for um ID de imagem local, buscar do banco
                  try {
                    // Tentar obter a imagem local ou do TMDb
                    let posterPath: string | undefined
                    if (movie.imdbId && movie.imdbId.startsWith('tmdb-')) {
                      // Extrair o ID do TMDb
                      posterPath = movie.poster.includes('/') ? movie.poster : undefined
                    }
                    
                    const imgResult = await getImageUrl(movie.id, 'poster', posterPath)
                    images[movie.id] = imgResult.url
                    
                    // Se a imagem não for local e for do TMDb, fazer download para armazenar localmente
                    if (!imgResult.isLocal && posterPath && posterPath.startsWith('/')) {
                      // Download assíncrono para não bloquear a interface
                      downloadAndStoreImage(posterPath, movie.id, 'poster').catch(e => 
                        console.error(`Erro ao baixar imagem para ${movie.title}:`, e)
                      )
                    }
                  } catch (error) {
                    console.error(`Erro ao carregar imagem para ${movie.title}:`, error)
                    images[movie.id] = '/placeholder.svg?height=450&width=300'
                  }
                }
              } else {
                // Se não tiver poster, usar placeholder
                images[movie.id] = '/placeholder.svg?height=450&width=300'
              }
            } catch (error) {
              console.error(`Erro ao processar imagem para ${movie.title}:`, error)
              images[movie.id] = '/placeholder.svg?height=450&width=300'
            }
          })
        )
      }
      
      setMovieImages(images)
    } catch (error) {
      console.error('Erro ao carregar imagens:', error)
    } finally {
      setIsLoadingImages(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...movies]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((movie) => movie.title.toLowerCase().includes(query))
    }

    // Apply genre filter
    if (genreFilter !== "all") {
      filtered = filtered.filter((movie) => movie.genre === genreFilter)
    }

    // Apply year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter((movie) => movie.year === yearFilter)
    }

    // Apply HD filter
    if (hdFilter !== "all") {
      if (hdFilter === "connected") {
        const connectedHdIds = hds.filter((hd) => hd.connected).map((hd) => hd.id)
        filtered = filtered.filter((movie) => movie.hdId && connectedHdIds.includes(movie.hdId))
      } else if (hdFilter === "disconnected") {
        const disconnectedHdIds = hds.filter((hd) => !hd.connected).map((hd) => hd.id)
        filtered = filtered.filter((movie) => movie.hdId && disconnectedHdIds.includes(movie.hdId))
      } else {
        filtered = filtered.filter((movie) => movie.hdId === hdFilter)
      }
    }

    // Apply visibility filter
    if (!showHidden) {
      filtered = filtered.filter((movie) => !movie.hidden)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOrder) {
        case "title_asc":
          return a.title.localeCompare(b.title)
        case "title_desc":
          return b.title.localeCompare(a.title)
        case "year_asc":
          return (a.year || "0").localeCompare(b.year || "0")
        case "year_desc":
          return (b.year || "0").localeCompare(a.year || "0")
        default:
          return 0
      }
    })

    setVisibleMovies(filtered)
    setCurrentPage(1)
  }

  const calculatePagination = () => {
    const pages = Math.ceil(visibleMovies.length / ITEMS_PER_PAGE)
    setTotalPages(pages || 1)
  }

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return visibleMovies.slice(startIndex, endIndex)
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }
  
  const toggleMovieVisibility = (movieId: string) => {
    const updatedMovies = movies.map((movie) => {
      if (movie.id === movieId) {
        return { ...movie, hidden: !movie.hidden }
      }
      return movie
    })
    
    setMovies(updatedMovies)
    
    // Update in localStorage
    localStorage.setItem("movies", JSON.stringify(updatedMovies))
    
    // Find the updated movie
    const updatedMovie = updatedMovies.find((m) => m.id === movieId)
    if (updatedMovie) {
      toast({
        title: updatedMovie.hidden ? "Filme oculto" : "Filme visível",
        description: updatedMovie.hidden 
          ? "O filme foi removido da visualização principal."
          : "O filme agora está visível na biblioteca.",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl font-bold">Biblioteca de Filmes</h1>
          <div className="text-sm text-gray-500">
            {movies.length} filmes, {visibleMovies.length} exibidos
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/movies/add">Adicionar Filme</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/scan">Procurar Filmes</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="search" className="mb-2 block text-sm font-medium">
              Buscar
            </label>
            <Input
              id="search"
              placeholder="Digite para buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="genre" className="mb-2 block text-sm font-medium">
              Gênero
            </label>
            <Select
              value={genreFilter}
              onValueChange={(value) => setGenreFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os gêneros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os gêneros</SelectItem>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="year" className="mb-2 block text-sm font-medium">
              Ano
            </label>
            <Select
              value={yearFilter}
              onValueChange={(value) => setYearFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="hd" className="mb-2 block text-sm font-medium">
              HD
            </label>
            <Select
              value={hdFilter}
              onValueChange={(value) => setHdFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os HDs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os HDs</SelectItem>
                <SelectItem value="connected">HDs Conectados</SelectItem>
                <SelectItem value="disconnected">HDs Desconectados</SelectItem>
                {hds.map((hd) => (
                  <SelectItem key={hd.id} value={hd.id}>
                    {hd.name} {hd.connected ? "(Conectado)" : "(Desconectado)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 md:flex md:items-center">
          <div>
            <label htmlFor="sort" className="mb-2 block text-sm font-medium">
              Ordenar por
            </label>
            <Select
              value={sortOrder}
              onValueChange={(value: any) => setSortOrder(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Título (A-Z)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title_asc">Título (A-Z)</SelectItem>
                <SelectItem value="title_desc">Título (Z-A)</SelectItem>
                <SelectItem value="year_asc">Ano (Crescente)</SelectItem>
                <SelectItem value="year_desc">Ano (Decrescente)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="showHidden"
              checked={showHidden}
              onCheckedChange={setShowHidden}
            />
            <label htmlFor="showHidden" className="text-sm font-medium">
              Mostrar itens ocultos
            </label>
          </div>
        </div>
      </div>

      {isLoadingImages && visibleMovies.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="flex h-64 animate-pulse flex-col items-center justify-center rounded-lg bg-gray-200"
            >
              <FilmIcon className="h-8 w-8 text-gray-400" />
              <div className="mt-2 h-4 w-24 rounded bg-gray-300"></div>
            </div>
          ))}
        </div>
      ) : visibleMovies.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {getCurrentPageItems().map((movie) => (
              <Card key={movie.id} className={movie.hidden ? "opacity-60" : ""}>
                <Link href={`/movies/${movie.id}`}>
                  <div className="group relative aspect-[2/3] w-full overflow-hidden rounded-t-lg">
                    <img
                      src={movieImages[movie.id] || "/placeholder.svg?height=450&width=300"}
                      alt={movie.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {movie.watched && (
                      <div className="absolute right-2 top-2 rounded-full bg-green-500 p-1">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </Link>
                <CardContent className="p-2">
                  <div className="flex items-start justify-between space-x-2">
                    <Link href={`/movies/${movie.id}`} className="group-hover:underline">
                      <h3
                        className="line-clamp-2 text-sm font-medium"
                        title={movie.title}
                      >
                        {movie.title}
                      </h3>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Opções</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/movies/${movie.id}`}>Detalhes</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleMovieVisibility(movie.id)}>
                          {movie.hidden ? (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Mostrar filme
                            </>
                          ) : (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Ocultar filme
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    {movie.year && <span className="mr-2">{movie.year}</span>}
                    {movie.genre && <span>{movie.genre}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination className="mt-8">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => goToPage(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
                {Array.from({ length: totalPages })
                  .fill(0)
                  .map((_, i) => {
                    const page = i + 1
                    // Show current page, first, last, and neighboring pages
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => goToPage(page)}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    }
                    // Show ellipsis for gaps, but only once per gap
                    if (
                      (page === 2 && currentPage > 3) ||
                      (page === totalPages - 1 && currentPage < totalPages - 2)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <span className="flex h-9 w-9 items-center justify-center">
                            ...
                          </span>
                        </PaginationItem>
                      )
                    }
                    return null
                  })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => goToPage(currentPage + 1)}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 p-8 text-center">
          <FilmIcon className="h-10 w-10 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">Nenhum filme encontrado</h3>
          <p className="mt-1 text-sm text-gray-500">
            Adicione filmes à sua biblioteca ou ajuste os filtros de busca.
          </p>
          <Button className="mt-4" asChild>
            <Link href="/movies/add">Adicionar Filme</Link>
          </Button>
        </div>
      )}
    </div>
  )
} 