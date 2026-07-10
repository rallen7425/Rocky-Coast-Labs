export function StatusBar() {
  const now = new Date()
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  return (
    <div className="flex justify-between items-center px-5 pt-3 pb-1">
      <span className="text-white font-body text-[13px] font-semibold">{time}</span>
      <div className="flex items-center gap-1.5 text-white opacity-80">
        <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
          <rect x="0" y="3" width="3" height="9" rx="0.5" opacity="0.4"/>
          <rect x="4" y="2" width="3" height="10" rx="0.5" opacity="0.6"/>
          <rect x="8" y="1" width="3" height="11" rx="0.5" opacity="0.8"/>
          <rect x="12" y="0" width="3" height="12" rx="0.5"/>
        </svg>
        <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor">
          <path d="M7.5 2.5C9.8 2.5 11.9 3.4 13.4 4.9L14.8 3.5C12.9 1.6 10.3 0.5 7.5 0.5C4.7 0.5 2.1 1.6 0.2 3.5L1.6 4.9C3.1 3.4 5.2 2.5 7.5 2.5Z" opacity="0.4"/>
          <path d="M7.5 5C9 5 10.4 5.6 11.4 6.6L12.8 5.2C11.4 3.8 9.5 3 7.5 3C5.5 3 3.6 3.8 2.2 5.2L3.6 6.6C4.6 5.6 6 5 7.5 5Z" opacity="0.7"/>
          <path d="M7.5 7.5C8.3 7.5 9 7.8 9.5 8.3L10.9 6.9C10.1 6.1 9 5.5 7.5 5.5C6 5.5 4.9 6.1 4.1 6.9L5.5 8.3C6 7.8 6.7 7.5 7.5 7.5Z"/>
          <circle cx="7.5" cy="10.5" r="1.5"/>
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="currentColor">
          <rect x="0" y="1" width="21" height="10" rx="2" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5"/>
          <rect x="1.5" y="2.5" width="16" height="7" rx="1" fill="currentColor" opacity="0.9"/>
          <path d="M22.5 4V8C23.3 7.7 24 6.9 24 6C24 5.1 23.3 4.3 22.5 4Z" fill="currentColor" opacity="0.5"/>
        </svg>
      </div>
    </div>
  )
}
