import { useState, useEffect, useRef, Fragment } from 'react'
import { matrix, zeros } from 'mathjs'
import { Menu, Dialog, Transition } from '@headlessui/react'

import vd from './assets/Vd-Orig.png'
import lenna from './assets/Lenna.png'
import tm from './assets/ThisMan.jpg'
import gates from './assets/gates.png'
import baboon from './assets/baboon.jpg'

import './App.css'
import { ArrowDown, CheckCircle, ChevronDown, Info, Settings, X } from 'lucide-react'



function App() {
  const IDENTITY = matrix([[0, 0, 0], [0, 1, 0], [0, 0, 0]])
  const RIDGE = matrix([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]])
  const SHARPEN = matrix([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])

  const SOBEL_H = matrix([[-1, -2, -1], [0, 0, 0], [1, 2, 1]])
  const SOBEL_V = matrix([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]])

  const canvasRef = useRef(null);
  const [cFilter, setCFilter] = useState(null);
  const [stringFilter, setStringFilter] = useState('Sharpen');
  const [stringImage, setStringImage] = useState('Vampire Deer');
  const [img, setImg] = useState(vd)

  const [isUploaded, setIsUploaded] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isOpenInfo, setIsOpenInfo] = useState(false)

  function closeModal() {
    setIsOpen(false)
    setIsOpenInfo(false)
    setTimeout(() => {
      setIsUploaded(false)
    }, 300)
  }

  function openModal() {
    setIsOpen(true)
  }

  const preCooked = [{name: "Identity", kernel: IDENTITY}, 
                     {name:"Ridge", kernel: RIDGE}, 
                     {name: "Sharpen", kernel:SHARPEN}, 
                     {name:"Horizontal Edge", kernel:SOBEL_H},
                     {name:"Vertical Edge", kernel:SOBEL_V}]

  const images = [{name: "Vampire Deer", img_: vd}, 
                  {name: "Lenna", img_:lenna}, 
                  {name:"This Man", img_:tm}, 
                  {name:"Gates Building", img_:gates},
                  {name:"Baboon", img_:baboon}]

  const resources = [{name: "But what is a convolution?", link: "https://www.youtube.com/watch?v=KuXjwB4LzSA&t=1s"},
                     {name: "Kernels (Image Processing)", link: "https://en.wikipedia.org/wiki/Kernel_(image_processing)"}]

  const [grid, setGrid] = useState([
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]);

  const [fraction, setFraction] = useState([1,1])

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
    setCFilter(SHARPEN)
    setGrid(SHARPEN._data)
    setStringFilter('Sharpen');
  }, [])

  const drawImage = (src) => {
    const img = new Image()
    img.src = src
    img.onload = () => {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
    }
  }

  const changeImage = (src) => {
    drawImage(src)
    setImg(src)
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsUploaded(true)
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;
  
        if (width >450 || height>450) {
          if(width > height){
            height = Math.round((450/width)*height);
            width = 450;
          }else{
            width = Math.round((450/height)* width);
            height = 450;
          }
        }
  
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
  
        const scaledImageUrl = canvas.toDataURL('image/jpeg');
        drawImage(scaledImageUrl);
        setImg(scaledImageUrl);
        setStringImage('Custom Image');
      };
    }
  };

  function convolveAll(mat_r, mat_g, mat_b, filter) {
    const rows = mat_r.size()[0];
    const cols = mat_r.size()[1];
    const holderArray = new Uint8ClampedArray((rows - 2) * (cols - 2) * 4);
    let holderIndex = 0;

    for (let i = 1; i < rows - 1; i++) {
        for (let j = 1; j < cols - 1; j++) {
            let sum_r = 0, sum_g = 0, sum_b = 0;

            for (let fi = 0; fi < 3; fi++) {
                for (let fj = 0; fj < 3; fj++) {
                    const rVal = mat_r.get([i + fi - 1, j + fj - 1]);
                    const gVal = mat_g.get([i + fi - 1, j + fj - 1]);
                    const bVal = mat_b.get([i + fi - 1, j + fj - 1]);
                    const fVal = filter.get([fi, fj]);

                    sum_r += rVal * fVal;
                    sum_g += gVal * fVal;
                    sum_b += bVal * fVal;
                }
            }

            holderArray[holderIndex++] = sum_r;
            holderArray[holderIndex++] = sum_g;
            holderArray[holderIndex++] = sum_b;
            holderArray[holderIndex++] = 255;
        }
    }
    return holderArray;
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

  const updateFraction = (index, value) => {
    if (value <= 0) value = 1;
    if (index === 0) {
      setFraction([value, fraction[1]]);
    } else {
      setFraction([fraction[0], value]);
    }
  }

  const applyFraction = (matrix, fraction) => {
    const newMatrix = matrix.map(row => row.map(cell => cell * fraction[0] / fraction[1]))
      return newMatrix;
    }

  

  return (
    <main className='w-full h-fit flex flex-col lg:flex-row overflow-x-hidden max-w-[2000px] items-center mx-auto'>
      <div className='w-fit h-full flex flex-col p-4 sm:p-4 md:p-12 lg:p-24 2xl:col-span-1 lg:col-span-3'>
        <h1 className='font-bold font-sans mb-4 tracking-tight text-3xl lg:text-4xl xl:text-5xl'>UW CSE 455 Kernel Cooker <span><button type="button" onClick={() => setIsOpenInfo(!isOpenInfo)} className='bg-transparent ml-0.5 p-0'><Info strokeWidth={2.5} className='' /></button></span></h1>
        <Transition appear show={isOpenInfo} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={closeModal}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-xl bg-neutral-800 border border-neutral-900 p-6 text-left align-middle shadow-xl transition-all">
                    <div className='flex gap-3'>
                      <div className="mx-auto flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 sm:mx-0 sm:h-10 sm:w-10">
                        <Info strokeWidth={2.5} className='text-neutral-700' />
                      </div>
                      <div className='w-full'>
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-semibold leading-6 text-neutral-100 tracking-tight"
                        >
                          Resources and Information About Kernels
                        </Dialog.Title>
                        <div className="mt-1 w-full">
                          <p className="text-md mb-2 font-base tracking-tight text-neutral-300">
                            Here are some resources to learn more about kernels and convolutional filters.
                          </p>
                        </div>
                      </div>
                    </div>
                    <ul className='mt-3'>
                      {resources.map((resource, i) => {
                        return(
                          <a key={i} className='text-neutral-100 hover:text-white transition tracking-tight' href={resource.link}>
                            <li key={i} className='mt-1 bg-neutral-900 p-3 rounded-md border-neutral-950 border tracking-tight'>
                              {resource.name}
                            </li>
                          </a>
                        )
                      }
                      )}
                    </ul>
                    

                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        
        <div className="flex gap-2 flex-wrap">
          <Menu as="div" className="relative inline-block text-right w-full md:w-auto">
            <div>
              <Menu.Button className="inline-flex justify-center tracking-[-0.01em] w-full rounded-md border bg-neutral-900 ">
                Kernel: {stringFilter} <ChevronDown className='ml-2 mt-0.5' size={20} />
              </Menu.Button>
              
            </div>
            <Menu.Items className="absolute left-0 right-0 z-10 mt-2 w-56 bg-neutral-900 divide-y divide-neutral-500 rounded-md shadow-lgring-opacity-5">
              <div className="px-1 py-1 ">
                {preCooked.map((kernel_info, i) => {
                    return(
                      <Menu.Item key={i}>
                        <button className='w-full text-left tracking-[-0.01em]' 
                                onClick={() => {
                                  setCFilter(kernel_info.kernel), 
                                  setStringFilter(kernel_info.name), 
                                  presetGrid(kernel_info.kernel)}}
                        >{kernel_info.name}</button>
                      </Menu.Item>
                    )
                  })}

              </div>
            </Menu.Items>
          </Menu>

          <Menu as="div" className="relative inline-block text-right  w-full md:w-auto">
            <div>
              <Menu.Button className="inline-flex justify-center w-full rounded-md border bg-neutral-900 tracking-[-0.01em]">
                Image: {stringImage} <ChevronDown className='ml-2 mt-0.5' size={20} />
              </Menu.Button>
              
            </div>
            <Menu.Items className="absolute left-0 right-0 z-10 mt-2 w-56 bg-neutral-900 divide-y divide-neutral-500 rounded-md shadow-lgring-opacity-5">
              <div className="px-1 py-1 ">
                {images.map((img_, i) => {
                  return(
                    <Menu.Item key={i}>
                      <button className='w-full text-left tracking-[-0.01em]' onClick={() => {changeImage(img_.img_), setStringImage(img_.name)}}>{img_.name}</button>
                    </Menu.Item>
                  )
                })}

              </div>
            </Menu.Items>
          </Menu>
          <button onClick={modImage} className=' bg-neutral-900 rounded-md tracking-[-0.01em]  w-full md:w-auto'>Apply Kernel</button>
          <button onClick={() => {drawImage(img)}} className=' w-full md:w-auto'>Reset Image</button>
          
        </div>
        <div className='flex flex-col'>
          <h2 className='font-semibold font-sans text-3xl mt-12 tracking-tight'>Kernel Matrix <span className='inline-block'><button type="button" onClick={openModal} className=' bg-transparent ml-0.5 -mb-1 p-0'><Settings className='mt-1' /></button></span>{ fraction[0] === fraction[1] ? <span></span> : <span className='text-lg ml-2 font-semibold text-neutral-300'>Fraction: {fraction[0]} / {fraction[1]}</span>}</h2>
          <Transition appear show={isOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={closeModal}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black/25" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-xl bg-neutral-800 border border-neutral-900 p-6 text-left align-middle shadow-xl transition-all">
                    <div className='flex flex-col sm:flex-row gap-3'>
                      <div className="flex h-13 w-13 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 sm:mx-0 h-10 w-10">
                        <Settings className="h-6 w-6 text-neutral-700" aria-hidden="true" />
                      </div>
                      <div>
                        <Dialog.Title
                          as="h3"
                          className="text-lg font-semibold leading-6 tracking-tight text-neutral-100"
                        >
                          Custom Kernel Settings
                        </Dialog.Title>
                        <div className="mt-1">
                          <p className="text-md tracking-tight text-neutral-300">
                            You can upload your own image here, and customize some other settings.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className='flex flex-col'>
                        <div className="mt-4 mb-4 md:max-w-24 h-28 md:h-fit md:aspect-square">
                          <label className="block text-sm font-medium text-neutral-100 tracking-tight">
                            Fraction
                          </label>
                          <input
                            type="number"
                            name="fraction"
                            onFocus={handleInputFocus}
                            id="fraction"
                            value={fraction[0]}
                            onChange={(e) => updateFraction(0, e.target.value)}
                            min={1}
                            placeholder='1'
                            className="mt-1 text-center font-semibold text-3xl focus:ring-neutral-500 focus:border-neutral-500 block w-full h-full shadow-sm border-2 rounded-md md:aspect-square bg-neutral-50 dark:hover:bg-bray-800 dark:bg-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-600 transition border-neutral-300 border-dashed"
                          />
                        </div>

                        
                        <div className='w-full h-1 mt-2 bg-neutral-700 '/>

                        <div className="mt-2 md:max-w-24 h-28 md:h-fit md:aspect-square">
                          <input
                            type="number"
                            name="fraction2"
                            id="fraction2"
                            placeholder='1'
                            onFocus={handleInputFocus}
                            value={fraction[1]}
                            onChange={(e) => {updateFraction(1, e.target.value)}}
                            min={1}
                            className="mt-1 text-center font-semibold text-3xl focus:ring-neutral-500 focus:border-neutral-500 block w-full h-full shadow-sm border-2 rounded-md md:aspect-square bg-neutral-50 dark:bg-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-600 transition border-neutral-300 border-dashed"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col justify-center w-full mt-4 relative">
                        <label className="block text-sm mb-1 font-medium text-neutral-100 tracking-tight">
                            Custom Image
                          </label>
                        <label className={`flex relative flex-col items-center justify-center w-full h-[202px] border-2 border-dashed rounded-lg cursor-pointer bg-neutral-50 dark:bg-neutral-700 hover:bg-neutral-100 dark:border-neutral-600 dark:hover:border-neutral-500 dark:hover:bg-neutral-600 transition ${isUploaded ? 'bg-green-50 dark:hover:bg-green-900 dark:bg-green-800 hover:bg-green-100 dark:border-green-600 hover:dark:border-green-700 border-green-500 hover:border-green-600' : 'bg-neutral-50 dark:hover:bg-bray-800 dark:bg-neutral-700 hover:bg-neutral-100'}`}>
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  { isUploaded ? <CheckCircle className='w-8 h-8 mb-4 text-green-500 dark:text-green-400' /> : <svg   className="w-8 h-8 mb-4 text-neutral-500 dark:text-neutral-400"   aria-hidden="true"   xmlns="http://www.w3.org/2000/svg"   fill="none"   viewBox="0 0 20 16" >   {" "}   <path     stroke="currentColor"     strokeLinecap="round"     strokeLinejoin="round"     strokeWidth={2}     d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"   />{" "} </svg>}
                                  { isUploaded ? <p className="mb-2 text-sm text-green-500 dark:text-green-400"><span className="font-semibold">Uploaded</span> successfully</p> : <p className="mb-2 text-sm text-neutral-500 dark:text-neutral-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>}
                                  { isUploaded ? <p className="text-xs text-green-500 dark:text-green-400">Using Custom Image</p> : <p className="text-xs text-neutral-500 dark:text-neutral-400">PNG or JPG (MAX. 450 x 450px)</p>}                                </div>
                              <input id="dropzone-file" type="file" accept="iamge/*" onChange={handleImageUpload} className='absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer' />
                          </label>
                      </div> 
                    </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          className="inline-flex justify-center rounded-md border border-transparent bg-neutral-100 px-4 py-2 text-sm w-full font-medium text-neutral-900 hover:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2"
                          onClick={closeModal}
                        >
                          Done
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
          
          
          
          <p className='font-sans text-lg text-neutral-400'>Enter a 3x3 matrix to apply a custom kernel to the image.</p>

          <div className='grid grid-cols-3 grid-rows-3 w-full lg:w-[460px] gap-2 mt-3'>
            {grid.map((row, rowIndex) => (
              row.map((cell, colIndex) => (
                <input
                  key={`${rowIndex}-${colIndex}`}
                  placeholder='0'
                  value={cell}
                  onFocus={handleInputFocus} 
                  onClick={() => {setStringFilter('Custom'), setCFilter(matrix(applyFraction(grid, fraction)))}}
                  onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
                  className='aspect-square h-full w-full text-center font-bold text-5xl rounded-2xl bg-neutral-900'
                />
              ))
            ))}
          </div>
        </div>

        <div className="mt-24">
          <h2>Built for CSE 455 by <a className=' text-neutral-100 hover:text-white transition' href='https://www.linkedin.com/in/derek-zhu-873477215/'>Derek Zhu</a> and <a className='text-neutral-100 hover:text-white transition' href='https://www.ruslan.in'>Ruslan Mukhamedvaleev.</a></h2>
        </div>

      </div>
      <div className='justify-center items-center max-h-[980px] h-full w-fit m-auto '>
        
        <canvas className='m-auto w-[80vw] pb-24 md:w-fit' ref={canvasRef}/>
      </div>
      
    </main>
  )
}

export default App
