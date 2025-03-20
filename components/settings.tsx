"use client"

import { useState, useEffect } from "react"
import { Save, Check, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"

export function Settings() {
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [omdbApiKey, setOmdbApiKey] = useState("")
  const [autoScan, setAutoScan] = useState(false)
  const [scanInterval, setScanInterval] = useState(60)
  const [scanOnStartup, setScanOnStartup] = useState(true)
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    // Carrega as configurações do localStorage
    const settings = localStorage.getItem("settings")
    if (settings) {
      const parsedSettings = JSON.parse(settings)
      setOmdbApiKey(parsedSettings.omdbApiKey || "")
      setAutoScan(parsedSettings.autoScan ?? false)
      setScanInterval(parsedSettings.scanInterval || 60)
      setScanOnStartup(parsedSettings.scanOnStartup ?? true)
      setEnableNotifications(parsedSettings.enableNotifications ?? true)
    }
  }, [])

  const saveSettings = async () => {
    setIsSaving(true)
    
    const settings = {
      omdbApiKey,
      autoScan,
      scanInterval,
      scanOnStartup,
      enableNotifications,
      theme
    }
    
    localStorage.setItem("settings", JSON.stringify(settings))
    
    // Simula um atraso para o botão salvar
    await new Promise(resolve => setTimeout(resolve, 500))
    
    setIsSaving(false)
    
    toast({
      title: "Configurações salvas",
      description: "Suas configurações foram salvas com sucesso"
    })
  }

  const testApiKey = async () => {
    if (!omdbApiKey) {
      toast({
        title: "API Key não fornecida",
        description: "Por favor, insira uma API Key para testar",
        variant: "destructive"
      })
      return
    }
    
    setIsTesting(true)
    
    try {
      const response = await fetch(`https://www.omdbapi.com/?apikey=${omdbApiKey}&s=matrix`)
      const data = await response.json()
      
      if (data.Response === "True") {
        toast({
          title: "API Key válida",
          description: "A conexão com a API do OMDB foi estabelecida com sucesso",
        })
      } else {
        toast({
          title: "API Key inválida",
          description: data.Error || "Não foi possível conectar à API do OMDB",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Erro ao testar API Key",
        description: "Não foi possível se conectar ao serviço OMDB",
        variant: "destructive"
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configurações</h1>
        <Button onClick={saveSettings} disabled={isSaving}>
          {isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
      
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="api">API e Integração</TabsTrigger>
          <TabsTrigger value="scan">Escaneamento</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aparência</CardTitle>
              <CardDescription>
                Personalize a aparência do aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme">Tema Escuro</Label>
                <Switch 
                  id="theme"
                  checked={theme === "dark"} 
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>
                Configurações de notificações e alertas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Ativar Notificações</Label>
                <Switch 
                  id="notifications"
                  checked={enableNotifications} 
                  onCheckedChange={setEnableNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>OMDB API</CardTitle>
              <CardDescription>
                Configurações para a API do Open Movie Database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="omdb-api-key">API Key da OMDB</Label>
                <div className="flex gap-2">
                  <Input
                    id="omdb-api-key"
                    type="text"
                    value={omdbApiKey}
                    onChange={(e) => setOmdbApiKey(e.target.value)}
                    placeholder="Insira sua API Key..."
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={testApiKey}
                    disabled={isTesting}
                  >
                    {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {isTesting ? "Testando..." : "Testar"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Obtenha uma API Key gratuita em <a href="https://www.omdbapi.com/apikey.aspx" target="_blank" rel="noopener noreferrer" className="underline">omdbapi.com</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="scan" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Escaneamento de HDs</CardTitle>
              <CardDescription>
                Configure como o aplicativo escaneia seus HDs em busca de filmes e séries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="scan-startup">Escanear ao iniciar</Label>
                <Switch 
                  id="scan-startup"
                  checked={scanOnStartup} 
                  onCheckedChange={setScanOnStartup}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scan">Escanear periodicamente</Label>
                <Switch 
                  id="auto-scan"
                  checked={autoScan} 
                  onCheckedChange={setAutoScan}
                />
              </div>
              {autoScan && (
                <div className="grid gap-2">
                  <Label htmlFor="scan-interval">Intervalo de escaneamento (minutos)</Label>
                  <Input
                    id="scan-interval"
                    type="number"
                    value={scanInterval}
                    onChange={(e) => setScanInterval(Number(e.target.value))}
                    min={5}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backup" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup e Restauração</CardTitle>
              <CardDescription>
                Faça backup de suas configurações e dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Button variant="outline">
                  Exportar Backup
                </Button>
                <Button variant="outline">
                  Importar Backup
                </Button>
                <Separator />
                <Button variant="destructive">
                  Redefinir para padrões
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                O backup exporta todos os seus dados de filmes, séries, HDs e configurações.
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 