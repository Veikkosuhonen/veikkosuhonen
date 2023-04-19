import { createProgram } from "./glUtils";
import shaders from "./shaders";

class Shader {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  uniforms: { [name: string]: WebGLUniformLocation };
  name: string;

  static fromFragment(gl: WebGL2RenderingContext, name: keyof typeof shaders) {
    const vertexShaderSource = shaders.basicGles3Vertex
    const fragmentShaderSource = shaders[name]
    return new Shader(gl, vertexShaderSource, fragmentShaderSource, name)
  }

  constructor(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string, name: string) {
    this.gl = gl
    this.program = createProgram(gl, vertexShaderSource, fragmentShaderSource)
    this.uniforms = {}
    this.name = name
  }

  private getUniformLocation(name: string) {
    if (!this.uniforms[name]) {
      const location = this.gl.getUniformLocation(this.program, name)
      if (!location) throw new Error(`[${this.name}] Uniform ${name} not found`)
      this.uniforms[name] = location
    }
    return this.uniforms[name]
  }

  setUniform1f(name: string, x: number) {
    this.gl.uniform1f(this.getUniformLocation(name), x)
  }

  setUniform2f(name: string, x: number, y: number) {
    this.gl.uniform2f(this.getUniformLocation(name), x, y)
  }

  setUniform3f(name: string, x: number, y: number, z: number) {
    this.gl.uniform3f(this.getUniformLocation(name), x, y, z)
  }

  setUniform1i(name: string, x: number) {
    this.gl.uniform1i(this.getUniformLocation(name), x)
  }

  use() {
    this.gl.useProgram(this.program)
  }

  destroy() {
    this.gl.deleteProgram(this.program)
  }
}

export default Shader