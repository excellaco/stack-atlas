import { useEffect, useState } from 'react'


export default function CatalogItemForm({ item, description: initialDesc, categories, types, onSave, onCancel }) {
  const [id, setId] = useState(item?.id || '')
  const [name, setName] = useState(item?.name || '')
  const [category, setCategory] = useState(item?.category || categories[0]?.id || '')
  const [type, setType] = useState(item?.type || types[0] || '')
  const [description, setDescription] = useState(initialDesc || '')
  const [synonyms, setSynonyms] = useState((item?.synonyms || []).join(', '))
  const [parents, setParents] = useState((item?.parents || []).join(', '))
  const [commonWith, setCommonWith] = useState((item?.commonWith || []).join(', '))
  const [tags, setTags] = useState((item?.tags || []).join(', '))

  useEffect(() => {
    if (!item && name) {
      setId(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }, [name, item])

  const handleSubmit = (e) => {
    e.preventDefault()
    const parsed = {
      id: id.trim(),
      name: name.trim(),
      category,
      type,
      ...(synonyms.trim() ? { synonyms: synonyms.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      ...(parents.trim() ? { parents: parents.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      ...(commonWith.trim() ? { commonWith: commonWith.split(',').map((s) => s.trim()).filter(Boolean) } : {}),
      ...(tags.trim() ? { tags: tags.split(',').map((s) => s.trim()).filter(Boolean) } : {})
    }
    onSave(parsed, description.trim())
  }

  return (
    <form className="catalog-form" onSubmit={handleSubmit}>
      <input placeholder="ID" value={id} onChange={(e) => setId(e.target.value)} required />
      <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        {types.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      <input placeholder="Synonyms (comma-separated)" value={synonyms} onChange={(e) => setSynonyms(e.target.value)} />
      <input placeholder="Parents (comma-separated IDs)" value={parents} onChange={(e) => setParents(e.target.value)} />
      <input placeholder="Common with (comma-separated IDs)" value={commonWith} onChange={(e) => setCommonWith(e.target.value)} />
      <input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
      <div className="catalog-form-actions">
        <button type="submit" className="primary" disabled={!id.trim() || !name.trim()}>Save</button>
        <button type="button" className="ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
