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

interface SubAmenityDraft {
  key: string
  id: string | null
  name: string
}

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
  subAmenities: SubAmenityDraft[]
}

const BLANK: FormState = {
  name: '', description: '', status: 'open', hours_open: '', hours_close: '',
  age_restriction: '', rules: '', parent_id: '', long_description: '', photo_url: null,
  subAmenities: [],
}

export function AdminAmenitiesPage() {
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(BLANK)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [attachSelection, setAttachSelection] = useState('')
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
    setAttachSelection('')
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
      subAmenities: childrenOf(a.id).map(c => ({ key: c.id, id: c.id, name: c.name })),
    })
    setPhotoFile(null)
    setAttachSelection('')
    setEditId(a.id)
    setShowForm(true)
  }

  const addSubAmenity = () => {
    setForm(f => ({ ...f, subAmenities: [...f.subAmenities, { key: crypto.randomUUID(), id: null, name: '' }] }))
  }
  const attachExisting = (id: string) => {
    const existing = amenities.find(a => a.id === id)
    if (!existing) return
    setForm(f => ({ ...f, subAmenities: [...f.subAmenities, { key: existing.id, id: existing.id, name: existing.name }] }))
    setAttachSelection('')
  }
  const renameSubAmenity = (key: string, name: string) => {
    setForm(f => ({ ...f, subAmenities: f.subAmenities.map(s => (s.key === key ? { ...s, name } : s)) }))
  }
  const removeSubAmenity = (key: string) => {
    setForm(f => ({ ...f, subAmenities: f.subAmenities.filter(s => s.key !== key) }))
  }

  const save = async (e: FormEvent) => {
    e.preventDefault()

    // A group only makes sense with 2+ sub-amenities -- with exactly one,
    // it should just be a single flat amenity instead.
    if (!form.parent_id && form.subAmenities.length === 1) {
      setError('Add at least one more sub-amenity, or remove it — a group needs at least two.')
      return
    }
    if (form.subAmenities.some(s => !s.name.trim())) {
      setError('Sub-amenity names can\'t be empty.')
      return
    }

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

    let parentId = editId
    if (editId) {
      const { ok } = await mutate(() => supabase.from('amenities').update(payload).eq('id', editId))
      if (!ok) return
    } else {
      const { data, ok } = await mutate(() =>
        supabase.from('amenities').insert({ ...payload, hidden: false, sort_order: amenities.length }).select().single()
      )
      if (!ok) return
      parentId = (data as Amenity | null)?.id ?? null
    }

    // Reconcile inline sub-amenities -- only meaningful when this amenity is
    // (or is becoming) a top-level one. An entry can be a brand-new
    // sub-amenity (no id) or an existing amenity attached from the picker
    // (has an id but wasn't necessarily a child before) -- either way it
    // gets parent_id set to this parent. Anything removed from the list is
    // *detached* (parent_id -> null), not deleted -- removing something
    // from a group shouldn't destroy it, especially since it may have been
    // a real standalone amenity before being attached here. A real delete
    // is still available via that item's own trash icon in the main list.
    if (!form.parent_id && parentId) {
      const existingChildren = editId ? childrenOf(editId) : []
      const keptIds = new Set(form.subAmenities.filter(s => s.id).map(s => s.id))
      const removed = existingChildren.filter(c => !keptIds.has(c.id))

      if (removed.length > 0) {
        const { error: detachError } = await supabase.from('amenities').update({ parent_id: null }).in('id', removed.map(c => c.id))
        if (detachError) { setError(detachError.message); load(); return }
      }
      for (const sub of form.subAmenities) {
        const { error: subError } = sub.id
          ? await supabase.from('amenities').update({ name: sub.name, parent_id: parentId }).eq('id', sub.id)
          : await supabase.from('amenities').insert({
              name: sub.name, parent_id: parentId, status: 'open', hidden: false, sort_order: amenities.length,
            })
        if (subError) { setError(subError.message); load(); return }
      }
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
              <select
                value={form.parent_id}
                onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                disabled={form.subAmenities.length > 0}
                className={inputClass}
                style={form.subAmenities.length > 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                <option value="">None (top-level amenity)</option>
                {topLevel.filter(a => a.id !== editId).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {form.subAmenities.length > 0 && (
                <p className="font-body text-[11px] text-gray-400 mt-1.5">
                  This amenity has sub-amenities of its own, so it can't also be a sub-amenity of something else.
                </p>
              )}
            </FormField>

            {!form.parent_id && (
              <FormField label="Sub-Amenities (optional — needs at least 2, e.g. individual pools under a &quot;Pools&quot; group)">
                <div className="flex flex-col gap-2">
                  {form.subAmenities.map(sub => (
                    <div key={sub.key} className="flex gap-2 items-center">
                      <input
                        value={sub.name}
                        onChange={e => renameSubAmenity(sub.key, e.target.value)}
                        placeholder="Sub-amenity name"
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => removeSubAmenity(sub.key)}
                        className="p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSubAmenity}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 font-body text-[13px] hover:bg-gray-50 transition-colors self-start"
                  >
                    <Plus size={14} /> Add Sub-Amenity
                  </button>

                  {(() => {
                    const attachedIds = new Set(form.subAmenities.map(s => s.id).filter(Boolean))
                    const candidates = topLevel.filter(a => a.id !== editId && !attachedIds.has(a.id))
                    if (candidates.length === 0) return null
                    return (
                      <div className="flex gap-2 items-center mt-1">
                        <select
                          value={attachSelection}
                          onChange={e => setAttachSelection(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Or attach an existing amenity…</option>
                          {candidates.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!attachSelection}
                          onClick={() => attachExisting(attachSelection)}
                          className="px-3 py-2.5 rounded-lg font-body text-[13px] text-white disabled:opacity-40 flex-shrink-0"
                          style={{ background: '#103457' }}
                        >
                          Attach
                        </button>
                      </div>
                    )
                  })()}
                </div>
              </FormField>
            )}

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
