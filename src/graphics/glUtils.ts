import { toast, toastError } from "~/components/Toasts"

export type TextureFormat = (gl: WebGL2RenderingContext) => {
  internalFormat: number
  srcFormat: number
  srcType: number
}

export const TextureFormats: {
  SingleChannel: TextureFormat
  HalfFloat: TextureFormat
  Byte: TextureFormat
} = {
  SingleChannel: (gl: WebGL2RenderingContext) => ({
    internalFormat: gl.R16F,
    srcFormat: gl.RED,
    srcType: gl.HALF_FLOAT,
  }),
  HalfFloat: (gl: WebGL2RenderingContext) => ({
    internalFormat: gl.RGBA16F,
    srcFormat: gl.RGBA,
    srcType: gl.HALF_FLOAT,
  }),
  Byte: (gl: WebGL2RenderingContext) => ({
    internalFormat: gl.RGBA,
    srcFormat: gl.RGBA,
    srcType: gl.UNSIGNED_BYTE,
  })
} as const;

export const createFrameBuffer = (gl: WebGL2RenderingContext, w: number, h: number, format = TextureFormats.Byte) => {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  let level = 0
  let border = 0

  const {
    internalFormat,
    srcFormat,
    srcType
  } = format(gl)

  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    w,
    h,
    border,
    srcFormat,
    srcType,
    null
  )
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  // fbo setup
  const frameBuffer = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0,
  )
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return {
    frameBuffer, texture
  }
}


export const createProgram = (gl: WebGL2RenderingContext, vertexSource: string, fragmentSource: string) => {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)
  if (!vertexShader) throw new Error("Failed to create vshader")

  gl.shaderSource(vertexShader, vertexSource)
  gl.compileShader(vertexShader)
  let log = gl.getShaderInfoLog(vertexShader)
  if (log) toastError(log)

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
  if (!fragmentShader) throw new Error("Failed to create fshader")
  gl.shaderSource(fragmentShader, fragmentSource)
  gl.compileShader(fragmentShader)
  log = gl.getShaderInfoLog(fragmentShader)
  if (log) toastError(log)

  const program = gl.createProgram()
  if (!program) throw new Error("Failed to create program")
  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  log = gl.getProgramInfoLog(program)
  if (log) toastError(log)

  return program
}


export const createQuad = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
  const vertices = [-1, -1,   1, -1,   -1, 1,   -1, 1,   1, -1,   1, 1]
  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertices),
    gl.STATIC_DRAW
  )

  const positionAttribute = gl.getAttribLocation(program, "position")
  gl.enableVertexAttribArray(positionAttribute)
  gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0)
}

