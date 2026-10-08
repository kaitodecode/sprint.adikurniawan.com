import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/lib/theme'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const opts: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: 'Terang' },
  { value: 'dark', icon: Moon, label: 'Gelap' },
  { value: 'system', icon: Monitor, label: 'Ikuti sistem' },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  return (
    <div role="group" aria-label="Tema" className={cn('inline-flex rounded-lg border bg-muted/50 p-0.5', className)}>
      {opts.map((o) => (
        <Button
          key={o.value}
          variant={theme === o.value ? 'secondary' : 'ghost'}
          size="icon"
          className={cn('size-7', theme === o.value && 'bg-background shadow-sm hover:bg-background')}
          aria-label={o.label}
          aria-pressed={theme === o.value}
          title={o.label}
          onClick={() => setTheme(o.value)}
        >
          <o.icon className="size-3.5" />
        </Button>
      ))}
    </div>
  )
}
