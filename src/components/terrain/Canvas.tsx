import { createSignal, onCleanup, onMount } from "solid-js"
import { toast } from "../Toasts"
import { TextureFormats, createFrameBuffer, createQuad } from "~/graphics/glUtils"
import { createMousePosition } from "@solid-primitives/mouse"
import { useKeyDownList } from "@solid-primitives/keyboard"
import Shader from "~/graphics/Shader"
import PingPongBuffer from "~/graphics/PingPongBuffer"

const activeGlContexts = new Set<WebGL2RenderingContext>()
const [canvasElement, setCanvasElement] = createSignal<HTMLCanvasElement>()
const [canvasSize, setCanvasSize] = createSignal<number[]>([1920, 1280])
const [sunDirection, setSunDirection] = createSignal<number[]>([1, 1, 0.5])
const [zoom, setZoom] = createSignal<number>(1.0)
const [rain, setRain] = createSignal<boolean>(false)
const [cameraPos, setCameraPos] = createSignal<number[]>([0, 0])
export const [frameTime, setFrameTime] = createSignal(0)
const BUFFER_W = 1280
const SHADOW_BUFFER_W = 1080

const [keys] = useKeyDownList();
const mouse = createMousePosition(canvasElement());

const processInput = (deltaTime: number) => {
  // read keyboard input
  let deltaX = 0.0
  let deltaY = 0.0
  let rain = false
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
        break;
      case "E":
        rain = true
        break;
      default:
        break;
    }
  });
  setRain(rain)
  setCameraPos([cameraPos()[0] + deltaTime * deltaX * zoom() * 0.3, cameraPos()[1] + deltaTime * deltaY * zoom() * 0.3])
}


const updateSunPosition = (currentTime: number) => {
  // @TODO fix lol
  setSunDirection([Math.sin(currentTime * 0.5), Math.cos(currentTime * 0.5), Math.sin(currentTime * 0.7) * 0.5 + 0.6])
}


const startRendering = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl2")
  if (!gl) throw new Error("WebGL2 not supported")
  activeGlContexts.add(gl)
  gl.getExtension("EXT_color_buffer_float")

  const finalProgram = Shader.fromFragment(gl, "map")
  const shadowProgram = Shader.fromFragment(gl, "shadow")
  const generationProgram = Shader.fromFragment(gl, "baseGeneration")
  const fluxProgram = Shader.fromFragment(gl, "fluidFlux")
  const erosionProgram = Shader.fromFragment(gl, "erosion")
  const sedimentProgram = Shader.fromFragment(gl, "sedimentTransportation")

  finalProgram.use()

  createQuad(gl, finalProgram.program)

  const dataBuffers = new PingPongBuffer(gl, BUFFER_W, BUFFER_W, "HalfFloat")
  const fluidFluxBuffers = new PingPongBuffer(gl, BUFFER_W, BUFFER_W, "HalfFloat")
  const shadowBuffers = new PingPongBuffer(gl, SHADOW_BUFFER_W, SHADOW_BUFFER_W, "SingleChannel")

  /**
   * Render generationProgram once
   */
  generationProgram.use()

  generationProgram.setUniform2f("u_resolution", BUFFER_W, BUFFER_W)
  generationProgram.setUniform1f("u_seed", 100000 * (Math.random() - 0.5))
  dataBuffers.draw()

  const actualStart = performance.now()
  let start = actualStart
  let frameCount = 0


  const renderErosion = () => {
    rain() ? console.log("Raining") : null
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, dataBuffers.readTexture)
  
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, fluidFluxBuffers.readTexture)

    // Flow is simulated with the shallow water pipe-model. Flux buffer is updated
    fluxProgram.use()
    fluxProgram.setUniform2f("u_resolution", BUFFER_W, BUFFER_W)
    fluxProgram.setUniform1i("u_terrain", 0)
    fluxProgram.setUniform1i("u_fluidFlow", 1)
    fluidFluxBuffers.draw()

    // Water level is updated based on fluid flow. Rainfall is added and water level is decreased due to evaporation
    // Erosion-deposition process is computed
    erosionProgram.use()
    erosionProgram.setUniform2f("u_resolution", BUFFER_W, BUFFER_W)
    erosionProgram.setUniform1i("u_terrain", 0)
    erosionProgram.setUniform1i("u_fluidFlow", 1)
    erosionProgram.setUniform2f("u_mouse", rain() ? 1.0 : 0.0, 0.0)
    dataBuffers.draw()

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, dataBuffers.readTexture)

    // Sediment is transported by fluid flow
    sedimentProgram.use()
    sedimentProgram.setUniform2f("u_resolution", BUFFER_W, BUFFER_W)
    sedimentProgram.setUniform1i("u_terrain", 0)
    sedimentProgram.setUniform1i("u_fluidFlow", 1)
    dataBuffers.draw()
  }


  const renderShadows = () => {
    shadowProgram.use()
    shadowProgram.setUniform2f("u_resolution", SHADOW_BUFFER_W, SHADOW_BUFFER_W)
    shadowProgram.setUniform3f("u_sunDirection", sunDirection()[0], sunDirection()[1], sunDirection()[2])
    shadowProgram.setUniform1i("u_data", 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, shadowBuffers.readTexture)
    shadowProgram.setUniform1i("u_shadows", 1)

    shadowBuffers.draw()
  }


  const render = () => {
    if (!activeGlContexts.has(gl)) return

    processInput(frameTime() / 1000.0)
    updateSunPosition(frameCount / 3000.0)

    renderErosion()

    /**
     * Render shadowProgram to frame buffer
     */
    for (let i = 0; i < 2; i++) {
      renderShadows()  
    }

    /**
     * Render to canvas
     */
    finalProgram.use()
    finalProgram.setUniform2f("u_resolution", BUFFER_W, BUFFER_W)
    finalProgram.setUniform2f("u_canvasSize", canvasSize()[0], canvasSize()[1])
    finalProgram.setUniform1i("u_terrain", 0)
    finalProgram.setUniform1i("u_shadows", 1)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, fluidFluxBuffers.readTexture)
    finalProgram.setUniform1i("u_fluidFlow", 2)
    finalProgram.setUniform3f("u_sunDirection", sunDirection()[0], sunDirection()[1], sunDirection()[2])
    finalProgram.setUniform1f("u_zoom", zoom())
    finalProgram.setUniform2f("u_cameraPos", cameraPos()[0], cameraPos()[1])

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

    finalProgram.destroy()
    generationProgram.destroy()
    erosionProgram.destroy()
    shadowProgram.destroy()
  
    dataBuffers.destroy()
    shadowBuffers.destroy()
  }
}



export default function Canvas() {
  let canvas: HTMLCanvasElement|undefined
  let cleanup: () => void|undefined

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
  }

  onMount(() => {

    try {
      if (canvas) {
        setCanvasElement(canvas)
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
