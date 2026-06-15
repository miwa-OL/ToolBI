import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, RefreshCw, X } from 'lucide-react'
import {
  applyUpdate,
  checkForUpdate,
  getProgress,
  startDownload,
} from '@/api/updater'
import type { UpdateInfo } from '@/api/updater'

type Phase = 'hidden' | 'available' | 'downloading' | 'ready' | 'applying'

export function UpdateBanner() {
  const [phase, setPhase] = useState<Phase>('hidden')
  const [visible, setVisible] = useState(false)
  const [info, setInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState(0)
  const poll = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  useEffect(() => {
    checkForUpdate()
      .then((r) => {
        if (r.update_available && r.download_url) {
          setInfo(r)
          setPhase('available')
          setTimeout(() => setVisible(true), 60)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    clearInterval(poll.current)
    if (phase !== 'downloading') return
    poll.current = setInterval(async () => {
      const p = await getProgress()
      setProgress(p.progress)
      if (p.status === 'ready') setPhase('ready')
      else if (p.status === 'error') setPhase('available')
    }, 500)
    return () => clearInterval(poll.current)
  }, [phase])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => setPhase('hidden'), 300)
  }

  const onUpdate = async () => {
    if (!info?.download_url || !info?.asset_name) return
    setPhase('downloading')
    setProgress(0)
    await startDownload(info.download_url, info.asset_name)
  }

  const onInstall = async () => {
    setPhase('applying')
    await applyUpdate()
  }

  if (phase === 'hidden') return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? 0 : 16}px)`,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.25s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        zIndex: 9998,
        minWidth: 340,
        maxWidth: 480,
        width: 'max-content',
        background: 'white',
        borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 13,
        color: '#1C1C1E',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: 'linear-gradient(135deg,#0096C7,#023E8A)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {phase === 'ready' || phase === 'applying' ? (
          <RefreshCw size={15} color="white" />
        ) : (
          <ArrowDownToLine size={15} color="white" />
        )}
      </div>

      {phase === 'available' && (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>Update {info?.latest} available</div>
            <div style={{ color: '#636366', fontSize: 12, marginTop: 1 }}>
              You have version {info?.current}
            </div>
          </div>
          <button
            onClick={onUpdate}
            style={{
              background: 'linear-gradient(135deg,#0096C7,#023E8A)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Update Now
          </button>
          <button
            onClick={dismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#AEAEB2',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </>
      )}

      {phase === 'downloading' && (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Downloading update…</div>
            <div
              style={{
                height: 5,
                background: '#E5E5EA',
                borderRadius: 3,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg,#0096C7,#023E8A)',
                  borderRadius: 3,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
          <span style={{ color: '#636366', fontSize: 12, flexShrink: 0 }}>{progress}%</span>
        </>
      )}

      {phase === 'ready' && (
        <>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>Ready to install</div>
            <div style={{ color: '#636366', fontSize: 12, marginTop: 1 }}>
              Closes and relaunches automatically
            </div>
          </div>
          <button
            onClick={onInstall}
            style={{
              background: 'linear-gradient(135deg,#0096C7,#023E8A)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Install &amp; Relaunch
          </button>
          <button
            onClick={dismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#AEAEB2',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </>
      )}

      {phase === 'applying' && (
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600 }}>Installing update…</div>
          <div style={{ color: '#636366', fontSize: 12, marginTop: 1 }}>
            The app will close and relaunch shortly
          </div>
        </div>
      )}
    </div>
  )
}
