import BlurryBlob from "../components/animata/background/blurry-blob";
import RippleButton from "../components/animata/button/ripple-button";
import SlideArrowButton from "../components/animata/button/slide-arrow-button";
import Reveal from "../components/animata/text/reveal";
import LeaderboardPage from "./LeaderboardPage";

interface LandingPageProps {
  onJoin: () => void;
  onLogin: () => void;
  signupsOpen: boolean;
}

export default function LandingPage({ onJoin, onLogin, signupsOpen }: LandingPageProps) {
  return (
    <div className="admin-tab-content">
      <div className="card landing-cta-card relative overflow-hidden">
        <BlurryBlob />
        <Reveal>
          <h2 className="section-title">Ready to take part?</h2>
          <p className="section-subtitle">
            {signupsOpen
              ? "Join with a username and your RMIT email to get your own board, or log back in if you've already joined."
              : "Signups are closed right now - if you've already joined, log back in below."}
          </p>
        </Reveal>
        <Reveal delayMs={120} className="landing-cta-buttons">
          {signupsOpen && <RippleButton onClick={onJoin}>Join the Challenge</RippleButton>}
          <SlideArrowButton text="Log in" onClick={onLogin} />
        </Reveal>
      </div>

      <LeaderboardPage />
    </div>
  );
}
