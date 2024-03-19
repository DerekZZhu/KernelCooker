import { useState, useEffect, useRef } from 'react'
import { matrix, zeros, index, range, subset, dot} from 'mathjs'
import { Menu } from '@headlessui/react'
import { Input } from './input'

import vd from './assets/Vd-Orig.png'
import lenna from './assets/Lenna.png'
import tm from './assets/ThisMan.jpg'
import viteLogo from '/vite.svg'
import './App.css'
import { ChevronDown, Settings } from 'lucide-react'



function App() {
  const IDENTITY = matrix([[0, 0, 0], [0, 1, 0], [0, 0, 0]])
  const RIDGE = matrix([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]])
  const SHARPEN = matrix([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])

  const canvasRef = useRef(null)
  const [cFilter, setCFilter] = useState(null)
  const [stringFilter, setStringFilter] = useState('Sharpen');
  const [stringImage, setStringImage] = useState('Vampire Deer');

  const [isCustom, setIsCustom] = useState(false);

  const preCooked = [{name: "Identity", kernel: IDENTITY}, {name:"Ridge", kernel: RIDGE}, ]
  const images = [{name: "Vampire Deer", img_: vd}, {name: "Lenna", img_:lenna}, {name:"This Man", img_:tm}]

  const [grid, setGrid] = useState([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]);

  const handleInputChange = (rowIndex, colIndex, value) => {
    const newGrid = [...grid];
    newGrid[rowIndex][colIndex] = value; 
    setGrid(newGrid);
  };

  const presetGrid = (matrix) => {
    setGrid(matrix._data)
  }

  useEffect(() => {
    drawImage(vd)
    setCFilter(matrix([[0, -1, 0], [-1, 5, -1], [0, -1, 0]]))
    setGrid([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    setStringFilter('Sharpen');
  }, [])

  const drawImage = (src) => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
    }
  }

  const changeImage = (src) => {
    drawImage(src)
  }

  function convolveAll(mat_r, mat_g, mat_b, filter) {
    //const combinedArray = new Uint8ClampedArray(width * height * 4);
    const holderArray = []
    for (var i = 1; i < mat_r._size[0]-1; i++) {
      for (var j = 1; j < mat_r._size[1]-1; j++) {
        var window_r = subset(mat_r, index(range(i-1, i+2), range(j-1, j+2)))
        var window_g = subset(mat_g, index(range(i-1, i+2), range(j-1, j+2)))
        var window_b = subset(mat_b, index(range(i-1, i+2), range(j-1, j+2)))

        var sum_r = dot(window_r._data[0], filter._data[0]) + dot(window_r._data[1], filter._data[1]) + dot(window_r._data[2], filter._data[2])
        var sum_g = dot(window_g._data[0], filter._data[0]) + dot(window_g._data[1], filter._data[1]) + dot(window_g._data[2], filter._data[2])
        var sum_b = dot(window_b._data[0], filter._data[0]) + dot(window_b._data[1], filter._data[1]) + dot(window_b._data[2], filter._data[2])

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
    const FILTER = cFilter
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

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        redMatrix.set([y + padding, x + padding], data[i]);
        greenMatrix.set([y + padding, x + padding], data[i + 1]);
        blueMatrix.set([y + padding, x + padding], data[i + 2]);
      }
    }
    
    const combinedArray = convolveAll(redMatrix, greenMatrix, blueMatrix, FILTER)
    const newImageData = new ImageData(combinedArray, width, height);
    ctx.putImageData(newImageData, 0, 0);
  }

  const handleInputFocus = (e) => {
    e.target.select();
  };

  return (
    <main className='w-full h-screen grid grid-cols-2 p-24 '>
      <div className='w-full h-full flex flex-col'>
        <h1 className='font-bold font-sans mb-4'>UW CSE 455 Kernel Cooker</h1>
        <div className="flex gap-2">
          <Menu as="div" className="relative inline-block text-right">
            <div>
              <Menu.Button className="inline-flex justify-center w-full rounded-md border bg-neutral-900 ">
                Kernel: {stringFilter} <ChevronDown className='ml-2 mt-0.5' size={20} />
              </Menu.Button>
              
            </div>
            <Menu.Items className="absolute left-0 right-0 z-10 mt-2 w-56 bg-neutral-900 divide-y divide-neutral-500 rounded-md shadow-lgring-opacity-5">
              <div className="px-1 py-1 ">
                <Menu.Item>
                  <button className='w-full text-left' onClick={() => {setCFilter(IDENTITY), setStringFilter("Identity"), presetGrid(IDENTITY)}}>Identity</button>
                </Menu.Item>
                <Menu.Item>
                  <button className='w-full text-left' onClick={() => {setCFilter(RIDGE), setStringFilter("Ridge"), presetGrid(RIDGE)}}>Ridge</button>
                </Menu.Item>
                <Menu.Item>
                  <button className="flex justify-between w-full px-4 py-2 text-sm " onClick={() => {setCFilter(SHARPEN), setStringFilter("Sharpen")}}>Sharpen</button>
                </Menu.Item>

                {/* <Menu.Item>
                  <button className="flex justify-between w-full px-4 py-2 text-sm " onClick={() => {setIsCustom(true), setStringFilter("Custom")}}>Custom</button>
                </Menu.Item> */}

              </div>
            </Menu.Items>
          </Menu>

          <Menu as="div" className="relative inline-block text-right">
            <div>
              <Menu.Button className="inline-flex justify-center w-full rounded-md border bg-neutral-900 ">
                Image: {stringImage} <ChevronDown className='ml-2 mt-0.5' size={20} />
              </Menu.Button>
              
            </div>
            <Menu.Items className="absolute left-0 right-0 z-10 mt-2 w-56 bg-neutral-900 divide-y divide-neutral-500 rounded-md shadow-lgring-opacity-5">
              <div className="px-1 py-1 ">
                {images.map((img_, i) => {
                  return(
                    <Menu.Item key={i}>
                      <button className='w-full text-left' onClick={() => {changeImage(img_.img_), setStringImage(img_.name)}}>{img_.name}</button>
                    </Menu.Item>
                  )
                })}

              </div>
            </Menu.Items>
          </Menu>

          <button onClick={modImage} className=' bg-neutral-900 rounded-md'>Apply Kernel</button>
        </div>

        <div className='flex flex-col'>
          <h2 className='font-semibold font-sans text-3xl mt-12'>Custom Kernel <span className='inline-block'><button className=' bg-transparent ml-0.5 -mb-1 p-0'><Settings className='mt-1' /></button></span></h2>
          <p className='font-sans text-lg text-neutral-400'>Enter a 3x3 matrix to apply a custom kernel to the image.</p>

          <div className='grid grid-cols-3 grid-rows-3 w-full lg:w-[460px] gap-2 mt-3'>
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  placeholder='0'
                  value={cell}
                  onFocus={handleInputFocus} 
                  onClick={() => {setStringFilter('Custom'), setCFilter(matrix(grid))}}
                  onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                  className='aspect-square h-full w-full text-center font-bold text-5xl rounded-2xl bg-neutral-900'
                />
              ))
            ))}
          </div>
        </div>

      

        <div className="mt-24">
          Built for CSE 455 by Derek Zhu and Ruslan Mukhamedvaleev.
        </div>
      </div>
      <div className='flex justify-center items-center max-h-[900px]'>
        
        <canvas className='m-auto' ref={canvasRef} width={200}  height={200}/>
      </div>
      
    </main>
  )
}

export default App
