type SolarSceneProps = {
  className?: string;
};

export default function SolarScene({ className = "" }: SolarSceneProps): JSX.Element {
  return (
    <div className={`mini-visual ${className}`.trim()}>
      <div className="scene-sky" />
      <span className="cloud c1" />
      <span className="cloud c2" />
      <span className="cloud c3" />
      <div className="scene-sun" />
      <div className="scene-hill hill-a" />
      <div className="scene-hill hill-b" />
      <div className="scene-panel-wrap">
        <div className="scene-panel">
          <div className="panel-grid-overlay" />
          <span className="dirt dirt-1" />
          <span className="dirt dirt-2" />
          <span className="dirt dirt-3" />
          <span className="dirt dirt-4" />
          <span className="dirt dirt-5" />
          <span className="spark" />
        </div>
      </div>
    </div>
  );
}
