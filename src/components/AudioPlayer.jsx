import { useRef, useState } from 'react'
import { Play, Pause } from 'lucide-react'
import { fmtDuration } from '../lib'

/** Remounts on a new `src` so playback state always starts clean. */
export default function AudioPlayer(props) {
  return <Player key={props.src} {...props} />
}

function Player({ src, duration = 0, autoPlay = false }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [total, setTotal] = useState(duration)
  const [failed, setFailed] = useState(false)

  const toggle = () => {
    const a = ref.current
    if (!a) return
    if (a.paused) a.play().catch(() => setFailed(true))
    else a.pause()
  }

  return (
    <div className="player">
      <audio
        ref={ref}
        src={src}
        preload="metadata"
        autoPlay={autoPlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setTotal(e.currentTarget.duration)}
        onError={() => setFailed(true)}
      />
      <button className="play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} disabled={failed}>
        {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />}
      </button>
      <div className="bar">
        {failed ? (
          <span style={{ color: 'var(--danger)' }}>Could not load audio. The link may have expired: refresh the page.</span>
        ) : (
          <input
            type="range"
            min="0"
            max={total || 0}
            step="0.05"
            value={Math.min(time, total || 0)}
            onChange={(e) => {
              ref.current.currentTime = Number(e.target.value)
              setTime(Number(e.target.value))
            }}
            aria-label="Seek"
          />
        )}
      </div>
      <div className="time">
        {fmtDuration(time)} / {fmtDuration(total)}
      </div>
    </div>
  )
}
