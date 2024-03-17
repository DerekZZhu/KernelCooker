import { useState, useEffect, useRef } from 'react'
import { matrix, concat, zeros, index, range, flatten, subset, dot, identity, row } from 'mathjs'

import reactLogo from './assets/react.svg'
import vd from './assets/Vd-Orig.png'
import lenna from './assets/Lenna.png'
import tm from './assets/ThisMan.jpg'
import viteLogo from '/vite.svg'
import './App.css'




function App() {
  //const IDENTITY = matrix([[0, 0, 0], [0, 1, 0], [0, 0, 0]])
  // const img = matrix([[0,0,0,0,0], [0,1, 2, 3,0], [0,4, 5, 6,0], [0,7, 8, 9,0],[0,0,0,0,0]])
  // console.log(convolve(img, IDENTITY, 5, 5));

  const canvasRef = useRef(null)
  const [imageSize, setImageSize] = useState([0,0])

  useEffect(() => {
    const img = new Image()
    img.src = tm
    img.onload = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      setImageSize([img.naturalWidth, img.naturalHeight])
      ctx.drawImage(img, 0, 0)
    }
  }, [])

  function convolve(mat, filter) {
    const newMatrix = zeros(mat._size[0]-2, mat._size[1]-2)
    for (var i = 1; i < mat._size[0]-1; i++) {
      for (var j = 1; j < mat._size[1]-1; j++) {
        var sum = 0
        var window = subset(mat, index(range(i-1, i+2), range(j-1, j+2)))

        sum += dot(window._data[0], filter._data[0]) + dot(window._data[1], filter._data[1]) + dot(window._data[2], filter._data[2])
        //console.log(sum);
        newMatrix.set([i-1, j-1], sum)
      }
    }
    return flatten(newMatrix)
  }

  function convolveAll(mat_r, mat_g, mat_b, filter) {
    //const combinedArray = new Uint8ClampedArray(width * height * 4);
    const holderArray = []
    for (var i = 1; i < mat_r._size[0]-1; i++) {
      for (var j = 1; j < mat_r._size[1]-1; j++) {
        var sum = 0
        var window_r = subset(mat_r, index(range(i-1, i+2), range(j-1, j+2)))
        var window_g = subset(mat_g, index(range(i-1, i+2), range(j-1, j+2)))
        var window_b = subset(mat_b, index(range(i-1, i+2), range(j-1, j+2)))

        var sum_r = dot(window_r._data[0], filter._data[0]) + dot(window_r._data[1], filter._data[1]) + dot(window_r._data[2], filter._data[2])
        var sum_g = dot(window_g._data[0], filter._data[0]) + dot(window_g._data[1], filter._data[1]) + dot(window_g._data[2], filter._data[2])
        var sum_b = dot(window_b._data[0], filter._data[0]) + dot(window_b._data[1], filter._data[1]) + dot(window_b._data[2], filter._data[2])
        //console.log(sum);

        holderArray.push(sum_r)
        holderArray.push(sum_g)
        holderArray.push(sum_b)
        holderArray.push(255)
        // newMatrix.set([i-1, j-1], sum)
      }
    }
    return new Uint8ClampedArray(holderArray)
  }

  const modImage = () => {
    // if (!imageLoaded) return;
    // const IDENTITY = matrix([[0, 0, 0], [0, 1, 0], [0, 0, 0]])
    // const RIDGE = matrix([[0, -1, 0], [-1, 4, -1], [0, -1, 0]])
    const IDENTITY = matrix([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', {willReadFrequently:true})
    ctx.willReadFrequently = true
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    //console.log(data);

    const width = canvas.width;
    const height = canvas.height;
  
    const padding = 1;
    const newWidth = width + 2 * padding;
    const newHeight = height + 2 * padding;
  
    const redMatrix = zeros(newHeight, newWidth);
    const greenMatrix = zeros(newHeight, newWidth);
    const blueMatrix = zeros(newHeight, newWidth);
    const alphaMatrix = []
    

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        redMatrix.set([y + padding, x + padding], data[i]);
        greenMatrix.set([y + padding, x + padding], data[i + 1]);
        blueMatrix.set([y + padding, x + padding], data[i + 2]);
        alphaMatrix.push(data[i + 3])
      }
    }
    console.log(alphaMatrix);
    // const nRedMatrix = convolve(redMatrix, IDENTITY)
    // const nBlueMatrix = convolve(blueMatrix, IDENTITY)
    // const nGreenMatrix = convolve(greenMatrix, IDENTITY)

    // const combinedArray = new Uint8ClampedArray(width * height * 4);
    // for (let y = 0; y < ((width * height) * 4); y+=4) {
    //   //console.log(y);
    //   combinedArray[y] = nRedMatrix.get([y/4])
    //   combinedArray[y+1] = nGreenMatrix.get([y/4])
    //   combinedArray[y+2] = nBlueMatrix.get([y/4])
    //   combinedArray[y+3] = alphaMatrix[y/4]
    // }
    
    const combinedArray = convolveAll(redMatrix, greenMatrix, blueMatrix, IDENTITY)
    // console.log(
    //   combinedArray
    // );
    // console.log(nRedMatrix, nGreenMatrix, nBlueMatrix);
  
    const newImageData = new ImageData(combinedArray, width, height);
    ctx.putImageData(newImageData, 0, 0);
  }

  return (
    <>
      <h1>UW CSE 455 Kernel Cooker</h1>
      <canvas ref={canvasRef} />
      <button onClick={modImage}>Apply Kernel</button>
      {/* <button onClick={refresh}>Refresh Image</button> */}
      <div>
        Built for CSE 455 by Derek Zhu and Ruslan Mukladheev
      </div>
    </>
  )
}

export default App
