import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function Kpi({ label, value, hint, icon: Icon, valueClass }: { label: string; value: string; hint?: string; icon?: LucideIcon; valueClass?: string }) {
  return (
    <Card className="py-4">
      <CardContent className="px-4">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          {label}
          {Icon && <Icon className="size-4" />}
        </div>
        <p className={cn('mt-1.5 text-2xl font-semibold tracking-tight', valueClass)}>{value}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
