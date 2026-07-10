import { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface RowCardProps {
  children: ReactNode
}

export function RowCard({ children }: RowCardProps) {
  return (
    <div
      className="px-4 rounded-2xl"
      style={{
        background: 'rgba(255,255,255,0.13)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.22)',
      }}
    >
      {children}
    </div>
  )
}

interface RowItemProps {
  icon: ReactNode
  title: ReactNode
  meta?: string
  right?: ReactNode
  onClick?: () => void
}

export function RowItem({ icon, title, meta, right, onClick }: RowItemProps) {
  return (
    <div
      className="flex items-center gap-3 py-[13px] border-b border-white/10 last:border-0 cursor-pointer"
      onClick={onClick}
    >
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 text-white"
        style={{ background: 'rgba(255,255,255,0.12)', fontSize: 17 }}
      >
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-display font-semibold text-white text-[14px]">{title}</div>
        {meta && (
          <div className="font-body text-white/55 mt-[1px] leading-[1.4]" style={{ fontSize: 11 }}>
            {meta}
          </div>
        )}
      </div>
      {right ?? <ChevronRight size={17} className="text-white/35 flex-shrink-0" />}
    </div>
  )
}

interface StatusBadgeProps {
  status: 'open' | 'closed' | 'maintenance' | 'info'
  label?: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = {
    open:        { background: 'rgba(46,196,90,0.2)',    color: '#7ee8a2' },
    closed:      { background: 'rgba(186,26,26,0.2)',    color: '#ff8080' },
    maintenance: { background: 'rgba(186,26,26,0.2)',    color: '#ff8080' },
    info:        { background: 'rgba(163,210,255,0.15)', color: 'rgba(163,210,255,0.9)' },
  }
  const display = label ?? (status === 'open' ? 'Open' : status === 'maintenance' ? 'Maintenance' : 'Closed')

  return (
    <span
      className="font-body font-semibold px-2 py-[3px] rounded-full flex-shrink-0"
      style={{ fontSize: 10, ...styles[status] }}
    >
      {display}
    </span>
  )
}
