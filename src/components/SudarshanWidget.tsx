import type { FormEvent } from 'react'
import './SudarshanWidget.css'

export interface WidgetPackage {
  id: string
  title: string
  price: string
  note: string
}

export interface WidgetIntegration {
  via: string
  service: string
  sheetId: string
  worksheet: string
  fields: string[]
}

export interface WidgetProps {
  title: string
  greet1: string
  greet2: string
  ctaRegister: string
  packages: WidgetPackage[]
  packageOptions: Array<{ label: string; value: string }>
  selectedPackage?: string
  integration?: WidgetIntegration
  onPackagePick: (packageId: string) => void
  onLeadSubmit: (payload: Record<string, string>) => void
  onLeadReset: () => void
}

const SudarshanWidget = ({
  title,
  greet1,
  greet2,
  ctaRegister,
  packages,
  selectedPackage,
  packageOptions,
  integration,
  onPackagePick,
  onLeadSubmit,
  onLeadReset,
}: WidgetProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const payload = Object.fromEntries(data.entries()) as Record<string, string>
    onLeadSubmit(payload)
  }

  const handleReset = () => {
    onLeadReset()
  }

  return (
    <div className="sudarshan-widget" role="group" aria-label="Sudarshan offers and lead capture">
      <header className="sudarshan-widget__header">
        <div className="sudarshan-widget__intro">
          <h3>{title}</h3>
          <p>{greet1}</p>
          <p className="sudarshan-widget__muted">{greet2}</p>
        </div>
        <button
          type="button"
          className="sudarshan-widget__spark-button"
          onClick={() => onPackagePick('tech-swaraj')}
        >
          <span aria-hidden="true">✨</span>
          {ctaRegister}
        </button>
      </header>

      <section className="sudarshan-widget__pack-section" aria-label="Popular growth packs">
        <ul className="sudarshan-widget__pack-list">
          {packages.map((pack) => (
            <li key={pack.id} className="sudarshan-widget__pack-card">
              <div className="sudarshan-widget__pack-summary">
                <span className="sudarshan-widget__pack-title">{pack.title}</span>
                <span className="sudarshan-widget__pack-price">{pack.price}</span>
              </div>
              <p className="sudarshan-widget__pack-note">{pack.note}</p>
              <button
                type="button"
                className="sudarshan-widget__pick-button"
                onClick={() => onPackagePick(pack.id)}
              >
                Select this pack
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="sudarshan-widget__form-section" aria-label="Lead capture form">
        <h4>Get a quote</h4>
        <form className="sudarshan-widget__form" onSubmit={handleSubmit} onReset={handleReset}>
          <label className="sudarshan-widget__field">
            Package (optional)
            <select
              name="lead.package"
              value={selectedPackage ?? ''}
              onChange={(event) => onPackagePick(event.target.value)}
            >
              <option value="">Choose a package</option>
              {packageOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="sudarshan-widget__field">
            Name
            <input name="lead.name" placeholder="Your name" required />
          </label>

          <label className="sudarshan-widget__field">
            Phone
            <input name="lead.phone" placeholder="Phone number" inputMode="tel" required />
          </label>

          <label className="sudarshan-widget__field">
            Business type
            <input name="lead.businessType" placeholder="Business type (e.g., Kirana)" />
          </label>

          <label className="sudarshan-widget__field">
            City
            <input name="lead.city" placeholder="City" />
          </label>

          <div className="sudarshan-widget__form-actions">
            <button type="submit" className="sudarshan-widget__submit">
              Get quote
            </button>
            <button type="reset" className="sudarshan-widget__reset">
              Clear
            </button>
          </div>
        </form>

        {integration && (
          <aside className="sudarshan-widget__integration" aria-label="Automation destination">
            <span className="sudarshan-widget__integration-badge">{integration.service}</span>
            <p>
              Syncing to {integration.worksheet} in {integration.sheetId}
            </p>
          </aside>
        )}
      </section>
    </div>
  )
}

export default SudarshanWidget
