"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Save, FileUp, Trash2, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export function ImportData() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [jsonData, setJsonData] = useState("")
  const [dataType, setDataType] = useState<"hds" | "series">("hds")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(null)

    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        // Validate JSON
        JSON.parse(content)
        setJsonData(content)
        setSuccess(`File "${file.name}" loaded successfully. Click "Import Data" to save.`)
      } catch (err) {
        setError("Invalid JSON file. Please check the file format.")
        setJsonData("")
      }
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    setError(null)
    setSuccess(null)

    try {
      // Validate JSON
      const data = JSON.parse(jsonData)

      // Basic validation based on data type
      if (dataType === "hds") {
        if (!Array.isArray(data)) {
          throw new Error("HD data must be an array")
        }

        // Check if each HD has required fields
        data.forEach((hd, index) => {
          if (
            !hd.id ||
            !hd.name ||
            !hd.path ||
            hd.connected === undefined ||
            !hd.totalSpace ||
            !hd.freeSpace ||
            !hd.color
          ) {
            throw new Error(`HD at index ${index} is missing required fields`)
          }
        })
      } else if (dataType === "series") {
        if (!Array.isArray(data)) {
          throw new Error("Series data must be an array")
        }

        // Check if each series has required fields
        data.forEach((series, index) => {
          if (
            !series.id ||
            !series.title ||
            !series.hdId ||
            series.hidden === undefined ||
            !series.seasons ||
            !Array.isArray(series.seasons)
          ) {
            throw new Error(`Series at index ${index} is missing required fields`)
          }
        })
      }

      // Save to localStorage
      localStorage.setItem(dataType, jsonData)

      setSuccess(`${dataType === "hds" ? "Hard drives" : "Series"} data imported successfully!`)
      toast({
        title: "Data Imported",
        description: `Your ${dataType === "hds" ? "hard drives" : "series"} data has been imported successfully.`,
      })

      // Clear the textarea
      setJsonData("")

      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(`Error importing data: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleExport = () => {
    const data = localStorage.getItem(dataType)

    if (!data) {
      setError(`No ${dataType === "hds" ? "hard drives" : "series"} data found.`)
      return
    }

    try {
      // Create a blob and download it
      const blob = new Blob([data], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `mcm2025_${dataType}_export.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Data Exported",
        description: `Your ${dataType === "hds" ? "hard drives" : "series"} data has been exported successfully.`,
      })
    } catch (err) {
      setError(`Error exporting data: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  const handleClearData = () => {
    if (
      confirm(
        `Are you sure you want to clear all ${dataType === "hds" ? "hard drives" : "series"} data? This cannot be undone.`,
      )
    ) {
      localStorage.removeItem(dataType)
      toast({
        title: "Data Cleared",
        description: `Your ${dataType === "hds" ? "hard drives" : "series"} data has been cleared.`,
        variant: "destructive",
      })

      // Reload the page to reflect changes
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Import/Export Data</h1>
        <p className="text-blue-700">Manage your media collection data</p>
      </div>

      <Tabs defaultValue="import" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>Import your hard drives or series data from a JSON file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={dataType === "hds" ? "bg-blue-100" : ""}
                    onClick={() => setDataType("hds")}
                  >
                    <HardDrive className="mr-2 h-4 w-4" />
                    Hard Drives
                  </Button>
                  <Button
                    variant="outline"
                    className={dataType === "series" ? "bg-blue-100" : ""}
                    onClick={() => setDataType("series")}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    Series
                  </Button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                    <Upload className="mr-2 h-4 w-4" />
                    Select JSON File
                  </Button>
                  <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileUpload} />

                  <Button variant="destructive" onClick={handleClearData} className="flex-1">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear {dataType === "hds" ? "Hard Drives" : "Series"} Data
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div>
                <Textarea
                  placeholder={`Paste your ${dataType === "hds" ? "hard drives" : "series"} JSON data here...`}
                  className="min-h-[200px] font-mono text-sm"
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                />
              </div>

              <Button onClick={handleImport} disabled={!jsonData} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Import Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Export your hard drives or series data to a JSON file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className={dataType === "hds" ? "bg-blue-100" : ""}
                    onClick={() => setDataType("hds")}
                  >
                    <HardDrive className="mr-2 h-4 w-4" />
                    Hard Drives
                  </Button>
                  <Button
                    variant="outline"
                    className={dataType === "series" ? "bg-blue-100" : ""}
                    onClick={() => setDataType("series")}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    Series
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button onClick={handleExport} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Export {dataType === "hds" ? "Hard Drives" : "Series"} Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Data Format</CardTitle>
          <CardDescription>Reference for the expected data format</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hds">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="hds">Hard Drives Format</TabsTrigger>
              <TabsTrigger value="series">Series Format</TabsTrigger>
            </TabsList>

            <TabsContent value="hds" className="mt-4">
              <div className="rounded-md bg-blue-50 p-4">
                <pre className="overflow-auto text-xs text-blue-800">
                  {`[
  {
    "id": "1",
    "name": "Main HD",
    "path": "D:/Media",
    "connected": true,
    "totalSpace": 1000000000000,
    "freeSpace": 400000000000,
    "color": "#3B82F6"
  },
  {
    "id": "2",
    "name": "Backup HD",
    "path": "E:/Backup",
    "connected": false,
    "totalSpace": 2000000000000,
    "freeSpace": 1500000000000,
    "color": "#10B981"
  }
]`}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="series" className="mt-4">
              <div className="rounded-md bg-blue-50 p-4">
                <pre className="overflow-auto text-xs text-blue-800">
                  {`[
  {
    "id": "1",
    "title": "Breaking Bad",
    "hdId": "1",
    "hidden": false,
    "imdbId": "tt0903747",
    "poster": "/placeholder.svg?height=450&width=300",
    "seasons": [
      {
        "number": 1,
        "totalEpisodes": 7,
        "availableEpisodes": 7,
        "episodes": [
          {
            "number": 1,
            "title": "Pilot",
            "titlePt": "Piloto",
            "filename": "Breaking.Bad.S01E01.1080p.BluRay.mkv",
            "duration": 45,
            "watched": true,
            "synopsis": "Episode synopsis",
            "imdbRating": 8.5,
            "releaseDate": "2008-01-20"
          },
          // More episodes...
        ]
      }
      // More seasons...
    ]
  }
  // More series...
]`}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

