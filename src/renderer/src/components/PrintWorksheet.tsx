import type { GibsonResult } from '../lib/gibson'
import { formatOneDecimal, formatThreeDecimals } from '../lib/format'

interface PrintWorksheetProps {
  result: GibsonResult
  reactionName: string
}

function formatPrintDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

export function PrintWorksheet({ result, reactionName }: PrintWorksheetProps): JSX.Element {
  const date = formatPrintDate(new Date())

  return (
    <section className="print-only print-sheet" aria-label="Printable Gibson worksheet">
      <header className="print-header">
        <div>
          <h1>Gibson Assembly Reaction Worksheet</h1>
          <p>{reactionName.trim() || 'Untitled reaction'}</p>
        </div>
        <div>
          <strong>Date</strong>
          <span>{date}</span>
        </div>
      </header>

      {result.kind === 'invalid' ? (
        <div className="print-block">
          <h2>Missing required values</h2>
          <ul>
            {result.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="print-grid">
            <div className="print-block">
              <h2>Reaction setup</h2>
              <dl>
                <div>
                  <dt>DNA fragments</dt>
                  <dd>{formatOneDecimal(result.settings.finalDnaVolumeUl)} µL</dd>
                </div>
                <div>
                  <dt>Max DNA input</dt>
                  <dd>{formatOneDecimal(result.settings.maxDnaInputVolumeUl)} µL</dd>
                </div>
                <div>
                  <dt>Gibson mix</dt>
                  <dd>{formatOneDecimal(result.settings.gibsonMixVolumeUl)} µL</dd>
                </div>
                <div>
                  <dt>Insert excess</dt>
                  <dd>{formatOneDecimal(result.settings.insertExcessRatio)}x</dd>
                </div>
              </dl>
            </div>

            <div className="print-block">
              <h2>Quick formula</h2>
              <p>pmol/µL = concentration / (length × 0.65)</p>
              <p>Total insert pmol = insert excess × total backbone pmol.</p>
            </div>
          </div>

          <div className="print-block">
            <h2>DNA parts</h2>
            <table>
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Role</th>
                  <th>bp</th>
                  <th>ng/µL</th>
                  <th>pmol</th>
                  <th>ng</th>
                  <th>µL</th>
                </tr>
              </thead>
              <tbody>
                {result.parts.map((part) => (
                  <tr key={part.id}>
                    <td>{part.name}</td>
                    <td>{part.role}</td>
                    <td>{part.lengthBp}</td>
                    <td>{formatOneDecimal(part.concentrationNgPerUl)}</td>
                    <td>{formatThreeDecimals(part.targetPmol)}</td>
                    <td>{formatOneDecimal(part.weightNg)}</td>
                    <td>{formatOneDecimal(part.volumeUl)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="print-block">
            <h2>Final pipetting table</h2>
            <table>
              <tbody>
                {result.parts.map((part) => (
                  <tr key={`pipette-${part.id}`}>
                    <th>{part.name}</th>
                    <td>{formatOneDecimal(part.volumeUl)} µL</td>
                  </tr>
                ))}
                <tr>
                  <th>UPW</th>
                  <td>{formatOneDecimal(result.upwVolumeUl)} µL</td>
                </tr>
                <tr>
                  <th>Gibson Assembly Mix</th>
                  <td>{formatOneDecimal(result.settings.gibsonMixVolumeUl)} µL</td>
                </tr>
                <tr className="print-total-row">
                  <th>Total reaction</th>
                  <td>{formatOneDecimal(result.totalReactionVolumeUl)} µL</td>
                </tr>
              </tbody>
            </table>
          </div>

          {result.warnings.length > 0 ? (
            <div className="print-block print-warnings">
              <h2>Warnings</h2>
              <ul>
                {result.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
