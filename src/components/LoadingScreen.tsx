import { useEffect, useState, useRef } from 'react';
import { useTranslation } from '../i18n';
import '../styles/loading.css';

interface Props {
  onComplete: () => void;
}

/**
 * Full-screen cinematic loading overlay.
 * Opening: gold curtains slide in + content reveals with zoom/blur.
 * Closing: content lifts away, then the two gold panels split apart
 * like theater curtains to reveal the site.
 */
export default function LoadingScreen({ onComplete }: Props) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    done.current = false;
    const startTime = Date.now();
    const total = 800; // ms total pour une transition fluide et réactive

    const id = setInterval(() => {
      if (done.current) return;
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / total) * 100), 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(id);
        done.current = true;
        // Laisse le temps au 100% de s'afficher puis ouvre le rideau
        setTimeout(() => setFading(true), 150);
        setTimeout(() => onComplete(), 600);
      }
    }, 25);

    return () => clearInterval(id);
  }, [onComplete]);

  return (
    <div
      className={`loading-screen ${fading ? 'loading-screen--fade' : ''}`}
      aria-hidden={fading}
    >
      <div className="loading-screen__content">
        <img
          src="/logo.png"
          alt={t('loading')}
          className="loading-screen__logo"
        />
        <span className="loading-screen__pct">
          {progress}
          <span className="loading-screen__pct-sign">%</span>
        </span>
        <span className="loading-screen__tag">{t('loading')}</span>
      </div>
      <div className="loading-screen__bar">
        <div
          className="loading-screen__fill"
          style={{ width: `${progress}%` }}
        />
        <div className="loading-screen__bar-glow" style={{ left: `${progress}%` }} />
      </div>
    </div>
  );
}
