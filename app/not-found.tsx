import Link from 'next/link'
import { Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-4">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-secondary text-primary">
        <Search className="h-7 w-7" />
      </div>
      <h1 className="font-serif text-3xl text-foreground">404</h1>
      <p className="mt-2 text-muted-foreground">Diese Seite wurde nicht gefunden.</p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Zur Startseite
      </Link>
    </div>
  )
}
