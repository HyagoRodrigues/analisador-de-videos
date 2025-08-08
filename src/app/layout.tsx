import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Analisador de Vídeos do YouTube',
  description: 'Aplicação web para transcrever e analisar vídeos do YouTube usando IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    🎥 Analisador de Vídeos
                  </h1>
                </div>
                <div className="text-sm text-gray-500">
                  Powered by OpenAI Whisper
                </div>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="bg-white border-t mt-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <p className="text-center text-gray-500 text-sm">
                © 2024 Analisador de Vídeos do YouTube. Licenciado sob MIT.
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}