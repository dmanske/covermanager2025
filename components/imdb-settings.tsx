"use client"

import { useState, useEffect } from "react"
import { Key, Save, RefreshCw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

export function ImdbSettings() {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    // Load API key from localStorage
    const storedApiKey = localStorage.getItem("imdbApiKey")
    if (storedApiKey) {
      setApiKey(storedApiKey)
    }
  }, [])

  const saveApiKey = () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      })
      return
    }

    localStorage.setItem("imdbApiKey", apiKey)

    toast({
      title: "API Key Saved",
      description: "Your IMDb API key has been saved successfully.",
    })
  }

  const testApiKey = async () => {
    if (!apiKey) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      // Test the API key with TMDb API
      const response = await fetch(`https://api.themoviedb.org/3/movie/550?api_key=${apiKey}`)
      const data = await response.json()

      if (data.id && data.title) {
        setTestResult({
          success: true,
          message: "API key is valid! Successfully retrieved data for: " + data.title,
        })
      } else if (data.status_message) {
        setTestResult({
          success: false,
          message: "API key test failed: " + data.status_message,
        })
      } else {
        setTestResult({
          success: false,
          message: "API key test failed: Unknown error",
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "API test failed: " + (error instanceof Error ? error.message : "Unknown error"),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>IMDb API Settings</CardTitle>
        <CardDescription>Configure your IMDb API key to fetch movie and series metadata</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="apiKey">IMDb API Key</Label>
          <div className="flex">
            <div className="relative flex-1">
              <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your IMDb API key"
                className="pl-8"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <Button onClick={testApiKey} disabled={isLoading} variant="outline" className="ml-2">
              {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Test Key"}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Your API key is stored locally in your browser and is never sent to our servers.
          </p>
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{testResult.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-md bg-blue-50 p-3">
          <h4 className="text-sm font-medium text-blue-800">How to get an IMDb API key</h4>
          <p className="mt-1 text-xs text-blue-700">
            Movie Cover Manager 2025 supports the following IMDb data providers:
          </p>
          <ul className="mt-2 list-disc pl-5 text-xs text-blue-700">
            <li>
              <a
                href="https://www.omdbapi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                OMDb API
              </a>{" "}
              - Free for up to 1,000 daily requests
            </li>
            <li>
              <a
                href="https://rapidapi.com/apidojo/api/imdb8/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                IMDb API (RapidAPI)
              </a>{" "}
              - Various pricing plans available
            </li>
            <li>
              <a
                href="https://developer.themoviedb.org/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline"
              >
                TMDb API
              </a>{" "}
              - Free for non-commercial use
            </li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveApiKey} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save API Key
        </Button>
      </CardFooter>
    </Card>
  )
}

