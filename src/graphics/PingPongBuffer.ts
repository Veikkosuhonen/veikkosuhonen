import { TextureFormat, TextureFormats, createFrameBuffer } from "./glUtils";

class PingPongBuffer {
  gl: WebGL2RenderingContext;
  readTexture: WebGLTexture;
  writeTexture: WebGLTexture;
  readFramebuffer: WebGLFramebuffer;
  writeFramebuffer: WebGLFramebuffer;

  constructor(gl: WebGL2RenderingContext, width: number, height: number, format: keyof typeof TextureFormats) {
    this.gl = gl

    const {
      texture: t1,
      frameBuffer: f1
    } = createFrameBuffer(gl, width, height, TextureFormats[format])

    const {
      texture: t2,
      frameBuffer: g2
    } = createFrameBuffer(gl, width, height, TextureFormats[format])

    if (!t1 || !t2 || !f1 || !g2) throw new Error("Failed to create ping pong buffer")

    this.readTexture = t1
    this.writeTexture = t2
    this.readFramebuffer = f1
    this.writeFramebuffer = g2
  }

  private swap() {
    const tempTexture = this.readTexture
    const tempFramebuffer = this.readFramebuffer
    this.readTexture = this.writeTexture
    this.readFramebuffer = this.writeFramebuffer
    this.writeTexture = tempTexture
    this.writeFramebuffer = tempFramebuffer
  }

  draw() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.writeFramebuffer)
    // assuming a quad
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
    this.swap()
  }

  destroy() {
    this.gl.deleteTexture(this.readTexture)
    this.gl.deleteTexture(this.writeTexture)
    this.gl.deleteFramebuffer(this.readFramebuffer)
    this.gl.deleteFramebuffer(this.writeFramebuffer)
  }
}

export default PingPongBuffer