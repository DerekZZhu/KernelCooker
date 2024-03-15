import { useState, useEffect, useRef } from 'react'

import reactLogo from './assets/react.svg'
import vd from './assets/Vd-Orig.png'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const img = new Image()
    img.src = vd
    img.onload = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
    }
  }, [])

  const modImage = () => {
    // if (!imageLoaded) return;
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.willReadFrequently = true
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      // Invert colors
      data[i] = 255 - data[i]; // Red
      data[i + 1] = 255 - data[i + 1]; // Green
      data[i + 2] = 255 - data[i + 2]; // Blue
      // Alpha (data[i + 3]) is left unchanged
    }

    ctx.putImageData(imageData, 0, 0);
  }


  return (
    <>
      <h1>UW CSE 455 Kernel Cooker</h1>
      <canvas ref={canvasRef} width={200} height={200} willReadFrequently={true}/>
      <button onClick={modImage}>Evangelion</button>
      <div>
        Built for CSE 455 by Derek Zhu and Ruslan Mukladheev
      </div>
    </>
  )
}

export default App
