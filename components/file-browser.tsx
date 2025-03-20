"use client"

import { useState, useEffect } from "react"
import { Folder, File, Film, ChevronRight, ChevronDown, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import type { HD } from "@/lib/types"

interface FileBrowserProps {
  hdId: string
  onFileSelect?: (filePath: string) => void
  onFolderSelect?: (folderPath: string) => void
  fileTypes?: string[]
  showFiles?: boolean
  showFolders?: boolean
  initialPath?: string
}

interface FileSystemItem {
  name: string
  path: string
  isDirectory: boolean
  children?: FileSystemItem[]
  expanded?: boolean
}

export function FileBrowser({
  hdId,
  onFileSelect,
  onFolderSelect,
  fileTypes = [".mp4", ".mkv", ".avi", ".mov", ".wmv"],
  showFiles = true,
  showFolders = true,
  initialPath,
}: FileBrowserProps) {
  const { toast } = useToast()
  const [hd, setHd] = useState<HD | null>(null)
  const [isFileSystemAccessSupported, setIsFileSystemAccessSupported] = useState(false)
  const [rootDirectory, setRootDirectory] = useState<FileSystemDirectoryHandle | null>(null)
  const [fileStructure, setFileStructure] = useState<FileSystemItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Check if the File System Access API is supported
  useEffect(() => {
    setIsFileSystemAccessSupported(
      "showDirectoryPicker" in window ||
        (navigator.userAgent.includes("Chrome") && Number.parseInt(navigator.userAgent.split("Chrome/")[1]) >= 86),
    )

    // Load HD data
    const storedHds = localStorage.getItem("hds")
    if (storedHds) {
      const hds = JSON.parse(storedHds)
      const foundHd = hds.find((h: HD) => h.id === hdId)
      setHd(foundHd || null)
    }
  }, [hdId])

  const openFileBrowser = async () => {
    if (!isFileSystemAccessSupported) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support file system access. Try using Chrome or Edge.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      // @ts-ignore - TypeScript doesn't know about showDirectoryPicker yet
      const directoryHandle = await window.showDirectoryPicker()
      setRootDirectory(directoryHandle)

      // Scan the directory
      const structure = await scanDirectory(directoryHandle)
      setFileStructure([structure])

      setIsDialogOpen(true)
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
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

  const scanDirectory = async (
    directoryHandle: FileSystemDirectoryHandle,
    currentPath = "",
  ): Promise<FileSystemItem> => {
    const item: FileSystemItem = {
      name: directoryHandle.name,
      path: currentPath ? `${currentPath}/${directoryHandle.name}` : directoryHandle.name,
      isDirectory: true,
      children: [],
      expanded: false,
    }

    try {
      for await (const entry of directoryHandle.values()) {
        if (entry.kind === "directory" && showFolders) {
          const childPath = item.path
          const childDir = await scanDirectory(entry, childPath)
          item.children?.push(childDir)
        } else if (entry.kind === "file" && showFiles) {
          const fileName = entry.name.toLowerCase()
          if (fileTypes.some((type) => fileName.endsWith(type.toLowerCase()))) {
            item.children?.push({
              name: entry.name,
              path: `${item.path}/${entry.name}`,
              isDirectory: false,
            })
          }
        }
      }
    } catch (error) {
      console.error("Error scanning directory:", error)
    }

    // Sort: directories first, then files, both alphabetically
    item.children?.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })

    return item
  }

  const toggleDirectory = (path: string) => {
    const updateExpanded = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map((item) => {
        if (item.path === path) {
          return { ...item, expanded: !item.expanded }
        }
        if (item.children) {
          return { ...item, children: updateExpanded(item.children) }
        }
        return item
      })
    }

    setFileStructure(updateExpanded(fileStructure))
  }

  const handleSelect = (item: FileSystemItem) => {
    setSelectedPath(item.path)

    if (item.isDirectory && onFolderSelect) {
      onFolderSelect(item.path)
      setIsDialogOpen(false)
    } else if (!item.isDirectory && onFileSelect) {
      onFileSelect(item.path)
      setIsDialogOpen(false)
    }
  }

  const filterItems = (items: FileSystemItem[], query: string): FileSystemItem[] => {
    if (!query) return items

    return items
      .filter((item) => {
        const matchesName = item.name.toLowerCase().includes(query.toLowerCase())

        if (item.children && item.children.length > 0) {
          const filteredChildren = filterItems(item.children, query)
          if (filteredChildren.length > 0) {
            return true
          }
        }

        return matchesName
      })
      .map((item) => {
        if (item.children) {
          return {
            ...item,
            children: filterItems(item.children, query),
            expanded: query ? true : item.expanded,
          }
        }
        return item
      })
  }

  const renderFileTree = (items: FileSystemItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.path} style={{ marginLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center p-1 rounded hover:bg-blue-50 ${selectedPath === item.path ? "bg-blue-100" : ""}`}
          onClick={() => handleSelect(item)}
        >
          {item.isDirectory ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleDirectory(item.path)
                }}
              >
                {item.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-sm">{item.name}</span>
            </>
          ) : (
            <>
              <div className="w-6" />
              {item.name.match(/\.(mp4|mkv|avi|mov|wmv)$/i) ? (
                <Film className="h-4 w-4 mr-2 text-blue-500" />
              ) : (
                <File className="h-4 w-4 mr-2 text-gray-500" />
              )}
              <span className="text-sm">{item.name}</span>
            </>
          )}
        </div>

        {item.isDirectory && item.expanded && item.children && <div>{renderFileTree(item.children, level + 1)}</div>}
      </div>
    ))
  }

  const filteredFileStructure = filterItems(fileStructure, searchQuery)

  return (
    <div>
      <div className="flex items-center gap-2">
        <Button onClick={openFileBrowser} disabled={isLoading} variant="outline" className="flex-1">
          {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Folder className="mr-2 h-4 w-4" />}
          Browse Files on {hd?.name || "HD"}
        </Button>
      </div>

      {!isFileSystemAccessSupported && (
        <p className="mt-2 text-xs text-amber-600">
          Note: File browsing is not supported in your browser. Try using Chrome or Edge.
        </p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Browse Files</DialogTitle>
            <DialogDescription>
              Select a {showFiles && showFolders ? "file or folder" : showFiles ? "file" : "folder"} from{" "}
              {hd?.name || "your HD"}
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search files and folders..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-[400px] border rounded-md p-2">
            {filteredFileStructure.length > 0 ? (
              renderFileTree(filteredFileStructure)
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">No files or folders found</div>
            )}
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

