"use client"

import type React from "react"

import { useEffect } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Film,
  Tv,
  Music,
  Video,
  Heart,
  HardDrive,
  BarChart2,
  Laptop,
  Smartphone,
  X,
  Upload,
  Settings,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentPath: string
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function Sidebar({ currentPath, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [currentPath, setIsMobileMenuOpen])

  const navSections: NavSection[] = [
    {
      title: "PRINCIPAL",
      items: [
        {
          title: "Dashboard",
          href: "/",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "BIBLIOTECA",
      items: [
        {
          title: "Filmes",
          href: "/movies",
          icon: Film,
        },
        {
          title: "Séries",
          href: "/series",
          icon: Tv,
        },
        {
          title: "Shows",
          href: "/shows",
          icon: Music,
        },
        {
          title: "Clips",
          href: "/clips",
          icon: Video,
        },
        {
          title: "Wishlist",
          href: "/wishlist",
          icon: Heart,
        },
      ],
    },
    {
      title: "GERENCIAMENTO",
      items: [
        {
          title: "HDs",
          href: "/hds",
          icon: HardDrive,
        },
        {
          title: "Estatísticas",
          href: "/stats",
          icon: BarChart2,
        },
        {
          title: "Import/Export",
          href: "/import",
          icon: Upload,
        },
        {
          title: "Settings",
          href: "/settings",
          icon: Settings,
        },
      ],
    },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden h-full w-64 flex-col bg-[#1E40AF] text-blue-100 md:flex">
        <ScrollArea className="flex-1">
          <div className="px-3 py-4">
            {navSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="mb-2 px-4 text-xs font-semibold text-blue-300">{section.title}</h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-[#3B82F6] hover:text-white",
                        currentPath === item.href ? "bg-[#3B82F6] text-white" : "text-blue-100",
                      )}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/80 transition-opacity duration-300 md:hidden",
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-[#1E40AF] text-blue-100 shadow-lg transition-transform duration-300 md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-blue-800 px-4">
          <Link href="/" className="text-lg font-bold text-blue-50">
            Movie Cover Manager 2025
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-blue-100 hover:bg-blue-900 hover:text-blue-50"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="px-3 py-4">
            {navSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="mb-2 px-4 text-xs font-semibold text-blue-300">{section.title}</h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-[#3B82F6] hover:text-white",
                        currentPath === item.href ? "bg-[#3B82F6] text-white" : "text-blue-100",
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="mr-2 h-5 w-5" />
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}

