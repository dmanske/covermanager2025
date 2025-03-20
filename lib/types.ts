export type HD = {
  id: string
  name: string
  label: string
  sizeGB: number
  usedGB: number
  path?: string
  connected: boolean
  lastConnected?: string
  totalSpace?: number
  freeSpace?: number
  color?: string
  additionDate?: string
  type?: 'interno' | 'externo'
  serialNumber?: string
  model?: string
  transferSpeed?: string
  group?: 'geral' | 'filmes' | 'series' | 'documentos' | 'backup'
}

export type Episode = {
  id: string
  title: string
  titlePt?: string
  season: number
  episode: number
  number?: number
  filename?: string
  duration?: number
  runtime?: string
  plot?: string
  synopsis?: string
  imdbID?: string
  imdbRating?: string | number
  released?: string
  releaseDate?: string
  watched: boolean
}

export type Season = {
  number: number
  episodes: Episode[]
  totalEpisodes?: number
  availableEpisodes?: number
}

export type Series = {
  id: string
  title: string
  year?: string
  creator?: string
  genre?: string
  genres?: string[]
  plot?: string
  poster?: string
  imdbID?: string
  imdbId?: string
  totalSeasons?: number
  rated?: string
  hdId?: string
  hdName?: string
  dirPath?: string
  watched?: boolean
  completed?: boolean
  hidden?: boolean
  rating?: number
  seasons?: Season[]
  addedAt: string
  notes?: string
}

export type Movie = {
  id: string
  title: string
  year?: string
  director?: string
  genre?: string
  genres?: string[]
  plot?: string
  poster?: string
  imdbID?: string
  imdbId?: string
  runtime?: string
  rated?: string
  hdId?: string
  hdName?: string
  filePath?: string
  path?: string
  format?: string
  resolution?: string
  duration?: string
  watched: boolean
  hidden?: boolean
  rating?: number
  addedAt: string
  addedDate?: string
  notes?: string
}

