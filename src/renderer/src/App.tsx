import { FileDown, FlaskConical, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NumberField } from './components/NumberField'
import { PartEditor } from './components/PartEditor'
import { PrintWorksheet } from './components/PrintWorksheet'
import { ResultPanel } from './components/ResultPanel'
import {
  calculateGibson,
  defaultReactionSettings,
  type DnaPartInput,
  type DnaRole,
  type ReactionSettings
} from './lib/gibson'

const defaultBackbones: DnaPartInput[] = [
  {
    id: 'backbone-1',
    name: 'Backbone 1',
    lengthBp: 5000,
    concentrationNgPerUl: 50
  }
]

const defaultInserts: DnaPartInput[] = [
  {
    id: 'insert-1',
    name: 'Insert 1',
    lengthBp: 1000,
    concentrationNgPerUl: 20
  }
]

export default function App(): JSX.Element {
  const [settings, setSettings] = useState<ReactionSettings>(defaultReactionSettings)
  const [backbones, setBackbones] = useState<DnaPartInput[]>(defaultBackbones)
  const [inserts, setInserts] = useState<DnaPartInput[]>(defaultInserts)
  const [reactionName, setReactionName] = useState('Gibson reaction')

  const result = useMemo(
    () => calculateGibson({ settings, backbones, inserts }),
    [settings, backbones, inserts]
  )

  return (
    <>
      <main className="app-shell screen-only">
        <header className="app-header">
          <div>
            <p className="eyebrow">Gibson Assembly</p>
            <h1>Gibson Assembly Calculator</h1>
            <p className="lede">
              Optimize DNA volumes for the fragment mix before adding Gibson Assembly Mix.
            </p>
          </div>
          <div className="header-actions">
            <div className="reaction-badge">
              <FlaskConical size={18} aria-hidden="true" />
              10.0 µL default reaction
            </div>
            <button type="button" className="primary-button" onClick={handlePrint}>
              <Printer size={16} aria-hidden="true" />
              Print worksheet
            </button>
            <button type="button" className="secondary-button" onClick={handleSavePdf}>
              <FileDown size={16} aria-hidden="true" />
              Save PDF
            </button>
          </div>
        </header>

        <div className="workspace">
          <div className="input-column">
            <section className="protocol-section">
              <div className="section-heading">
                <span className="step-number">1</span>
                <div>
                  <p className="section-kicker">Reaction setup</p>
                  <h2>Volumes and ratio</h2>
                </div>
              </div>

              <div className="settings-grid">
                <label className="field">
                  <span className="field-label">Reaction name</span>
                  <span className="field-control">
                    <input
                      type="text"
                      value={reactionName}
                      onChange={(event) => setReactionName(event.currentTarget.value)}
                    />
                  </span>
                </label>
                <NumberField
                  label="Final DNA volume"
                  value={settings.finalDnaVolumeUl}
                  min={0.1}
                  step={0.1}
                  suffix="µL"
                  onChange={(value) => updateSettings({ finalDnaVolumeUl: value })}
                />
                <NumberField
                  label="Max DNA input volume"
                  value={settings.maxDnaInputVolumeUl}
                  min={0.1}
                  step={0.1}
                  suffix="µL"
                  onChange={(value) => updateSettings({ maxDnaInputVolumeUl: value })}
                />
                <NumberField
                  label="Gibson mix volume"
                  value={settings.gibsonMixVolumeUl}
                  min={0.1}
                  step={0.1}
                  suffix="µL"
                  onChange={(value) => updateSettings({ gibsonMixVolumeUl: value })}
                />
                <NumberField
                  label="Insert excess ratio"
                  value={settings.insertExcessRatio}
                  min={0.1}
                  step={0.1}
                  suffix="x"
                  onChange={(value) => updateSettings({ insertExcessRatio: value })}
                />
                <NumberField
                  label="Pipetting warning threshold"
                  value={settings.pipettingWarningThresholdUl}
                  min={0.1}
                  step={0.1}
                  suffix="µL"
                  onChange={(value) => updateSettings({ pipettingWarningThresholdUl: value })}
                />
              </div>
            </section>

            <section className="protocol-section">
              <div className="section-heading">
                <span className="step-number">2</span>
                <PartEditor
                  role="backbone"
                  parts={backbones}
                  onAdd={() =>
                    setBackbones((parts) => [...parts, createPart('backbone', parts.length)])
                  }
                  onRemove={(id) => setBackbones((parts) => parts.filter((part) => part.id !== id))}
                  onChange={(id, part) => updatePart('backbone', id, part)}
                />
              </div>
            </section>

            <section className="protocol-section">
              <div className="section-heading">
                <span className="step-number">3</span>
                <PartEditor
                  role="insert"
                  parts={inserts}
                  onAdd={() => setInserts((parts) => [...parts, createPart('insert', parts.length)])}
                  onRemove={(id) => setInserts((parts) => parts.filter((part) => part.id !== id))}
                  onChange={(id, part) => updatePart('insert', id, part)}
                />
              </div>
            </section>
          </div>

          <ResultPanel result={result} />
        </div>
      </main>
      <PrintWorksheet result={result} reactionName={reactionName} />
    </>
  )

  function updateSettings(patch: Partial<ReactionSettings>): void {
    setSettings((current) => ({ ...current, ...patch }))
  }

  function updatePart(role: DnaRole, id: string, part: DnaPartInput): void {
    const updater = (parts: DnaPartInput[]): DnaPartInput[] =>
      parts.map((current) => (current.id === id ? part : current))

    if (role === 'backbone') {
      setBackbones(updater)
    } else {
      setInserts(updater)
    }
  }

  function handlePrint(): void {
    if (window.gibsonDesktop) {
      void window.gibsonDesktop.print()
      return
    }

    window.print()
  }

  function handleSavePdf(): void {
    if (window.gibsonDesktop) {
      void window.gibsonDesktop.savePdf()
      return
    }

    window.print()
  }
}

function createPart(role: DnaRole, index: number): DnaPartInput {
  const number = index + 1
  const label = role === 'backbone' ? 'Backbone' : 'Insert'

  return {
    id: `${role}-${number}-${Date.now()}`,
    name: `${label} ${number}`,
    lengthBp: role === 'backbone' ? 5000 : 1000,
    concentrationNgPerUl: role === 'backbone' ? 50 : 20
  }
}
