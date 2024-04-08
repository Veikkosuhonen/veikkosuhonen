import { createSignal } from "solid-js"
import { getFrequencyData } from "~/experiments/visualiser/Audio"
import { toast } from "~/components/Toasts"
import shaders from "./shaders"
import { createFrameBuffer, createProgram, createQuad, TextureFormats } from "./glUtils"
import { Setting, settings } from "./settingsStore"

const setProgramUniforms = (gl: WebGL2RenderingContext, program: WebGLProgram, settings: Setting[], stage: "render" | "post") => {
  for (const { name, value } of settings.filter(u => u.stage === stage)) {
    const ul = gl.getUniformLocation(program, `u_${name}`)
    if (!ul) return
    gl.uniform1f(ul, value)
  }
}

export const [canvasSize, setCanvasSize] = createSignal<number[]>([1280, 1080])
export const [drawBufferSize, setDrawBufferSize] = createSignal<number[]>([1080, 1080])

const startRendering = (canvas: HTMLCanvasElement) => {
  const gl: WebGL2RenderingContext|null = canvas.getContext("webgl2")
  if (!gl) throw new Error("WebGL2 not supported")
  gl.getExtension("EXT_color_buffer_float")


  const program = createProgram(gl, shaders.basicVertex, shaders.basicFragment)
  const hdrProgram = createProgram(gl, shaders.basicVertex, shaders.hdrFragment)

  gl.useProgram(program)

  createQuad(gl, program)

  /**
   * Ping pong data buffers setup
   */
  const {
    texture: dataTexture1,
    frameBuffer: dataFbo1
  } = createFrameBuffer(gl, 1024, 256, TextureFormats.Byte)
  const {
    texture: dataTexture2,
    frameBuffer: dataFbo2
  } = createFrameBuffer(gl, 1024, 256, TextureFormats.Byte)

  let firstDataFbo = true
  const currentDataTexture = () => {
    firstDataFbo = !firstDataFbo
    return firstDataFbo ? {
      texture: dataTexture1,
      source: dataFbo2,
      target: dataFbo1,
    } : {
      texture: dataTexture2,
      source: dataFbo1,
      target: dataFbo2,
    }
  }


  /**
   * Hdr framebuffer setup
   */
  const {
    texture: hdrTexture,
    frameBuffer: hdrFbo
  } = createFrameBuffer(gl, 1080, 1080, TextureFormats.HalfFloat)

  const updateData = () => {
    const { texture: dataTexture, source, target } = currentDataTexture()
    
    gl.activeTexture(gl.TEXTURE0 + 0)
    gl.bindTexture(gl.TEXTURE_2D, dataTexture)
  
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, source)
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, target)
    gl.blitFramebuffer(/*src*/ 0, 0, 1024, 255, /*target*/ 0, 1, 1024, 256, gl.COLOR_BUFFER_BIT, gl.NEAREST)
  
    const level = 0
    const xoffset = 0
    const yoffset = 0
    const width = 1024
    const height = 1
    const srcFormat = gl.RGBA
    const srcType = gl.UNSIGNED_BYTE
    const data = getFrequencyData()
    const srcOffset = 0
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      level,
      xoffset,
      yoffset,
      width,
      height,
      srcFormat,
      srcType,
      data,
      srcOffset
    )

    
  }

  const start = Date.now()

  const render = () => {
    updateData()
    
    /**
     * Render to buffer
     */
    gl.useProgram(program)
    let ul = gl.getUniformLocation(program, "u_freq")
    gl.uniform1i(ul, 0)
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFbo)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    const [w, h] = canvasSize()
    const [dbw, dbh] = drawBufferSize()
  
    ul = gl.getUniformLocation(program, "u_resolution")
    gl.uniform2f(ul, dbw, dbh)
    ul = gl.getUniformLocation(program, "u_canvasSize")
    gl.uniform2f(ul, w, h)
    ul = gl.getUniformLocation(program, "u_time")
    gl.uniform1f(ul, (Date.now() - start) / 1000.0)
    
    setProgramUniforms(gl, program, settings, "render")
  
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    
    /**
     * Render to screen from buffer
     */
    gl.useProgram(hdrProgram)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    
    
    ul = gl.getUniformLocation(hdrProgram, "u_resolution")
    gl.uniform2f(ul, dbw, dbh)
    

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, hdrTexture)
    ul = gl.getUniformLocation(hdrProgram, "u_texture")
    gl.uniform1i(ul, 0)
  
    setProgramUniforms(gl, hdrProgram, settings, "post")

    gl.drawArrays(gl.TRIANGLES, 0, 6)


    requestAnimationFrame(render)
  }

  render()

  toast("Graphics initialised")


  return () => {
    console.log("cleaning up webgl resources")
    
  }
}

export default startRendering