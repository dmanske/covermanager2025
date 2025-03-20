"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { ApiKeySetup } from "@/components/api-key-setup"

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { toast } = useToast()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Initialize data if it doesn't exist in localStorage
  useEffect(() => {
    if (!localStorage.getItem("hds")) {
      localStorage.setItem(
        "hds",
        JSON.stringify([
          {
            id: "1",
            name: "Main HD",
            path: "D:/Media",
            connected: true,
            totalSpace: 1000000000000, // 1TB
            freeSpace: 400000000000, // 400GB
            color: "#3B82F6",
          },
          {
            id: "2",
            name: "Backup HD",
            path: "E:/Backup",
            connected: false,
            totalSpace: 2000000000000, // 2TB
            freeSpace: 1500000000000, // 1.5TB
            color: "#10B981",
          },
        ]),
      )
    }

    if (!localStorage.getItem("series")) {
      localStorage.setItem(
        "series",
        JSON.stringify([
          {
            id: "1",
            title: "Breaking Bad",
            hdId: "1",
            hidden: false,
            imdbId: "tt0903747",
            poster: "/placeholder.svg?height=450&width=300",
            seasons: [
              {
                number: 1,
                totalEpisodes: 7,
                availableEpisodes: 7,
                episodes: Array.from({ length: 7 }, (_, i) => ({
                  number: i + 1,
                  title: `Episode ${i + 1}`,
                  titlePt: `Episódio ${i + 1}`,
                  filename: `Breaking.Bad.S01E0${i + 1}.1080p.BluRay.mkv`,
                  duration: 45,
                  watched: i < 5,
                  synopsis: "Episode synopsis",
                  imdbRating: 8.5,
                  releaseDate: "2008-01-20",
                })),
              },
              {
                number: 2,
                totalEpisodes: 13,
                availableEpisodes: 10,
                episodes: Array.from({ length: 10 }, (_, i) => ({
                  number: i + 1,
                  title: `Episode ${i + 1}`,
                  titlePt: `Episódio ${i + 1}`,
                  filename: `Breaking.Bad.S02E${i < 9 ? "0" : ""}${i + 1}.1080p.BluRay.mkv`,
                  duration: 45,
                  watched: i < 3,
                  synopsis: "Episode synopsis",
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
            hidden: false,
            imdbId: "tt8111088",
            poster: "/placeholder.svg?height=450&width=300",
            seasons: [
              {
                number: 1,
                totalEpisodes: 8,
                availableEpisodes: 8,
                episodes: Array.from({ length: 8 }, (_, i) => ({
                  number: i + 1,
                  title: `Chapter ${i + 1}`,
                  titlePt: `Capítulo ${i + 1}`,
                  filename: `The.Mandalorian.S01E0${i + 1}.1080p.WEB-DL.mkv`,
                  duration: 40,
                  watched: i < 8,
                  synopsis: "Episode synopsis",
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
            hidden: true,
            imdbId: "tt4574334",
            poster: "/placeholder.svg?height=450&width=300",
            seasons: [
              {
                number: 1,
                totalEpisodes: 8,
                availableEpisodes: 8,
                episodes: Array.from({ length: 8 }, (_, i) => ({
                  number: i + 1,
                  title: `Chapter ${i + 1}`,
                  titlePt: `Capítulo ${i + 1}`,
                  filename: `Stranger.Things.S01E0${i + 1}.1080p.NF.WEB-DL.mkv`,
                  duration: 50,
                  watched: true,
                  synopsis: "Episode synopsis",
                  imdbRating: 8.7,
                  releaseDate: "2016-07-15",
                })),
              },
            ],
          },
        ]),
      )
    }

    toast({
      title: "App Initialized",
      description: "Movie Cover Manager 2025 is ready to use!",
    })
  }, [toast])

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <div className="flex min-h-screen flex-col bg-blue-50">
        <Header isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <div className="flex flex-1">
          <Sidebar
            currentPath={pathname}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
        <Footer />
        <Toaster />
        <ApiKeySetup />
      </div>
    </ThemeProvider>
  )
}

