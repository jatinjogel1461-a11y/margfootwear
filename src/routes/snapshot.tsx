import { createFileRoute } from '@tanstack/react-router'
import { Shoe3D } from '@/components/Shoe3D'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/snapshot')({
  component: SnapshotRoute,
})

function SnapshotRoute() {
  const [status, setStatus] = useState('Wait 4 seconds for model to load...')
  
  useEffect(() => {
    // We add a delay to ensure textures are fully loaded and rendered
    const t = setTimeout(() => {
      setStatus('Capturing...')
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/webp', 1.0);
        fetch('/save-snapshot', {
          method: 'POST',
          body: dataUrl,
        }).then(() => setStatus('Saved thumbnail.webp!'))
      } else {
        setStatus('Canvas not found!')
      }
    }, 4500)
    
    return () => clearTimeout(t);
  }, [])

  return (
    <div className="w-[600px] h-[600px] bg-transparent relative flex items-center justify-center">
      <Shoe3D color="#ff6a00" interactive={false} showAutoRotateToggle={false} />
      <div className="absolute top-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-50">
        {status}
      </div>
    </div>
  )
}
