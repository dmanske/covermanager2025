"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Check, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { searchOMDbByTitle } from "@/lib/omdb-service"

type WishlistItem = {
  id: string
  title: string
  type: "movie" | "series"
  reason: string
  priority: "low" | "medium" | "high"
  posterUrl?: string
  imdbID?: string
  addedAt: string
}

export function Wishlist() {
  const { toast } = useToast()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItem, setNewItem] = useState<Partial<WishlistItem>>({
    type: "movie",
    priority: "medium",
    title: "",
    reason: "",
  })
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    loadWishlistItems()
  }, [])

  const loadWishlistItems = () => {
    const storedItems = localStorage.getItem("wishlist")
    if (storedItems) {
      setWishlistItems(JSON.parse(storedItems))
    }
  }

  const saveWishlistItems = (items: WishlistItem[]) => {
    localStorage.setItem("wishlist", JSON.stringify(items))
    setWishlistItems(items)
  }

  const handleAddItem = () => {
    if (!newItem.title) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive",
      })
      return
    }

    const item: WishlistItem = {
      id: Date.now().toString(),
      title: newItem.title,
      type: newItem.type as "movie" | "series",
      reason: newItem.reason || "",
      priority: newItem.priority as "low" | "medium" | "high",
      posterUrl: newItem.posterUrl,
      imdbID: newItem.imdbID,
      addedAt: new Date().toISOString(),
    }

    const updatedItems = [...wishlistItems, item]
    saveWishlistItems(updatedItems)
    setIsAddDialogOpen(false)
    setNewItem({
      type: "movie",
      priority: "medium",
      title: "",
      reason: "",
    })
    setSearchResults([])

    toast({
      title: "Item adicionado",
      description: "O item foi adicionado à sua wishlist",
    })
  }

  const handleRemoveItem = (id: string) => {
    const updatedItems = wishlistItems.filter(item => item.id !== id)
    saveWishlistItems(updatedItems)
    
    toast({
      title: "Item removido",
      description: "O item foi removido da sua wishlist",
    })
  }

  const handleSearch = async () => {
    if (!newItem.title || newItem.title.length < 3) {
      toast({
        title: "Erro na busca",
        description: "Digite pelo menos 3 caracteres para pesquisar",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSearching(true)
      const results = await searchOMDbByTitle(newItem.title)
      setSearchResults(results.Search || [])
      
      if (!results.Search || results.Search.length === 0) {
        toast({
          title: "Nenhum resultado encontrado",
          description: "Tente um termo de busca diferente",
        })
      }
    } catch (error) {
      toast({
        title: "Erro na busca",
        description: "Não foi possível realizar a busca",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const selectSearchResult = (result: any) => {
    setNewItem({
      ...newItem,
      title: result.Title,
      type: result.Type === "movie" ? "movie" : "series",
      posterUrl: result.Poster !== "N/A" ? result.Poster : undefined,
      imdbID: result.imdbID,
    })
    setSearchResults([])
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Minha Wishlist</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Item
        </Button>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="bg-muted/40 rounded-lg p-8 text-center">
          <h2 className="text-xl font-medium mb-2">Sua wishlist está vazia</h2>
          <p className="text-muted-foreground mb-4">
            Adicione filmes e séries que você deseja assistir no futuro
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Primeiro Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlistItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveItem(item.id)}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {item.posterUrl && (
                  <div className="aspect-[2/3] mb-2 overflow-hidden rounded-md">
                    <img 
                      src={item.posterUrl} 
                      alt={item.title} 
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex gap-2 mb-2">
                  <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                    {item.type === "movie" ? "Filme" : "Série"}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(item.priority)}`}>
                    {item.priority === "high" ? "Alta Prioridade" : 
                     item.priority === "medium" ? "Média Prioridade" : "Baixa Prioridade"}
                  </span>
                </div>
                {item.reason && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.reason}</p>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground pt-0">
                Adicionado em {new Date(item.addedAt).toLocaleDateString()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar à Wishlist</DialogTitle>
            <DialogDescription>
              Adicione um filme ou série que você deseja assistir futuramente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                value={newItem.title || ""}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="Título do filme ou série"
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Buscando..." : "Buscar"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-muted/40 rounded-md p-2 max-h-48 overflow-y-auto">
                {searchResults.map((result) => (
                  <div 
                    key={result.imdbID}
                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer"
                    onClick={() => selectSearchResult(result)}
                  >
                    {result.Poster && result.Poster !== "N/A" ? (
                      <img src={result.Poster} alt={result.Title} className="h-12 w-8 object-cover rounded" />
                    ) : (
                      <div className="h-12 w-8 bg-muted-foreground/20 rounded flex items-center justify-center text-xs">
                        Sem capa
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm">{result.Title}</div>
                      <div className="text-xs text-muted-foreground">
                        {result.Year} • {result.Type === "movie" ? "Filme" : "Série"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select 
                  value={newItem.type || "movie"} 
                  onValueChange={(value) => setNewItem({ ...newItem, type: value as "movie" | "series" })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Filme</SelectItem>
                    <SelectItem value="series">Série</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select 
                  value={newItem.priority || "medium"} 
                  onValueChange={(value) => setNewItem({ ...newItem, priority: value as "low" | "medium" | "high" })}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo</Label>
              <Textarea
                id="reason"
                placeholder="Por que você quer assistir isto?"
                value={newItem.reason || ""}
                onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddItem}>
              <Check className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 