import { Accessor } from "solid-js"
import { basicFragment, basicVertex, hdrFragment } from "~/shaders"
import { Setting, settings } from "./settingsStore"

type TextureConfig = {
  name: string,
  size: [number, number],
  provider: () => ArrayBufferView
}

const setProgramUniforms = (gl: WebGL2RenderingContext, program: WebGLProgram, settings: Setting[], stage: "render" | "post") => {
  for (const { name, value } of settings.filter(u => u.stage === stage)) {
    const ul = gl.getUniformLocation(program, `u_${name}`)
    if (!ul) return
    gl.uniform1f(ul, value)
  }
}

const createProgram = (gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) => {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  if (!vertexShader) throw new Error("Failed to create vshader")

  gl.shaderSource(vertexShader, vertexSource)
  gl.compileShader(vertexShader)
  console.log(gl.getShaderInfoLog(vertexShader))
  
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  if (!fragmentShader) throw new Error("Failed to create fshader")
  gl.shaderSource(fragmentShader, fragmentSource)
  gl.compileShader(fragmentShader)
  console.log(gl.getShaderInfoLog(fragmentShader))

  const program = gl.createProgram()
  if (!program) throw new Error("Failed to create program")
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  return program
}



const startRendering = (canvas: HTMLCanvasElement, textures: TextureConfig[]) => {
  const gl: WebGL2RenderingContext|null = canvas.getContext("webgl2")
  if (!gl) throw new Error("WebGL2 not supported")
  gl.getExtension("EXT_color_buffer_float")


  const vertices = [-1, -1,   1, -1,   -1, 1,   -1, 1,   1, -1,   1, 1]
  
  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)


  const program = createProgram(gl, basicVertex, basicFragment)
  const hdrProgram = createProgram(gl, basicVertex, hdrFragment)

  gl.useProgram(program)



  const positionAttribute = gl.getAttribLocation(program, "position")
  gl.enableVertexAttribArray(positionAttribute)
  gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0)


  /**
   * Framebuffer setup
   */
  // texture setup
  const hdrTexture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, hdrTexture)
  const level = 0
  const internalFormat = gl.RGBA16F
  const width = 1280
  const height = 720
  const border = 0
  const srcFormat = gl.RGBA
  const srcType = gl.HALF_FLOAT
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    null
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  // fbo setup
  const hdrFbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFbo)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    hdrTexture,
    0,
  )
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)


  const textureUpdaters = textures.map((textureConfig, index) => {
    const texture = gl.createTexture()

    // gl.activeTexture(gl.TEXTURE0 + index)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE)

    const updater = {
      texture,
      update() {
        gl.activeTexture(gl.TEXTURE0 + index)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        const level = 0
        const internalFormat = gl.RGBA
        const width = 512
        const height = 2
        const border = 0
        const srcFormat = gl.RGBA
        const srcType = gl.UNSIGNED_BYTE
        const data = textureConfig.provider()
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          width,
          height,
          border,
          srcFormat,
          srcType,
          data
        )

        const ul = gl.getUniformLocation(program, textureConfig.name)
        gl.uniform1i(ul, index)
      }
    }

    return updater
  })




  const start = Date.now()

  const render = () => {
    /**
     * Render to buffer
     */
    gl.useProgram(program)
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFbo)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  
    let ul = gl.getUniformLocation(program, "u_resolution")
    gl.uniform2f(ul, 1280, 720)
    ul = gl.getUniformLocation(program, "u_time")
    gl.uniform1f(ul, (Date.now() - start) / 1000.0)
    
    setProgramUniforms(gl, program, settings, "render")
  
    textureUpdaters.forEach(updater => updater.update())
  
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    
    /**
     * Render to screen from buffer
     */
    gl.useProgram(hdrProgram)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
  
    ul = gl.getUniformLocation(hdrProgram, "u_resolution")
    gl.uniform2f(ul, 1280, 720)

    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, hdrTexture)
    ul = gl.getUniformLocation(hdrProgram, "u_texture")
    gl.uniform1i(ul, 0)
  
    setProgramUniforms(gl, hdrProgram, settings, "post")

    gl.drawArrays(gl.TRIANGLES, 0, 6)



    requestAnimationFrame(render)
  }

  render()



  return () => {
    console.log("cleaning up webgl resources")
    gl.deleteProgram(program)
    textureUpdaters.forEach((updater, index) => {
      gl.activeTexture(gl.TEXTURE0 + index)
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.deleteTexture(updater.texture)
    })
  }
}

export default startRendering