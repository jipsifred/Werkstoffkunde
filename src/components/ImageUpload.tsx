import { useState, useRef, useCallback } from 'react'

interface ImageUploadProps {
  cardId: string
  currentImage: string | null
  onUpload: (base64: string | null) => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export default function ImageUpload({ cardId, currentImage, onUpload }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      setError(null)

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Nur JPG, PNG oder WebP erlaubt.')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('Datei ist zu groß (max. 5 MB).')
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        onUpload(result)
      }
      reader.onerror = () => {
        setError('Fehler beim Lesen der Datei.')
      }
      reader.readAsDataURL(file)
    },
    [onUpload],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  if (currentImage) {
    return (
      <div className="space-y-2">
        <img
          src={currentImage}
          alt={`Bild für Karte ${cardId}`}
          className="w-full max-h-48 object-contain rounded-lg border border-border"
        />
        <button
          type="button"
          onClick={() => onUpload(null)}
          className="text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          Bild entfernen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          isDragging
            ? 'border-accent bg-accent-light'
            : 'border-border hover:border-accent/40'
        }`}
      >
        <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="text-xs text-text-secondary">
          Bild hierher ziehen oder klicken
        </span>
        <span className="text-xs text-text-secondary/60">
          JPG, PNG, WebP (max. 5 MB)
        </span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
