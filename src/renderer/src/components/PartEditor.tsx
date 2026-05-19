import { Plus, Trash2 } from 'lucide-react'
import { NumberField } from './NumberField'
import type { DnaPartInput, DnaRole } from '../lib/gibson'

interface PartEditorProps {
  role: DnaRole
  parts: DnaPartInput[]
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, part: DnaPartInput) => void
}

export function PartEditor({ role, parts, onAdd, onRemove, onChange }: PartEditorProps): JSX.Element {
  const label = role === 'backbone' ? 'Backbone' : 'Insert'

  return (
    <div className="part-editor">
      <div className="part-editor-header">
        <div>
          <h2>{label} parts</h2>
          <p>{label}s require length and concentration for molar calculation.</p>
        </div>
        <button type="button" className="secondary-button" onClick={onAdd}>
          <Plus size={16} aria-hidden="true" />
          Add {role}
        </button>
      </div>

      <div className="part-list">
        {parts.map((part, index) => (
          <div className="part-row" key={part.id}>
            <div className="part-row-title">
              <strong>{part.name || `${label} ${index + 1}`}</strong>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
                onClick={() => onRemove(part.id)}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>

            <label className="field">
              <span className="field-label">{label} name</span>
              <span className="field-control">
                <input
                  aria-label={`${label} name`}
                  type="text"
                  value={part.name}
                  onChange={(event) => onChange(part.id, { ...part, name: event.currentTarget.value })}
                />
              </span>
            </label>

            <NumberField
              label={`${label} length bp`}
              value={part.lengthBp}
              integer
              min={1}
              step={1}
              suffix="bp"
              onChange={(value) => onChange(part.id, { ...part, lengthBp: value })}
            />

            <NumberField
              label={`${label} concentration ng/µL`}
              value={part.concentrationNgPerUl}
              min={0.1}
              step={0.1}
              suffix="ng/µL"
              onChange={(value) =>
                onChange(part.id, { ...part, concentrationNgPerUl: value })
              }
            />
          </div>
        ))}
      </div>
    </div>
  )
}
