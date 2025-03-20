"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Movie, Series, HD } from "@/lib/types"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

type StatsData = {
  totalMovies: number
  totalSeries: number
  totalEpisodes: number
  watchedMovies: number
  watchedSeries: number
  watchedEpisodes: number
  totalHDs: number
  connectedHDs: number
  hdUsage: {name: string, size: number, used: number}[]
  moviesByGenre: {name: string, value: number}[]
  seriesByGenre: {name: string, value: number}[]
  contentByHD: {name: string, movies: number, series: number}[]
  contentAddedByMonth: {month: string, movies: number, series: number}[]
}

export function Stats() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    calculateStats()
  }, [])

  const calculateStats = () => {
    setIsLoading(true)
    
    // Carregar dados do localStorage
    const movies = JSON.parse(localStorage.getItem("movies") || "[]") as Movie[]
    const series = JSON.parse(localStorage.getItem("series") || "[]") as Series[]
    const hds = JSON.parse(localStorage.getItem("hds") || "[]") as HD[]

    // Estatísticas gerais
    const totalMovies = movies.length
    const totalSeries = series.length
    
    // Calcular total de episódios nas séries
    const totalEpisodes = series.reduce((total, series) => {
      return total + (series.seasons?.reduce((seasonTotal, season) => {
        return seasonTotal + (season.episodes?.length || 0)
      }, 0) || 0)
    }, 0)
    
    // Assistidos
    const watchedMovies = movies.filter(movie => movie.watched).length
    const watchedSeries = series.filter(series => series.completed).length
    
    // Episódios assistidos
    const watchedEpisodes = series.reduce((total, series) => {
      return total + (series.seasons?.reduce((seasonTotal, season) => {
        return seasonTotal + (season.episodes?.filter(ep => ep.watched)?.length || 0)
      }, 0) || 0)
    }, 0)
    
    // Estatísticas de HD
    const totalHDs = hds.length
    const connectedHDs = hds.filter(hd => hd.connected).length
    
    // Uso dos HDs
    const hdUsage = hds.map(hd => ({
      name: hd.name,
      size: hd.sizeGB,
      used: hd.usedGB
    }))
    
    // Filmes por gênero
    const genreMovieMap = new Map<string, number>()
    movies.forEach(movie => {
      if (movie.genres) {
        movie.genres.forEach(genre => {
          genreMovieMap.set(genre, (genreMovieMap.get(genre) || 0) + 1)
        })
      }
    })
    
    const moviesByGenre = Array.from(genreMovieMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
    
    // Séries por gênero
    const genreSeriesMap = new Map<string, number>()
    series.forEach(series => {
      if (series.genres) {
        series.genres.forEach(genre => {
          genreSeriesMap.set(genre, (genreSeriesMap.get(genre) || 0) + 1)
        })
      }
    })
    
    const seriesByGenre = Array.from(genreSeriesMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
    
    // Conteúdo por HD
    const hdContentMap = new Map<string, {movies: number, series: number}>()
    hds.forEach(hd => {
      hdContentMap.set(hd.id, {movies: 0, series: 0})
    })
    
    movies.forEach(movie => {
      if (movie.hdId) {
        const current = hdContentMap.get(movie.hdId)
        if (current) {
          hdContentMap.set(movie.hdId, {
            ...current,
            movies: current.movies + 1
          })
        }
      }
    })
    
    series.forEach(series => {
      if (series.hdId) {
        const current = hdContentMap.get(series.hdId)
        if (current) {
          hdContentMap.set(series.hdId, {
            ...current,
            series: current.series + 1
          })
        }
      }
    })
    
    const contentByHD = Array.from(hdContentMap.entries())
      .map(([id, data]) => ({
        name: hds.find(hd => hd.id === id)?.name || id,
        ...data
      }))
    
    // Conteúdo adicionado por mês
    const last6Months: { month: string, movies: number, series: number }[] = []
    const today = new Date()
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      
      last6Months.push({
        month: monthName,
        movies: 0,
        series: 0
      })
    }
    
    // Inverter para ordem cronológica
    last6Months.reverse()
    
    movies.forEach(movie => {
      if (movie.addedAt) {
        const addedDate = new Date(movie.addedAt)
        const monthYear = addedDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        
        const monthEntry = last6Months.find(m => m.month === monthYear)
        if (monthEntry) {
          monthEntry.movies++
        }
      }
    })
    
    series.forEach(series => {
      if (series.addedAt) {
        const addedDate = new Date(series.addedAt)
        const monthYear = addedDate.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        
        const monthEntry = last6Months.find(m => m.month === monthYear)
        if (monthEntry) {
          monthEntry.series++
        }
      }
    })
    
    setStats({
      totalMovies,
      totalSeries,
      totalEpisodes,
      watchedMovies,
      watchedSeries,
      watchedEpisodes,
      totalHDs,
      connectedHDs,
      hdUsage,
      moviesByGenre,
      seriesByGenre,
      contentByHD,
      contentAddedByMonth: last6Months
    })
    
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loader"></div>
      </div>
    )
  }

  const renderPieChart = (data: { name: string, value: number }[], title: string) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${value} itens`, '']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Estatísticas</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Filmes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMovies || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.watchedMovies || 0} assistidos ({stats && stats.totalMovies > 0 
                ? Math.round((stats.watchedMovies / stats.totalMovies) * 100) 
                : 0}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Séries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSeries || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.watchedSeries || 0} completas ({stats && stats.totalSeries > 0 
                ? Math.round((stats.watchedSeries / stats.totalSeries) * 100) 
                : 0}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Episódios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEpisodes || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.watchedEpisodes || 0} assistidos ({stats && stats.totalEpisodes > 0 
                ? Math.round((stats.watchedEpisodes / stats.totalEpisodes) * 100) 
                : 0}%)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">HDs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHDs || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.connectedHDs || 0} conectados ({stats && stats.totalHDs > 0 
                ? Math.round((stats.connectedHDs / stats.totalHDs) * 100) 
                : 0}%)
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="movies">
        <TabsList>
          <TabsTrigger value="movies">Filmes</TabsTrigger>
          <TabsTrigger value="series">Séries</TabsTrigger>
          <TabsTrigger value="storage">Armazenamento</TabsTrigger>
          <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="movies" className="pt-4">
          {stats?.moviesByGenre && stats.moviesByGenre.length > 0 ? (
            renderPieChart(stats.moviesByGenre, "Filmes por Gênero")
          ) : (
            <div className="text-center p-6 bg-muted/40 rounded-lg">
              <p>Sem dados de gênero disponíveis para filmes</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="series" className="pt-4">
          {stats?.seriesByGenre && stats.seriesByGenre.length > 0 ? (
            renderPieChart(stats.seriesByGenre, "Séries por Gênero")
          ) : (
            <div className="text-center p-6 bg-muted/40 rounded-lg">
              <p>Sem dados de gênero disponíveis para séries</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="storage" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Uso dos HDs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.hdUsage || []}>
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'GB', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${value} GB`, '']} />
                  <Legend />
                  <Bar dataKey="used" fill="#8884d8" name="Usado" />
                  <Bar dataKey="size" fill="#82ca9d" name="Capacidade Total" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="h-6" />
          
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo por HD</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.contentByHD || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="movies" fill="#0088FE" name="Filmes" />
                  <Bar dataKey="series" fill="#00C49F" name="Séries" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo Adicionado por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.contentAddedByMonth || []}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="movies" fill="#0088FE" name="Filmes" />
                  <Bar dataKey="series" fill="#00C49F" name="Séries" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 