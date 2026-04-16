import { useMemo, useState } from "react";
import SolarScene from "../components/SolarScene";

type HubKey = "sensors" | "dust" | "safety" | "resources";

type HubCard = {
  key: HubKey;
  title: string;
  description: string;
};

const cards: HubCard[] = [
  { key: "sensors", title: "Sensors We Use", description: "Learn about the sensors that power our monitoring system." },
  { key: "dust", title: "Dust Types", description: "Understanding different dust types and their impact." },
  { key: "safety", title: "Safety & Maintenance", description: "Best practices for safe operation and upkeep." },
  { key: "resources", title: "Technical Resources", description: "Documentation, guides, and research references." }
];

export default function HubPage(): JSX.Element {
  const [active, setActive] = useState<HubKey | null>(null);

  const modalTitle = useMemo(() => cards.find((c) => c.key === active)?.title ?? "EDS Hub", [active]);

  return (
    <section>
      <div className="page-head hub-head animate-in">
        <div>
          <h2>EDS Hub</h2>
          <p>Technical hub: sensors, dust science, humidity impact, and safety</p>
        </div>
      </div>
      <div className="hub-wide-visual animate-in" style={{ animationDelay: "80ms" }}>
        <SolarScene className="scene-strip hub-wide-scene" />
      </div>

      <div className="card-grid-2">
        {cards.map((card, index) => (
          <button
            key={card.key}
            className="info-card hub hub-btn animate-in"
            style={{ animationDelay: `${index * 80}ms` }}
            type="button"
            onClick={() => setActive(card.key)}
          >
            <strong>{card.title}</strong>
            <p>{card.description}</p>
            <span className="hub-open">Open</span>
          </button>
        ))}
      </div>

      {active && (
        <div className="hub-modal-backdrop" onClick={() => setActive(null)}>
          <article className="hub-modal modal-enter" onClick={(e) => e.stopPropagation()}>
            <header className="hub-modal-head">
              <h3>{modalTitle}</h3>
              <button type="button" className="hub-close" onClick={() => setActive(null)}>
                x
              </button>
            </header>

            {active === "sensors" && (
              <div className="hub-modal-content stack-gap">
                <article className="hub-detail-card">
                  <div className="hub-detail-top">
                    <img src="/images/sensors/tcrt5000.svg" alt="TCRT5000 reflective sensor module" className="sensor-img" />
                    <div>
                      <h4>TCRT5000</h4>
                      <p className="sub">IR Reflective Sensor</p>
                    </div>
                    <span className="state-pill">Active</span>
                  </div>
                  <div className="hub-detail-grid">
                    <div><small>What it measures</small><p>Dust accumulation</p></div>
                    <div><small>Typical range</small><p>0-100% reflectivity</p></div>
                    <div><small>Why it matters</small><p>Detects dust buildup on panel surface by measuring light reflection changes.</p></div>
                    <div><small>Used in dashboard KPI</small><p>Soiling / Dust Index KPI</p></div>
                  </div>
                </article>

                <article className="hub-detail-card">
                  <div className="hub-detail-top">
                    <img src="/images/sensors/sht31.svg" alt="SHT31 temperature and humidity sensor board" className="sensor-img" />
                    <div>
                      <h4>SHT31</h4>
                      <p className="sub">Temperature & Humidity Sensor</p>
                    </div>
                    <span className="state-pill">Active</span>
                  </div>
                  <div className="hub-detail-grid">
                    <div><small>What it measures</small><p>Temperature and humidity</p></div>
                    <div><small>Typical range</small><p>Temp: -40C to 125C | Humidity: 0-100% RH</p></div>
                    <div><small>Why it matters</small><p>Explains moisture and heat conditions that influence dust adhesion and efficiency.</p></div>
                    <div><small>Used in dashboard KPI</small><p>Temperature and Humidity cards</p></div>
                  </div>
                </article>
              </div>
            )}

            {active === "dust" && (
              <div className="hub-modal-content stack-gap">
                <article className="hub-detail-card dust fine">
                  <h4>Fine Dust</h4>
                  <p className="sub">Particles less than 10um diameter</p>
                  <div className="hub-detail-grid">
                    <div><small>Impact on solar output</small><p>Creates uniform coating that reduces light transmission.</p></div>
                    <div><small>Conditions that worsen it</small><p>Worsens in dry and windy conditions.</p></div>
                  </div>
                </article>

                <article className="hub-detail-card dust coarse">
                  <h4>Sand / Coarse Dust</h4>
                  <p className="sub">Particles greater than 50um diameter</p>
                  <div className="hub-detail-grid">
                    <div><small>Impact on solar output</small><p>Creates localized shadowing and can scratch panel surface.</p></div>
                    <div><small>Conditions that worsen it</small><p>Common during sandstorms.</p></div>
                  </div>
                </article>
              </div>
            )}

            {active === "safety" && (
              <div className="hub-modal-content stack-gap">
                <section className="hub-detail-card safety-zone">
                  <h4>Safety Checklist</h4>
                  <div className="check-list">
                    <p><span>1</span>Inspect wiring and electrodes for damage or corrosion.</p>
                    <p><span>2</span>Avoid moisture during maintenance. Ensure panels are dry.</p>
                    <p><span>3</span>Use insulated gloves when servicing the system.</p>
                    <p><span>4</span>Perform weekly inspection and monthly sensor calibration.</p>
                  </div>
                </section>

                <section className="hub-detail-card">
                  <h4>Common Issues & Solutions</h4>
                  <div className="issue-grid">
                    <div>
                      <small>Sensor readings inconsistent</small>
                      <p>Check connector stability and re-run baseline calibration.</p>
                    </div>
                    <div>
                      <small>Cleaning not triggered</small>
                      <p>Verify dust threshold values and event logic in settings.</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {active === "resources" && (
              <div className="hub-modal-content stack-gap">
                <article className="hub-detail-card">
                  <h4>Technical Resources</h4>
                  <div className="issue-grid">
                    <div>
                      <small>System Documentation</small>
                      <p>Sensor specs, wiring diagrams, and API contracts.</p>
                    </div>
                    <div>
                      <small>Research References</small>
                      <p>Dust behavior, electrostatic cleaning, and panel performance studies.</p>
                    </div>
                  </div>
                </article>
              </div>
            )}
          </article>
        </div>
      )}
    </section>
  );
}
