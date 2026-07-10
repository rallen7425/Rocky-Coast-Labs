import { useNavigate } from 'react-router-dom'
import { X, User, Home, Bell, BookOpen, Wifi, FileText, Phone, AlertTriangle, HelpCircle, Globe, ChevronRight, Building, LogOut, ShieldCheck, LogIn } from 'lucide-react'
import { useAuth } from '../../lib/auth'

interface MenuDrawerProps {
  open: boolean
  onClose: () => void
}

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  danger?: boolean
  onClick?: () => void
}

function MenuItem({ icon, label, danger, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
    >
      <span style={{ color: danger ? '#ba1a1a' : '#103457' }}>{icon}</span>
      <span className="flex-1 font-body text-[15px] font-medium" style={{ color: danger ? '#ba1a1a' : '#191c1d' }}>
        {label}
      </span>
      <ChevronRight size={16} className="text-gray-400" />
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-5 pb-1">
      <span className="font-body text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#3f6371' }}>
        {children}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="h-px mx-5 bg-gray-100" />
}

export function MenuDrawer({ open, onClose }: MenuDrawerProps) {
  const { profile, isGuest, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    onClose()
    await signOut()
    navigate('/welcome', { replace: true })
  }

  const handleSignIn = () => {
    onClose()
    navigate('/login')
  }

  const goTo = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}

      <div
        className="fixed top-0 left-0 bottom-0 z-50 overflow-y-auto"
        style={{
          width: 292,
          background: 'white',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: open ? '4px 0 32px rgba(0,0,0,0.25)' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ background: '#103457' }}>
          <div>
            <div className="font-display font-bold text-white text-[18px]">Summer Village Life</div>
            {isGuest ? (
              <div className="font-body text-[12px] text-white/60 mt-0.5">Browsing as guest</div>
            ) : profile?.firstName ? (
              <div className="font-body text-[12px] text-white/60 mt-0.5">Welcome, {profile.firstName}</div>
            ) : (
              <div className="font-body text-[12px] text-white/60 mt-0.5">The Cottages at Summer Village</div>
            )}
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Guest sign-in prompt */}
        {isGuest ? (
          <div className="mx-4 mt-4 mb-1 p-4 rounded-2xl" style={{ background: '#f0f6ff', border: '1px solid #d0e4f7' }}>
            <p className="font-body text-[13px] font-medium text-[#103457] mb-3">
              Sign in for your personalized experience — save your cottage, check-in dates, and preferences.
            </p>
            <button
              onClick={handleSignIn}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-body font-semibold text-[14px] text-white"
              style={{ background: '#103457' }}
            >
              <LogIn size={15} />
              Sign In
            </button>
          </div>
        ) : (
          <>
            {/* Profile */}
            <SectionLabel>Profile</SectionLabel>
            <Divider />
            <MenuItem icon={<User size={18} />} label="Profile" />
            <MenuItem icon={<Home size={18} />} label={profile?.cottageNumber ? `Cottage ${profile.cottageNumber}` : 'Cottage'} />
            <MenuItem icon={<Bell size={18} />} label="Notifications" />
          </>
        )}

        {/* Renters */}
        <SectionLabel>Renters</SectionLabel>
        <Divider />
        <MenuItem icon={<BookOpen size={18} />} label="Arrival Guide" />
        <MenuItem icon={<FileText size={18} />} label="Renter's Guide" />
        <MenuItem icon={<Wifi size={18} />} label="WiFi" />
        <MenuItem icon={<FileText size={18} />} label="Property Rules" />

        {/* Owners — only for owner or admin */}
        {(profile?.role === 'owner' || profile?.role === 'admin') && (
          <>
            <SectionLabel>Owners</SectionLabel>
            <Divider />
            <MenuItem icon={<Building size={18} />} label="Owner's Page" />
          </>
        )}

        {/* Admin shortcut */}
        {profile?.role === 'admin' && (
          <>
            <SectionLabel>Admin</SectionLabel>
            <Divider />
            <MenuItem icon={<ShieldCheck size={18} />} label="Admin Console" onClick={() => goTo('/admin')} />
          </>
        )}

        {/* Contact */}
        <SectionLabel>Contact</SectionLabel>
        <Divider />
        <MenuItem icon={<Phone size={18} />} label="Front Desk" />
        <MenuItem icon={<AlertTriangle size={18} />} label="Emergency" danger />

        {/* Information */}
        <SectionLabel>Information</SectionLabel>
        <Divider />
        <MenuItem icon={<HelpCircle size={18} />} label="FAQ" />
        <MenuItem icon={<Globe size={18} />} label="Community Website" />

        {/* Sign out (authenticated users only) */}
        {!isGuest && (
          <div className="mt-2 px-5 pb-6">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full py-3 font-body text-[14px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  )
}
