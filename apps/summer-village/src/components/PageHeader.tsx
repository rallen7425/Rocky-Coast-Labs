interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="px-5 pt-3.5 pb-0 flex-shrink-0">
      <h1
        className="font-display font-bold text-white leading-[1.1]"
        style={{ fontSize: 30, textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
      >
        {title}
      </h1>
      {subtitle && (
        <p className="font-body text-white/55 mt-[3px]" style={{ fontSize: 12 }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
