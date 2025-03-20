"use client"

import { useState, useEffect } from "react"
import { Folder, Search, RefreshCw, Film, Tv, Check, AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import type { HD, Series } from "@/lib/types"

interface MediaFile {
  path: string
  name: string
  type: "movie" | "series"
  seriesName?: string
  season?: number
  episode?: number
  year?: number
  selected: boolean
  metadata?: any
  posterPath?: string
}

export function MediaScanner() {
  const { toast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatus, setScanStatus] = useState("")
  const [rootDirectory, setRootDirectory] = useState<FileSystemDirectoryHandle | null>(null)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MediaFile[]>([])
  const [hds, setHds] = useState<HD[]>([])
  const [selectedHd, setSelectedHd] = useState<string>("")
  const [isFileSystemAccessSupported, setIsFileSystemAccessSupported] = useState(false)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  const [filter, setFilter] = useState<"all" | "movies" | "series">("all")
  const [selectAll, setSelectAll] = useState(true)
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "success" | "error">("idle")
  const [importProgress, setImportProgress] = useState(0)

  // Check if the File System Access API is supported
  useEffect(() => {
    setIsFileSystemAccessSupported(
      "showDirectoryPicker" in window ||
        (navigator.userAgent.includes("Chrome") && Number.parseInt(navigator.userAgent.split("Chrome/")[1]) >= 86),
    )

    // Load HD data
    const storedHds = localStorage.getItem("hds")
    if (storedHds) {
      const parsedHds = JSON.parse(storedHds)
      setHds(parsedHds)

      // Set the first connected HD as default
      const connectedHd = parsedHds.find((hd: HD) => hd.connected)
      if (connectedHd) {
        setSelectedHd(connectedHd.id)
      }
    }
  }, [])

  // Filter media files based on the selected filter
  useEffect(() => {
    if (filter === "all") {
      setFilteredFiles(mediaFiles)
    } else {
      setFilteredFiles(mediaFiles.filter((file) => file.type === filter))
    }
  }, [mediaFiles, filter])

  const selectDirectory = async () => {
    if (!isFileSystemAccessSupported) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support file system access. Try using Chrome or Edge.",
        variant: "destructive",
      })
      return
    }

    try {
      // @ts-ignore - TypeScript doesn't know about showDirectoryPicker yet
      const directoryHandle = await window.showDirectoryPicker()
      setRootDirectory(directoryHandle)

      toast({
        title: "Directory Selected",
        description: `Selected directory: ${directoryHandle.name}`,
      })
    } catch (error) {
      // User cancelled or browser doesn't support it
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: "Error",
          description: "Could not access file system: " + error.message,
          variant: "destructive",
        })
      }
    }
  }

  const scanDirectory = async () => {
    if (!rootDirectory) {
      toast({
        title: "No Directory",
        description: "Please select a directory first.",
        variant: "destructive",
      })
      return
    }

    if (!selectedHd) {
      toast({
        title: "No HD Selected",
        description: "Please select a HD to associate with the scanned media.",
        variant: "destructive",
      })
      return
    }

    setIsScanning(true)
    setScanProgress(0)
    setScanStatus("Initializing scan...")
    setMediaFiles([])

    try {
      const files: MediaFile[] = []
      await scanDirectoryRecursive(rootDirectory, files, "")

      // Process files to identify media
      setScanStatus("Processing files...")
      const processedFiles = processMediaFiles(files)
      setMediaFiles(processedFiles)

      // Set all files as selected by default
      toggleSelectAll(true)

      toast({
        title: "Scan Complete",
        description: `Found ${processedFiles.length} media files.`,
      })
    } catch (error) {
      toast({
        title: "Scan Error",
        description: `Error scanning directory: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
      setScanProgress(100)
      setScanStatus("Scan complete")
    }
  }

  const scanDirectoryRecursive = async (
    dirHandle: FileSystemDirectoryHandle,
    files: MediaFile[],
    currentPath: string,
    depth = 0,
  ) => {
    // Limit recursion depth to avoid infinite loops
    if (depth > 10) return

    try {
      let totalEntries = 0
      let processedEntries = 0

      // First count the total entries
      for await (const _ of dirHandle.values()) {
        totalEntries++
      }

      // Then process each entry
      for await (const entry of dirHandle.values()) {
        processedEntries++
        setScanProgress(Math.floor((processedEntries / totalEntries) * 100))

        const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name
        setScanStatus(`Scanning: ${entryPath}`)

        if (entry.kind === "directory") {
          await scanDirectoryRecursive(entry, files, entryPath, depth + 1)
        } else if (entry.kind === "file") {
          // Check if it's a media file
          const fileName = entry.name.toLowerCase()
          if (
            fileName.endsWith(".mp4") ||
            fileName.endsWith(".mkv") ||
            fileName.endsWith(".avi") ||
            fileName.endsWith(".mov") ||
            fileName.endsWith(".wmv")
          ) {
            files.push({
              path: entryPath,
              name: entry.name,
              type: "movie", // Default to movie, will be refined later
              selected: true,
            })
          }
        }
      }
    } catch (error) {
      console.error("Error scanning directory:", error)
    }
  }

  const processMediaFiles = (files: MediaFile[]): MediaFile[] => {
    return files.map((file) => {
      // Try to determine if it's a movie or series based on the file name and path
      const fileName = file.name.toLowerCase()
      const filePath = file.path.toLowerCase()

      // Common TV show patterns
      const seriesPatterns = [
        // S01E01 pattern
        { regex: /s(\d{1,2})e(\d{1,2})/i, seriesIndex: 0, seasonIndex: 1, episodeIndex: 2 },
        // 1x01 pattern
        { regex: /(\d{1,2})x(\d{1,2})/i, seriesIndex: 0, seasonIndex: 1, episodeIndex: 2 },
        // Season 1 Episode 1 pattern
        { regex: /season\s*(\d{1,2}).*episode\s*(\d{1,2})/i, seriesIndex: 0, seasonIndex: 1, episodeIndex: 2 },
        // Show.Name.S01E01 pattern
        { regex: /(.*?)[.\s-]+s(\d{1,2})e(\d{1,2})/i, seriesIndex: 1, seasonIndex: 2, episodeIndex: 3 },
      ]

      // Check for TV show patterns
      for (const pattern of seriesPatterns) {
        const match = fileName.match(pattern.regex) || filePath.match(pattern.regex)
        if (match) {
          // Extract series name from the path if not in the filename
          let seriesName = match[pattern.seriesIndex] || ""

          // If series name is empty, try to extract from the path
          if (!seriesName) {
            const pathParts = filePath.split("/")
            // Look for the series name in the path (usually the parent folder)
            if (pathParts.length > 1) {
              seriesName = pathParts[pathParts.length - 2]
            }
          }

          // Clean up series name
          seriesName = seriesName.replace(/\./g, " ").replace(/_/g, " ").replace(/-/g, " ").trim()

          return {
            ...file,
            type: "series",
            seriesName,
            season: Number.parseInt(match[pattern.seasonIndex]),
            episode: Number.parseInt(match[pattern.episodeIndex]),
          }
        }
      }

      // If no TV show pattern matched, it's probably a movie
      // Try to extract year from movie title
      const yearMatch = fileName.match(/$$(\d{4})$$/) || fileName.match(/[.\s](\d{4})[.\s]/)

      return {
        ...file,
        type: "movie",
        year: yearMatch ? Number.parseInt(yearMatch[1]) : undefined,
      }
    })
  }

  const fetchMetadata = async () => {
    if (mediaFiles.length === 0) {
      toast({
        title: "No Media Files",
        description: "Please scan a directory first.",
        variant: "destructive",
      })
      return
    }

    const apiKey = localStorage.getItem("imdbApiKey")
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please add your TMDb API key in the settings first.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingMetadata(true)

    try {
      // Group series files by series name
      const seriesGroups: { [key: string]: MediaFile[] } = {}
      const movieFiles: MediaFile[] = []

      mediaFiles.forEach((file) => {
        if (file.type === "series" && file.seriesName) {
          if (!seriesGroups[file.seriesName]) {
            seriesGroups[file.seriesName] = []
          }
          seriesGroups[file.seriesName].push(file)
        } else if (file.type === "movie") {
          movieFiles.push(file)
        }
      })

      // Process series first
      const seriesNames = Object.keys(seriesGroups)
      let processedCount = 0
      const totalToProcess = seriesNames.length + movieFiles.length

      // Fetch metadata for each series
      const updatedFiles = [...mediaFiles]

      // Process series
      for (const seriesName of seriesNames) {
        setScanStatus(`Fetching metadata for series: ${seriesName}`)
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(seriesName)}`,
          )
          const data = await response.json()

          if (data.results && data.results.length > 0) {
            const seriesMetadata = data.results[0]

            // Update all files for this series
            seriesGroups[seriesName].forEach((file) => {
              const fileIndex = updatedFiles.findIndex((f) => f.path === file.path)
              if (fileIndex !== -1) {
                updatedFiles[fileIndex] = {
                  ...updatedFiles[fileIndex],
                  metadata: seriesMetadata,
                  posterPath: seriesMetadata.poster_path
                    ? `https://image.tmdb.org/t/p/w500${seriesMetadata.poster_path}`
                    : undefined,
                }
              }
            })
          }
        } catch (error) {
          console.error(`Error fetching metadata for ${seriesName}:`, error)
        }

        processedCount++
        setScanProgress(Math.floor((processedCount / totalToProcess) * 100))
      }

      // Process movies
      for (const movieFile of movieFiles) {
        const searchQuery = movieFile.year
          ? `${movieFile.name.replace(/\.\w+$/, "")} ${movieFile.year}`
          : movieFile.name.replace(/\.\w+$/, "")

        setScanStatus(`Fetching metadata for movie: ${movieFile.name}`)

        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`,
          )
          const data = await response.json()

          if (data.results && data.results.length > 0) {
            const movieMetadata = data.results[0]

            const fileIndex = updatedFiles.findIndex((f) => f.path === movieFile.path)
            if (fileIndex !== -1) {
              updatedFiles[fileIndex] = {
                ...updatedFiles[fileIndex],
                metadata: movieMetadata,
                posterPath: movieMetadata.poster_path
                  ? `https://image.tmdb.org/t/p/w500${movieMetadata.poster_path}`
                  : undefined,
              }
            }
          }
        } catch (error) {
          console.error(`Error fetching metadata for ${movieFile.name}:`, error)
        }

        processedCount++
        setScanProgress(Math.floor((processedCount / totalToProcess) * 100))
      }

      setMediaFiles(updatedFiles)

      toast({
        title: "Metadata Fetched",
        description: "Successfully fetched metadata for your media files.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fetch metadata: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoadingMetadata(false)
      setScanProgress(100)
      setScanStatus("Metadata fetch complete")
    }
  }

  const toggleFileSelection = (path: string) => {
    setMediaFiles((prevFiles) =>
      prevFiles.map((file) => (file.path === path ? { ...file, selected: !file.selected } : file)),
    )
  }

  const toggleSelectAll = (value: boolean) => {
    setSelectAll(value)
    setMediaFiles((prevFiles) => prevFiles.map((file) => ({ ...file, selected: value })))
  }

  const importToLibrary = async () => {
    const selectedFiles = mediaFiles.filter((file) => file.selected)

    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to import.",
        variant: "destructive",
      })
      return
    }

    if (!selectedHd) {
      toast({
        title: "No HD Selected",
        description: "Please select a HD to associate with the imported media.",
        variant: "destructive",
      })
      return
    }

    setImportStatus("importing")
    setImportProgress(0)

    try {
      // Group series files by series name
      const seriesGroups: { [key: string]: MediaFile[] } = {}
      const movieFiles: MediaFile[] = []

      selectedFiles.forEach((file) => {
        if (file.type === "series" && file.seriesName) {
          if (!seriesGroups[file.seriesName]) {
            seriesGroups[file.seriesName] = []
          }
          seriesGroups[file.seriesName].push(file)
        } else if (file.type === "movie") {
          movieFiles.push(file)
        }
      })

      // Get existing series and movies from localStorage
      const storedSeries = localStorage.getItem("series")
      const allSeries = storedSeries ? JSON.parse(storedSeries) : []

      // Process series
      const seriesNames = Object.keys(seriesGroups)
      let processedCount = 0
      const totalToProcess = seriesNames.length + movieFiles.length

      // Import series
      for (const seriesName of seriesNames) {
        const seriesFiles = seriesGroups[seriesName]
        const firstFile = seriesFiles[0]

        // Check if series already exists
        const existingSeries = allSeries.find((s: Series) => s.title.toLowerCase() === seriesName.toLowerCase())

        if (!existingSeries) {
          // Create new series
          const newSeries: Series = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            title: seriesName,
            hdId: selectedHd,
            hidden: false,
            imdbId: firstFile.metadata?.id ? `tmdb-${firstFile.metadata.id}` : `unknown-${Date.now()}`,
            poster: firstFile.posterPath || "/placeholder.svg?height=450&width=300",
            seasons: [],
          }

          // Group episodes by season
          const seasonGroups: { [key: number]: MediaFile[] } = {}

          seriesFiles.forEach((file) => {
            if (file.season !== undefined) {
              if (!seasonGroups[file.season]) {
                seasonGroups[file.season] = []
              }
              seasonGroups[file.season].push(file)
            }
          })

          // Create seasons and episodes
          Object.keys(seasonGroups).forEach((seasonNum) => {
            const seasonNumber = Number.parseInt(seasonNum)
            const seasonFiles = seasonGroups[seasonNumber]

            const episodes = seasonFiles.map((file) => ({
              number: file.episode || 0,
              title: `Episode ${file.episode}`,
              titlePt: `Episódio ${file.episode}`,
              filename: file.name,
              duration: 45, // Default duration
              watched: false,
              synopsis: file.metadata?.overview || "No synopsis available",
              imdbRating: file.metadata?.vote_average || 0,
              releaseDate: file.metadata?.first_air_date || "Unknown",
            }))

            newSeries.seasons.push({
              number: seasonNumber,
              totalEpisodes: episodes.length,
              availableEpisodes: episodes.length,
              episodes,
            })
          })

          allSeries.push(newSeries)
        } else {
          // Update existing series
          if (firstFile.posterPath && !existingSeries.poster.includes("placeholder")) {
            existingSeries.poster = firstFile.posterPath
          }

          // Group episodes by season
          const seasonGroups: { [key: number]: MediaFile[] } = {}

          seriesFiles.forEach((file) => {
            if (file.season !== undefined) {
              if (!seasonGroups[file.season]) {
                seasonGroups[file.season] = []
              }
              seasonGroups[file.season].push(file)
            }
          })

          // Update or add seasons and episodes
          Object.keys(seasonGroups).forEach((seasonNum) => {
            const seasonNumber = Number.parseInt(seasonNum)
            const seasonFiles = seasonGroups[seasonNumber]

            // Check if season exists
            const existingSeason = existingSeries.seasons.find((s) => s.number === seasonNumber)

            if (!existingSeason) {
              // Create new season
              const episodes = seasonFiles.map((file) => ({
                number: file.episode || 0,
                title: `Episode ${file.episode}`,
                titlePt: `Episódio ${file.episode}`,
                filename: file.name,
                duration: 45, // Default duration
                watched: false,
                synopsis: file.metadata?.overview || "No synopsis available",
                imdbRating: file.metadata?.vote_average || 0,
                releaseDate: file.metadata?.first_air_date || "Unknown",
              }))

              existingSeries.seasons.push({
                number: seasonNumber,
                totalEpisodes: episodes.length,
                availableEpisodes: episodes.length,
                episodes,
              })
            } else {
              // Update existing season
              seasonFiles.forEach((file) => {
                if (file.episode !== undefined) {
                  // Check if episode exists
                  const existingEpisode = existingSeason.episodes.find((e) => e.number === file.episode)

                  if (!existingEpisode) {
                    // Add new episode
                    existingSeason.episodes.push({
                      number: file.episode,
                      title: `Episode ${file.episode}`,
                      titlePt: `Episódio ${file.episode}`,
                      filename: file.name,
                      duration: 45, // Default duration
                      watched: false,
                      synopsis: file.metadata?.overview || "No synopsis available",
                      imdbRating: file.metadata?.vote_average || 0,
                      releaseDate: file.metadata?.first_air_date || "Unknown",
                    })

                    existingSeason.availableEpisodes++
                    existingSeason.totalEpisodes = Math.max(
                      existingSeason.totalEpisodes,
                      existingSeason.availableEpisodes,
                    )
                  }
                }
              })
            }
          })
        }

        processedCount++
        setImportProgress(Math.floor((processedCount / totalToProcess) * 100))
      }

      // Save updated series to localStorage
      localStorage.setItem("series", JSON.stringify(allSeries))

      setImportStatus("success")

      toast({
        title: "Import Complete",
        description: `Successfully imported ${selectedFiles.length} media files.`,
      })

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (error) {
      setImportStatus("error")

      toast({
        title: "Import Error",
        description: `Failed to import media: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Scanner</CardTitle>
        <CardDescription>Automatically scan your hard drive for media files</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!isFileSystemAccessSupported && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Browser Not Supported</AlertTitle>
            <AlertDescription>
              Your browser doesn't support the File System Access API. Please use Chrome or Edge for this feature.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button onClick={selectDirectory} disabled={!isFileSystemAccessSupported || isScanning} className="flex-1">
              <Folder className="mr-2 h-4 w-4" />
              Select Directory
            </Button>

            <Button onClick={scanDirectory} disabled={!rootDirectory || isScanning} className="flex-1">
              <Search className="mr-2 h-4 w-4" />
              Scan for Media
            </Button>

            <Button onClick={fetchMetadata} disabled={mediaFiles.length === 0 || isLoadingMetadata} className="flex-1">
              {isLoadingMetadata ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Film className="mr-2 h-4 w-4" />
              )}
              Fetch Metadata
            </Button>
          </div>

          {(isScanning || isLoadingMetadata) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{scanStatus}</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" indicatorColor="bg-blue-600" />
            </div>
          )}

          {rootDirectory && (
            <div className="rounded-md bg-blue-50 p-3 text-sm">
              <div className="font-medium">Selected Directory:</div>
              <div className="text-blue-700">{rootDirectory.name}</div>
            </div>
          )}

          {mediaFiles.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selectAll"
                    checked={selectAll}
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                  />
                  <Label htmlFor="selectAll">Select All</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Label>HD:</Label>
                  <select
                    className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={selectedHd}
                    onChange={(e) => setSelectedHd(e.target.value)}
                  >
                    <option value="">Select HD</option>
                    {hds.map((hd) => (
                      <option key={hd.id} value={hd.id}>
                        {hd.name} {hd.connected ? "(Connected)" : "(Disconnected)"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All ({mediaFiles.length})</TabsTrigger>
                  <TabsTrigger value="movies">
                    Movies ({mediaFiles.filter((f) => f.type === "movie").length})
                  </TabsTrigger>
                  <TabsTrigger value="series">
                    Series ({mediaFiles.filter((f) => f.type === "series").length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <ScrollArea className="h-[300px] rounded-md border p-2">
                    <div className="space-y-2">
                      {filteredFiles.map((file) => (
                        <div key={file.path} className="flex items-center space-x-2 rounded-md p-2 hover:bg-blue-50">
                          <Checkbox checked={file.selected} onCheckedChange={() => toggleFileSelection(file.path)} />
                          <div className="flex-1">
                            <div className="flex items-center">
                              {file.type === "movie" ? (
                                <Film className="mr-2 h-4 w-4 text-blue-500" />
                              ) : (
                                <Tv className="mr-2 h-4 w-4 text-green-500" />
                              )}
                              <span className="font-medium">
                                {file.type === "series" ? (
                                  <>
                                    {file.seriesName} - S{file.season?.toString().padStart(2, "0")}E
                                    {file.episode?.toString().padStart(2, "0")}
                                  </>
                                ) : (
                                  file.name
                                )}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{file.path}</div>
                          </div>
                          {file.posterPath && (
                            <img
                              src={file.posterPath || "/placeholder.svg"}
                              alt="Poster"
                              className="h-12 w-8 rounded object-cover"
                            />
                          )}
                        </div>
                      ))}

                      {filteredFiles.length === 0 && (
                        <div className="flex h-20 items-center justify-center text-gray-500">
                          No media files found matching the current filter.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="movies" className="mt-4">
                  <ScrollArea className="h-[300px] rounded-md border p-2">
                    <div className="space-y-2">
                      {filteredFiles.map((file) => (
                        <div key={file.path} className="flex items-center space-x-2 rounded-md p-2 hover:bg-blue-50">
                          <Checkbox checked={file.selected} onCheckedChange={() => toggleFileSelection(file.path)} />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Film className="mr-2 h-4 w-4 text-blue-500" />
                              <span className="font-medium">{file.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">{file.path}</div>
                          </div>
                          {file.posterPath && (
                            <img
                              src={file.posterPath || "/placeholder.svg"}
                              alt="Poster"
                              className="h-12 w-8 rounded object-cover"
                            />
                          )}
                        </div>
                      ))}

                      {filteredFiles.length === 0 && (
                        <div className="flex h-20 items-center justify-center text-gray-500">No movie files found.</div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="series" className="mt-4">
                  <ScrollArea className="h-[300px] rounded-md border p-2">
                    <div className="space-y-2">
                      {filteredFiles.map((file) => (
                        <div key={file.path} className="flex items-center space-x-2 rounded-md p-2 hover:bg-blue-50">
                          <Checkbox checked={file.selected} onCheckedChange={() => toggleFileSelection(file.path)} />
                          <div className="flex-1">
                            <div className="flex items-center">
                              <Tv className="mr-2 h-4 w-4 text-green-500" />
                              <span className="font-medium">
                                {file.seriesName} - S{file.season?.toString().padStart(2, "0")}E
                                {file.episode?.toString().padStart(2, "0")}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">{file.path}</div>
                          </div>
                          {file.posterPath && (
                            <img
                              src={file.posterPath || "/placeholder.svg"}
                              alt="Poster"
                              className="h-12 w-8 rounded object-cover"
                            />
                          )}
                        </div>
                      ))}

                      {filteredFiles.length === 0 && (
                        <div className="flex h-20 items-center justify-center text-gray-500">
                          No series files found.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        {mediaFiles.length > 0 && (
          <>
            <div className="text-sm text-gray-500">
              {mediaFiles.filter((f) => f.selected).length} of {mediaFiles.length} files selected
            </div>

            <Button
              onClick={importToLibrary}
              disabled={
                mediaFiles.filter((f) => f.selected).length === 0 || !selectedHd || importStatus === "importing"
              }
            >
              {importStatus === "importing" ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Importing... ({importProgress}%)
                </>
              ) : importStatus === "success" ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Import Complete
                </>
              ) : importStatus === "error" ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Import Failed
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Import to Library
                </>
              )}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}

