"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { HardDrive, Tv, Eye, EyeOff, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { HD, Series } from "@/lib/types"

export function Dashboard() {
  const [hds, setHds] = useState<HD[]>([])
  const [series, setSeries] = useState<Series[]>([])
  const [totalWatchTime, setTotalWatchTime] = useState(0)
  const [watchedTime, setWatchedTime] = useState(0)

  useEffect(() => {
    // Load data from localStorage
    const storedHds = localStorage.getItem("hds")
    const storedSeries = localStorage.getItem("series")

    if (storedHds) {
      setHds(JSON.parse(storedHds))
    }

    if (storedSeries) {
      const parsedSeries = JSON.parse(storedSeries)
      setSeries(parsedSeries)

      // Calculate watch times
      let total = 0
      let watched = 0

      parsedSeries.forEach((series: Series) => {
        series.seasons.forEach((season) => {
          season.episodes.forEach((episode) => {
            total += episode.duration
            if (episode.watched) {
              watched += episode.duration
            }
          })
        })
      })

      setTotalWatchTime(total)
      setWatchedTime(watched)
    }
  }, [])

  const connectedHds = hds.filter((hd) => hd.connected)
  const totalSpace = connectedHds.reduce((acc, hd) => acc + hd.totalSpace, 0)
  const usedSpace = connectedHds.reduce((acc, hd) => acc + (hd.totalSpace - hd.freeSpace), 0)
  const freeSpacePercentage = totalSpace > 0 ? Math.round((1 - usedSpace / totalSpace) * 100) : 0

  const visibleSeries = series.filter((s) => !s.hidden)
  const hiddenSeries = series.filter((s) => s.hidden)

  // Convert minutes to hours and days
  const totalHours = Math.round(totalWatchTime / 60)
  const watchedHours = Math.round(watchedTime / 60)
  const totalDays = Math.round((totalHours / 8) * 10) / 10
  const watchedDays = Math.round((watchedHours / 8) * 10) / 10

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>
        <p className="text-blue-700">Overview of your media collection</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Series</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{series.length}</div>
              <Tv className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-xs text-blue-600">
              <Eye className="mr-1 h-4 w-4" />
              <span>{visibleSeries.length} visible</span>
              <EyeOff className="ml-3 mr-1 h-4 w-4" />
              <span>{hiddenSeries.length} hidden</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{freeSpacePercentage}% Free</div>
              <HardDrive className="h-6 w-6 text-blue-600" />
            </div>
            <Progress value={freeSpacePercentage} className="mt-2 h-2 bg-blue-200" indicatorColor="bg-blue-600" />
            <div className="mt-2 text-xs text-blue-600">
              {(totalSpace / 1000000000000).toFixed(1)} TB Total / {(usedSpace / 1000000000000).toFixed(1)} TB Used
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Watch Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {totalWatchTime > 0 ? Math.round((watchedTime / totalWatchTime) * 100) : 0}%
              </div>
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <Progress
              value={totalWatchTime > 0 ? (watchedTime / totalWatchTime) * 100 : 0}
              className="mt-2 h-2 bg-blue-200"
              indicatorColor="bg-blue-600"
            />
            <div className="mt-2 text-xs text-blue-600">
              {watchedHours} of {totalHours} hours ({watchedDays} of {totalDays} days)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{connectedHds.length}</div>
              <HardDrive className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-blue-600">{hds.length - connectedHds.length} disconnected</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Series</CardTitle>
            <CardDescription>Your most recently added series</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visibleSeries.slice(0, 5).map((series) => (
                <div key={series.id} className="flex items-center gap-4">
                  <div className="h-12 w-12 overflow-hidden rounded-md bg-blue-100">
                    <img
                      src={series.poster || "/placeholder.svg"}
                      alt={series.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <Link href={`/series/${series.id}`} className="font-medium text-blue-900 hover:underline">
                      {series.title}
                    </Link>
                    <div className="text-sm text-blue-600">
                      {series.seasons.length} season{series.seasons.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Overview</CardTitle>
            <CardDescription>Connected hard drives status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hds.map((hd) => (
                <div key={hd.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: hd.color }} />
                      <span className="font-medium">{hd.name}</span>
                    </div>
                    <span className={`text-xs ${hd.connected ? "text-green-600" : "text-red-600"}`}>
                      {hd.connected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  {hd.connected && (
                    <>
                      <Progress
                        value={Math.round((1 - hd.freeSpace / hd.totalSpace) * 100)}
                        className="h-2 bg-blue-200"
                        indicatorColor="bg-blue-600"
                      />
                      <div className="mt-1 text-xs text-blue-600">
                        {((hd.totalSpace - hd.freeSpace) / 1000000000000).toFixed(1)} TB Used /{" "}
                        {(hd.totalSpace / 1000000000000).toFixed(1)} TB Total
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

