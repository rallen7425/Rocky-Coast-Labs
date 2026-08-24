import { useEffect, useState, FormEvent } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon, GripVertical } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../../lib/supabase'
import { AdminPageTitle } from './AdminLayout'
import { Modal } from './components/Modal'
import { FormField, FormError, inputClass, textareaClass } from './components/FormField'
import { ConfirmButton } from './components/ConfirmButton'
import { useSupabaseMutation } from './hooks/useSupabaseMutation'
import { AMENITY_PHOTO_BUCKET, amenityPhotoUrl } from '../../lib/useAmenities'

type AmenityStatus = 'open' | 'closed' | 'maintenance'

interface Amenity {
  id: string
  name: string
  status: AmenityStatus
  hours_open: string | null
  hours_close: string | null
  location: string | null
  age_restriction: string | null
  notes: string | null
  sort_order: number
  parent_id: string | null
  description: string | null
  long_description: string | null
  photo_url: string | null
  rules: string | null
  hidden: boolean
}

const STATUS_OPTS: { value: AmenityStatus; label: string; bg: string; color: string }[] = [
  { value: 'open',        label: 'Open',        bg: 'rgba(46,196,90,0.15)',  color: '#166534' },
  { value: 'maintenance', label: 'Maintenance',  bg: 'rgba(240,165,0,0.15)', color: '#7a4f00' },
  { value: 'closed',      label: 'Closed',       bg: 'rgba(186,26,26,0.12)', color: '#ba1a1a' },
]

interface FormState {
  name: string
  description: string
  status: AmenityStatus
  hours_open: string
  hours_close: string
  age_restriction: string
  rules: string
  parent_id: string
  long_description: string
  photo_url: string | null
}

const BLANK: FormState = {
  name: '', description: '', status: 'open', hours_open: '', hours_close: '',
  age_restriction: '', rules: '', parent_id: '', long_description: '', photo_url: null,
}

export function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(BLANK)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const { mutate, saving, error, setError } = useSupabaseMutation()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const load = async () => {
    const { data } = await supabase.from('amenities').select('*').order('sort_order')
    setAmenities((data ?? []) as Amenity[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const topLevel = amenities.filter(a => !a.parent_id)
  const childrenOf = (id: string) => amenities.filter(a => a.parent_id === id)

  const openNew = () => {
    setError(null)
    setForm(BLANK)
    setPhotoFile(null)
    setEditId(null)
    setShowForm(true)
  }

  const startEdit = (a: Amenity) => {
    setError(null)
    setForm({
      name: a.name, description: a.description ?? '', status: a.status,
      hours_open: a.hours_open ?? '', hours_close: a.hours_close ?? '',
      age_restriction: a.age_restriction ?? '', rules: a.rules ?? '',
      parent_id: a.parent_id ?? '', long_description: a.long_description ?? '',
      photo_url: a.photo_url,
    })
    setPhotoFile(null)
    setEditId(a.id)
    setShowForm(true)
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()

    let photo_url = form.photo_url
    if (photoFile) {
      setUploading(true)
      const path = `${crypto.randomUUID()}-${photoFile.name}`
      const { error: uploadError } = await supabase.storage.from(AMENITY_PHOTO_BUCKET).upload(path, photoFile)
      setUploading(false)
      if (uploadError) { setError(uploadError.message); return }
      photo_url = path
    }

    const payload = {
      name: form.name,
      description: form.description || null,
      status: form.status,
      hours_open: form.hours_open || null,
      hours_close: form.hours_close || null,
      age_restriction: form.age_restriction || null,
      rules: form.rules || null,
      parent_id: form.parent_id || null,
      long_description: form.long_description || null,
      photo_url,
    }

    if (editId) {
      const { ok } = await mutate(() => supabase.from('amenities').update(payload).eq('id', editId))
      if (!ok) return
    } else {
      const { ok } = await mutate(() =>
        supabase.from('amenities').insert({ ...payload, hidden: false, sort_order: amenities.length })
      )
      if (!ok) return
    }

    setShowForm(false)
    setEditId(null)
    setForm(BLANK)
    setPhotoFile(null)
    load()
  }

  const toggleHidden = async (a: Amenity) => {
    const { ok } = await mutate(() => supabase.from('amenities').update({ hidden: !a.hidden }).eq('id', a.id))
    if (ok) load()
  }

  const remove = async (a: Amenity) => {
    const { ok } = await mutate(() => supabase.from('amenities').delete().eq('id', a.id))
    if (ok) load()
  }

  // Drag-and-drop reordering. Constrained to same-group moves only (a
  // top-level item can't be dropped among another parent's children, and
  // vice versa) -- moving something between groups is still done via the
  // "Sub-amenity of" picker in the edit form, not by dragging. sort_order is
  // renumbered 0..n-1 within just the affected group; groups don't need
  // globally-distinct sort_order ranges since both the admin list and the
  // guest-facing app only ever compare sort_order *within* a group (derived
  // by filtering on parent_id after an `.order('sort_order')` query).
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeItem = amenities.find(a => a.id === active.id)
    const overItem = amenities.find(a => a.id === over.id)
    if (!activeItem || !overItem) return
    if (activeItem.parent_id !== overItem.parent_id) return

    const group = activeItem.parent_id ? childrenOf(activeItem.parent_id) : topLevel
    const oldIndex = group.findIndex(a => a.id === active.id)
    const newIndex = group.findIndex(a => a.id === over.id)
    const reordered = arrayMove(group, oldIndex, newIndex)

    const orderMap = new Map(reordered.map((a, i) => [a.id, i]))
    setAmenities(prev =>
      prev
        .map(a => (orderMap.has(a.id) ? { ...a, sort_order: orderMap.get(a.id)! } : a))
        .sort((a, b) => a.sort_order - b.sort_order)
    )

    const results = await Promise.all(
      reordered.map((a, i) => supabase.from('amenities').update({ sort_order: i }).eq('id', a.id))
    )
    const failed = results.find(r => r.error)
    if (failed?.error) {
      setError(failed.error.message)
      load()
    }
  }

  const renderRow = (a: Amenity, indent: boolean) => (
    <SortableAmenityRow
      key={a.id}
      amenity={a}
      indent={indent}
      childCount={childrenOf(a.id).length}
      onToggleHidden={toggleHidden}
      onEdit={startEdit}
      onRemove={remove}
    />
  )

  const flatIds = topLevel.flatMap(p => [p.id, ...childrenOf(p.id).map(c => c.id)])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <AdminPageTitle>Amenities</AdminPageTitle>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white"
          style={{ background: '#103457' }}
        >
          <Plus size={16} /> New Amenity
        </button>
      </div>

      {showForm && (
        <Modal title={editId ? 'Edit Amenity' : 'New Amenity'} onClose={() => setShowForm(false)}>
          <form onSubmit={save} className="flex flex-col gap-4">
            <FormError message={error} />

            <FormField label="Name" required>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputClass} />
            </FormField>

            <FormField label="Short Description (optional)">
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2}
                className={textareaClass}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Hours Open (optional)">
                <input type="time" value={form.hours_open} onChange={e => setForm(f => ({ ...f, hours_open: e.target.value }))} className={inputClass} />
              </FormField>
              <FormField label="Hours Close (optional)">
                <input type="time" value={form.hours_close} onChange={e => setForm(f => ({ ...f, hours_close: e.target.value }))} className={inputClass} />
              </FormField>
            </div>

            <FormField label="Age Restriction (optional)">
              <input
                value={form.age_restriction}
                onChange={e => setForm(f => ({ ...f, age_restriction: e.target.value }))}
                placeholder="e.g. Ages 16 and up"
                className={inputClass}
              />
            </FormField>

            <FormField label="Additional Rules (optional)">
              <textarea value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} rows={2} className={textareaClass} />
            </FormField>

            <FormField label="Status">
              <div className="flex gap-2">
                {STATUS_OPTS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, status: opt.value }))}
                    className="flex-1 py-2 rounded-xl font-body font-semibold text-[12px] border transition-colors"
                    style={{
                      background: form.status === opt.value ? opt.bg : 'transparent',
                      color: form.status === opt.value ? opt.color : '#9ca3af',
                      borderColor: form.status === opt.value ? 'transparent' : '#e5e7eb',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Sub-amenity of (optional)">
              <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} className={inputClass}>
                <option value="">None (top-level amenity)</option>
                {topLevel.filter(a => a.id !== editId).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Long Description (optional, shown on detail page)">
              <textarea
                value={form.long_description}
                onChange={e => setForm(f => ({ ...f, long_description: e.target.value }))}
                rows={4}
                className={textareaClass}
              />
            </FormField>

            <FormField label="Photo (optional, shown on detail page)">
              <div className="flex items-center gap-3">
                {(photoFile || form.photo_url) && (
                  <img
                    src={photoFile ? URL.createObjectURL(photoFile) : (amenityPhotoUrl(form.photo_url) ?? undefined)}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                  />
                )}
                <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 font-body text-[13px] cursor-pointer hover:bg-gray-50">
                  <ImageIcon size={15} />
                  {photoFile || form.photo_url ? 'Change photo' : 'Upload photo'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={e => setPhotoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                {(photoFile || form.photo_url) && (
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setForm(f => ({ ...f, photo_url: null })) }}
                    className="font-body text-[12px] text-gray-400 hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>
            </FormField>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl font-body text-[14px] text-gray-600 border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="px-6 py-2.5 rounded-xl font-body font-semibold text-[14px] text-white disabled:opacity-60"
                style={{ background: '#103457' }}
              >
                {uploading ? 'Uploading…' : saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Amenity'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {loading ? <p className="font-body text-gray-400 text-[14px]">Loading…</p> : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {amenities.length === 0 ? (
            <p className="px-5 py-8 font-body text-gray-400 text-[14px] text-center">No amenities yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
                <div className="divide-y divide-gray-100">
                  {topLevel.map(a => (
                    <div key={a.id}>
                      {renderRow(a, false)}
                      {childrenOf(a.id).map(child => renderRow(child, true))}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  )
}

interface SortableAmenityRowProps {
  amenity: Amenity
  indent: boolean
  childCount: number
  onToggleHidden: (a: Amenity) => void
  onEdit: (a: Amenity) => void
  onRemove: (a: Amenity) => void
}

function SortableAmenityRow({ amenity: a, indent, childCount, onToggleHidden, onEdit, onRemove }: SortableAmenityRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: a.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : undefined,
    position: isDragging ? ('relative' as const) : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-4 pr-5 bg-white hover:bg-gray-50 transition-colors">
      <button
        {...attributes}
        {...listeners}
        style={{ marginLeft: indent ? 32 : 8 }}
        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-display font-semibold text-gray-900 text-[14px] truncate">{a.name}</div>
          {a.hidden && (
            <span className="font-body text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">Hidden</span>
          )}
        </div>
        <div className="font-body text-gray-500 text-[12px] mt-0.5">
          {STATUS_OPTS.find(o => o.value === a.status)?.label}
          {a.hours_open && a.hours_close && ` · ${a.hours_open.slice(0, 5)}–${a.hours_close.slice(0, 5)}`}
          {a.age_restriction && ` · ${a.age_restriction}`}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onToggleHidden(a)}
          title={a.hidden ? 'Show' : 'Hide'}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {a.hidden ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
        <button onClick={() => onEdit(a)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <Pencil size={15} />
        </button>
        <ConfirmButton
          icon={Trash2}
          onConfirm={() => onRemove(a)}
          confirmMessage={childCount > 0 ? `Also removes ${childCount} sub-amenity(s)` : undefined}
        />
      </div>
    </div>
  )
}
