import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const onScanRef = useRef(onScan)
  const onCloseRef = useRef(onClose)
  const [erroCamera, setErroCamera] = useState(false)

  onScanRef.current = onScan
  onCloseRef.current = onClose

  useEffect(() => {
    if (!containerRef.current) return

    let active = true
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (active) onScanRef.current(decodedText)
        },
        () => {},
      )
      .catch(() => {
        if (active) {
          setErroCamera(true)
          setTimeout(() => onCloseRef.current(), 2000)
        }
      })

    return () => {
      active = false
      if (scannerRef.current) {
        const s = scannerRef.current
        scannerRef.current = null
        Promise.resolve(s.stop()).catch(() => {}).then(() => {
          Promise.resolve(s.clear()).catch(() => {})
        }).catch(() => {})
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-white">Câmera</h2>
        <button
          onClick={() => onClose()}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
        >
          Fechar
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {erroCamera ? (
          <div className="text-center">
            <p className="text-sm text-red-400">Não foi possível acessar a câmera</p>
            <p className="mt-1 text-xs text-slate-500">Verifique as permissões e tente novamente</p>
          </div>
        ) : (
          <div id="qr-reader" ref={containerRef} className="w-full max-w-sm" />
        )}
      </div>
      <div className="bg-slate-900 p-4 text-center">
        <p className="text-xs text-slate-400">Posicione o QR Code dentro da moldura</p>
      </div>
    </div>
  )
}
