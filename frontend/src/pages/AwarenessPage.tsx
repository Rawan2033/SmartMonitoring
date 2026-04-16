import SolarScene from "../components/SolarScene";

export default function AwarenessPage(): JSX.Element {
  return (
    <section className="awareness-page">
      <div className="hero awareness-hero">
        <div className="awareness-hero-text">
          <h2>EDS Awareness</h2>
          <p>Understand EDS and why it improves solar performance without water.</p>
          <div className="awareness-tags">
            <span>Waterless</span>
            <span>Low Maintenance</span>
            <span>Dust-Resilient</span>
          </div>
        </div>
        <div className="awareness-wide-visual">
          <SolarScene className="scene-strip awareness-wide-scene" />
        </div>
      </div>

      <h3 className="section-title">What is EDS?</h3>
      <div className="card-grid-3">
        <article className="info-card awareness-step step-blue">
          <span className="step-id">1</span>
          <strong>Electric Field Activates</strong>
          <p>Transparent electrodes beneath the panel surface generate alternating electrostatic charges.</p>
        </article>
        <article className="info-card awareness-step step-violet">
          <span className="step-id">2</span>
          <strong>Dust Particles Move</strong>
          <p>Charged particles experience force from the electric field and travel across the surface in waves.</p>
        </article>
        <article className="info-card awareness-step step-green">
          <span className="step-id">3</span>
          <strong>Surface Becomes Cleaner</strong>
          <p>Particles roll off the panel edges due to gravity, restoring optimal solar efficiency.</p>
        </article>
      </div>

      <h3 className="section-title">Why It Matters</h3>
      <div className="card-grid-2 awareness-benefits">
        <article className="info-card benefit-card b1">
          <div className="benefit-icon" />
          <div>
            <strong>Waterless Cleaning</strong>
            <p>No water consumption, ideal for arid regions.</p>
          </div>
        </article>
        <article className="info-card benefit-card b2">
          <div className="benefit-icon" />
          <div>
            <strong>Less Manual Maintenance</strong>
            <p>Automatic operation reduces labor costs.</p>
          </div>
        </article>
        <article className="info-card benefit-card b3">
          <div className="benefit-icon" />
          <div>
            <strong>Better Long-term Performance</strong>
            <p>Consistent efficiency without panel wear.</p>
          </div>
        </article>
        <article className="info-card benefit-card b4">
          <div className="benefit-icon" />
          <div>
            <strong>Suitable for Dusty Residential Regions</strong>
            <p>Effective in harsh environmental conditions.</p>
          </div>
        </article>
      </div>

      <h3 className="section-title">Applications</h3>
      <div className="card-grid-3 awareness-apps">
        <article className="info-card app-card">
          <div className="app-visual av1" />
          <strong>Homes & Rooftops</strong>
          <p>Maintains daily output with low owner effort.</p>
        </article>
        <article className="info-card app-card">
          <div className="app-visual av2" />
          <strong>Solar Farms</strong>
          <p>Reduces maintenance cycles across large arrays.</p>
        </article>
        <article className="info-card app-card">
          <div className="app-visual av3" />
          <strong>Desert Installations</strong>
          <p>Performs in high-dust, low-water regions.</p>
        </article>
      </div>

      <h3 className="section-title">EDS vs Alternatives</h3>
      <article className="panel">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Water</th>
                <th>Energy</th>
                <th>Maintenance</th>
                <th>Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Water Cleaning</td><td className="bad">High</td><td className="warn">Medium</td><td className="bad">High</td><td className="bad">Water damage</td></tr>
              <tr><td>Air Jets</td><td className="good">None</td><td className="bad">High</td><td className="warn">Medium</td><td className="warn">Noise pollution</td></tr>
              <tr><td>Chemical Spray</td><td className="warn">Medium</td><td className="good">Low</td><td className="bad">High</td><td className="bad">Chemical residue</td></tr>
              <tr className="highlight"><td>EDS</td><td className="good">None</td><td className="good">Very Low</td><td className="good">Very Low</td><td className="good">Minimal</td></tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

