import { createSignal, onCleanup, onMount } from "solid-js"
import { toast } from "../Toasts"
import { TextureFormats, createFrameBuffer, createProgram, createQuad } from "~/graphics/glUtils"
import { baseGeneration, basicGles3Vertex, erosion, map, shadow } from "~/graphics/shaders"
import { createMousePosition } from "@solid-primitives/mouse"
import { useKeyDownList } from "@solid-primitives/keyboard";

const activeGlContexts = new Set<WebGL2RenderingContext>()
const [canvasSize, setCanvasSize] = createSignal<number[]>([1920, 1280])
const [sunDirection, setSunDirection] = createSignal<number[]>([1, 1, 0.5])
const [zoom, setZoom] = createSignal<number>(1.0)
const [cameraPos, setCameraPos] = createSignal<number[]>([0, 0])
export const [frameTime, setFrameTime] = createSignal(0)
const BUFFER_W = 1280
const SHADOW_BUFFER_W = 1080

const [keys] = useKeyDownList();

const processInput = (deltaTime: number) => {
  // read keyboard input
  let deltaX = 0.0
  let deltaY = 0.0
  keys().forEach(key => {
    switch (key) {
      case "W"||"up":
        deltaY += 1.0;
        break;
      case "D"||"right":
        deltaX += 1.0;
        break;
      case "A"||"left":
        deltaX -= 1.0;
        break;
      case "S"||"down":
        deltaY -= 1.0;
      default:
        break;
    }
  });
  

  setCameraPos([cameraPos()[0] + deltaTime * deltaX * zoom() * 0.1, cameraPos()[1] + deltaTime * deltaY * zoom() * 0.1])
}

const updateSunPosition = (currentTime: number) => {
  // @TODO fix lol
  setSunDirection([Math.sin(currentTime * 0.5), Math.cos(currentTime * 0.5), Math.sin(currentTime * 0.7) + 1.0])
}


const startRendering = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")
  if (!gl) throw new Error("WebGL2 not supported")
  activeGlContexts.add(gl)
  gl.getExtension("EXT_color_buffer_float")

  const finalProgram = createProgram(gl, basicGles3Vertex, map)
  const shadowProgram = createProgram(gl, basicGles3Vertex, shadow)
  const generationProgram = createProgram(gl, basicGles3Vertex, baseGeneration)
  const erosionProgram = createProgram(gl, basicGles3Vertex, erosion)

  gl.useProgram(finalProgram)

  createQuad(gl, finalProgram)

  /**
   * Ping pong data buffers setup
   */
  const {
    texture: dataTexture1,
    frameBuffer: dataFbo1
  } = createFrameBuffer(gl, BUFFER_W, BUFFER_W, TextureFormats.HalfFloat)
  const {
    texture: dataTexture2,
    frameBuffer: dataFbo2
  } = createFrameBuffer(gl, BUFFER_W, BUFFER_W, TextureFormats.HalfFloat)

  let firstDataFbo = true
  const currentDataTexture = () => {
    firstDataFbo = !firstDataFbo
    return firstDataFbo ? {
      texture: dataTexture1,
      source: dataFbo1,
      target: dataFbo2,
    } : {
      texture: dataTexture2,
      source: dataFbo2,
      target: dataFbo1,
    }
  }

  /**
   * Ping pong shadow buffers setup
   */
  const {
    texture: shadowTexture1,
    frameBuffer: shadowFbo1
  } = createFrameBuffer(gl, SHADOW_BUFFER_W, SHADOW_BUFFER_W, TextureFormats.SingleChannel)
  const {
    texture: shadowTexture2,
    frameBuffer: shadowFbo2
  } = createFrameBuffer(gl, SHADOW_BUFFER_W, SHADOW_BUFFER_W, TextureFormats.SingleChannel)

  let firstShadowFbo = true
  const currentShadowTexture = () => {
    firstShadowFbo = !firstShadowFbo
    return firstShadowFbo ? {
      texture: shadowTexture1,
      source: shadowFbo1,
      target: shadowFbo2,
    } : {
      texture: shadowTexture2,
      source: shadowFbo2,
      target: shadowFbo1,
    }
  }

  /**
   * Render generationProgram once
   */
  gl.useProgram(generationProgram)

  let ul = gl.getUniformLocation(generationProgram, "u_resolution")
  gl.uniform2f(ul, BUFFER_W, BUFFER_W)
  ul = gl.getUniformLocation(generationProgram, "u_seed")
  gl.uniform1f(ul, 100000 * (Math.random() - 0.5))
  ul = gl.getUniformLocation(generationProgram, "u_zoom")
  gl.uniform1f(ul, 1)

  gl.bindFramebuffer(gl.FRAMEBUFFER, dataFbo2)
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  const actualStart = performance.now()
  let start = actualStart
  let frameCount = 0

  const renderShadows = () => {
    const { texture: shadowTexture, target: shadowTarget } = currentShadowTexture()
    gl.useProgram(shadowProgram)
    ul = gl.getUniformLocation(shadowProgram, "u_resolution")
    gl.uniform2f(ul, SHADOW_BUFFER_W, SHADOW_BUFFER_W)
    ul = gl.getUniformLocation(shadowProgram, "u_zoom")
    gl.uniform1f(ul, 1)
    ul = gl.getUniformLocation(shadowProgram, "u_sunDirection")
    gl.uniform3f(ul, sunDirection()[0], sunDirection()[1], sunDirection()[2])
    ul = gl.getUniformLocation(shadowProgram, "u_data")
    gl.uniform1i(ul, 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, shadowTexture)
    ul = gl.getUniformLocation(shadowProgram, "u_shadows")
    gl.uniform1i(ul, 1)

    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowTarget)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
  }

  const render = () => {
    if (!activeGlContexts.has(gl)) return

    processInput(frameTime() / 1000.0)
    updateSunPosition(frameCount / 3000.0)

    /**
     * Render erosionProgram to frame buffer
     */
    const { texture, target } = currentDataTexture()
    gl.useProgram(erosionProgram)
    let ul = gl.getUniformLocation(erosionProgram, "u_resolution")
    gl.uniform2f(ul, BUFFER_W, BUFFER_W)
    ul = gl.getUniformLocation(erosionProgram, "u_zoom")
    gl.uniform1f(ul, 1)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    ul = gl.getUniformLocation(erosionProgram, "u_data")
    gl.uniform1i(ul, 0)

    gl.bindFramebuffer(gl.FRAMEBUFFER, target)
    gl.drawArrays(gl.TRIANGLES, 0, 6)

    /**
     * Render shadowProgram to frame buffer
     */
    for (let i = 0; i < 4; i++) {
      renderShadows()  
    }

    /**
     * Render to canvas
     */
    gl.useProgram(finalProgram)
    ul = gl.getUniformLocation(finalProgram, "u_resolution")
    gl.uniform2f(ul, BUFFER_W, BUFFER_W)
    ul = gl.getUniformLocation(finalProgram, "u_canvasSize")
    gl.uniform2f(ul, canvasSize()[0], canvasSize()[1])
    ul = gl.getUniformLocation(finalProgram, "u_data")
    gl.uniform1i(ul, 0)
    ul = gl.getUniformLocation(finalProgram, "u_shadows")
    gl.uniform1i(ul, 1)
    ul = gl.getUniformLocation(finalProgram, "u_sunDirection")
    gl.uniform3f(ul, sunDirection()[0], sunDirection()[1], sunDirection()[2])
    ul = gl.getUniformLocation(finalProgram, "u_zoom")
    gl.uniform1f(ul, zoom())
    ul = gl.getUniformLocation(finalProgram, "u_cameraPos")
    gl.uniform2f(ul, cameraPos()[0], cameraPos()[1])

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    
    const end = performance.now()
    setFrameTime((end - start))
    start = end
    frameCount++
  
    requestAnimationFrame(render)
  }

  render()

  return () => {
    toast("Cleaning up WebGL resources")
    activeGlContexts.delete(gl)

    gl.deleteProgram(finalProgram)
    gl.deleteProgram(generationProgram)
    gl.deleteProgram(erosionProgram)
    gl.deleteTexture(dataTexture1)
    gl.deleteTexture(dataTexture2)
    gl.deleteFramebuffer(dataFbo1)
    gl.deleteFramebuffer(dataFbo2)
  }
}



export default function Canvas() {
  let canvas: HTMLCanvasElement|undefined
  let cleanup: () => void|undefined

  const pos = createMousePosition();

  const resize = () => {
    const size = [
      canvas?.offsetWidth ?? 1080,
      canvas?.offsetHeight ?? 1080,
    ]

    setCanvasSize(size)
  }

  const handleZoom = (ev: WheelEvent) => {
    const { deltaY } = ev
    setZoom(zoom() * (deltaY / 1000.0 + 1.0))
    console.log(zoom())
  }

  onMount(() => {

    try {
      if (canvas) {
        cleanup = startRendering(canvas)

        addEventListener("resize", resize)
        resize()

        addEventListener("wheel", handleZoom)
      }

    } catch (error: any) {
      toast(error.message)
    }
  })

  onCleanup(() => {
    if (cleanup) cleanup()
  })

  return (
    <div class="relative">
      <canvas ref={canvas} width={BUFFER_W} height={BUFFER_W} 
        class="bg-transparent fixed top-0 w-full h-screen -z-50" 
      />
    </div>
  )
}
