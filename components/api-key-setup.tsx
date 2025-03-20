"use client"

import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export function ApiKeySetup() {
  const { toast } = useToast()

  useEffect(() => {
    // Check if API key is already set
    const existingApiKey = localStorage.getItem("imdbApiKey")

    if (!existingApiKey) {
      // Set the TMDb API key
      const tmdbApiKey = "270445f111f06cdf39d4af2fad0b7f8d"
      localStorage.setItem("imdbApiKey", tmdbApiKey)

      // Notify the user
      toast({
        title: "API Key Added",
        description: "Your TMDb API key has been automatically configured.",
      })
    }
  }, [toast])

  // This component doesn't render anything
  return null
}

