import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { GibsonResult } from '../lib/gibson'
import { formatOneDecimal, formatThreeDecimals } from '../lib/format'

interface ResultPanelProps {
  result: GibsonResult
}

export function ResultPanel({ result }: ResultPanelProps): JSX.Element {
  if (result.kind === 'invalid') {
    return (
      <section className="result-panel" aria-live="polite">
        <div className="result-header">
          <p className="section-kicker">Results</p>
          <h2>Final pipetting mix</h2>
        </div>
        <div className="message-list error-list">
          {result.errors.map((error) => (
            <p key={error}>
              <AlertTriangle size={16} aria-hidden="true" />
              {error}
            </p>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="result-panel" aria-live="polite">
      <div className="result-header">
        <p className="section-kicker">Results</p>
        <h2>Final pipetting mix</h2>
      </div>

      <div className="final-callout">
        <div>
          <span>DNA volume</span>
          <strong>{formatOneDecimal(result.totalDnaVolumeUl)} µL</strong>
        </div>
        <div>
          <span>UPW</span>
          <strong>{formatOneDecimal(result.upwVolumeUl)} µL</strong>
        </div>
        <div>
          <span>Total reaction</span>
          <strong>{formatOneDecimal(result.totalReactionVolumeUl)} µL</strong>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Segment</th>
              <th>Role</th>
              <th>pmol</th>
              <th>ng</th>
              <th>µL to add</th>
            </tr>
          </thead>
          <tbody>
            {result.parts.map((part) => (
              <tr key={part.id}>
                <td>{part.name}</td>
                <td>{part.role}</td>
                <td>{formatThreeDecimals(part.targetPmol)}</td>
                <td>{formatOneDecimal(part.weightNg)}</td>
                <td className="volume-cell">{formatOneDecimal(part.volumeUl)}</td>
              </tr>
            ))}
            {result.upwVolumeUl > 0.000001 ? (
              <tr>
                <td>UPW</td>
                <td>water</td>
                <td>-</td>
                <td>-</td>
                <td className="volume-cell">{formatOneDecimal(result.upwVolumeUl)}</td>
              </tr>
            ) : null}
            <tr>
              <td>Gibson Assembly Mix</td>
              <td>mix</td>
              <td>-</td>
              <td>-</td>
              <td className="volume-cell">{formatOneDecimal(result.settings.gibsonMixVolumeUl)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="calc-steps">
        <h3>Calculation steps</h3>
        <ol>
          <li>pmol/µL = concentration / (length × 0.65)</li>
          <li>
            Total insert pmol = {formatOneDecimal(result.settings.insertExcessRatio)} × total
            backbone pmol.
          </li>
          <li>Insert pmol target is split equally across insert parts.</li>
          <li>
            Volumes are scaled to fill {formatOneDecimal(result.settings.maxDnaInputVolumeUl)} µL
            DNA input volume.
          </li>
        </ol>
      </div>

      {result.warnings.length > 0 ? (
        <div className="message-list warning-list">
          {result.warnings.map((warning) => (
            <p key={warning}>
              <AlertTriangle size={16} aria-hidden="true" />
              {warning}
            </p>
          ))}
        </div>
      ) : (
        <div className="message-list ok-list">
          <p>
            <CheckCircle2 size={16} aria-hidden="true" />
            No protocol warnings for the current inputs.
          </p>
        </div>
      )}
    </section>
  )
}
