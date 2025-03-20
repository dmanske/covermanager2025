"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, Search, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"

export function Header({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}) {
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-40 bg-[#0A1128] text-blue-100 shadow-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-blue-100 hover:bg-blue-900 hover:text-blue-50"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>

        <div className="hidden md:block">
          <Link href="/" className="text-xl font-bold text-blue-50">
            Movie Cover Manager 2025
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-4 md:justify-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-blue-300" />
            <Input
              type="search"
              placeholder="Search media..."
              className="w-full bg-blue-900 pl-8 text-blue-100 placeholder:text-blue-400 focus:border-blue-500 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-blue-100 hover:bg-blue-900 hover:text-blue-50"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <div className="md:hidden">
            <Link href="/" className="text-lg font-bold text-blue-50">
              MCM 2025
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}

