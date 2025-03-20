import type { Metadata } from 'next'
import './globals.css'
import { AppLayout } from '@/components/app-layout'

export const metadata: Metadata = {
  title: 'Gerenciador de Filmes e Séries',
  description: 'Aplicativo para gerenciar sua coleção de filmes e séries',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
