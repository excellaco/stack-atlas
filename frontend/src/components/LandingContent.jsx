import "./LandingContent.css";

export default function LandingContent() {
  return (
    <div className="landing-content">
      <h1>Welcome to Stack Atlas</h1>
      <p>Select a project from the sidebar to view its technology stack.</p>
      <div className="landing-steps">
        <div className="landing-step">
          <span className="landing-step-num">1</span>
          <span>Choose a project from the tree on the left.</span>
        </div>
        <div className="landing-step">
          <span className="landing-step-num">2</span>
          <span>Review the standardized stack in the view pane.</span>
        </div>
        <div className="landing-step">
          <span className="landing-step-num">3</span>
          <span>Switch to edit mode to modify selections.</span>
        </div>
      </div>
    </div>
  );
}
