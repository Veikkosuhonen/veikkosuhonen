import { createSignal, onMount } from "solid-js";
import { fragmentSrc, vertexSrc } from "~/shaders";
import { getTimeDomainData } from "./Audio";

const [channel, setChannel] = createSignal(0.0);

const startRendering = (canvas) => {
  // Get WebGL context from canvas
  const gl = canvas.getContext("webgl");

  // Define vertices for the full-screen quad
  const vertices = [  -1, -1,   1, -1,   -1, 1,   -1, 1,   1, -1,   1, 1];

  // Create a vertex buffer to store the vertices
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Compile the vertex shader
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSrc);
  gl.compileShader(vertexShader);
  console.log(gl.getShaderInfoLog(vertexShader))

  // Compile the fragment shader
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSrc);
  gl.compileShader(fragmentShader);
  console.log(gl.getShaderInfoLog(fragmentShader))

  // Create a WebGL program and link the shaders
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Get the position attribute from the vertex shader
  const positionAttribute = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(positionAttribute);
  gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 256;
  const height = 2;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    getTimeDomainData()
  );

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);

  const start = Date.now()

  // Render function
  const render = () => {
    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let ul = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(ul, 1280, 720);

    ul = gl.getUniformLocation(program, "u_time");
    gl.uniform1f(ul, (Date.now() - start) / 1000.0);

    ul = gl.getUniformLocation(program, "u_channel");
    gl.uniform1f(ul, channel());
  
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      getTimeDomainData()
    );
  
    ul = gl.getUniformLocation(program, "u_freq");
    gl.uniform1i(ul, 0);

    // Draw the full-screen quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Request the next animation frame
    requestAnimationFrame(render);
  };

  // Start rendering
  render();
}

export default function Canvas() {
  let canvas;

  onMount(() => {
    startRendering(canvas)
  })

  return (
    <>
      <canvas ref={canvas} width="1280" height="720" style={{ width: "90%", height: "80%" }} class="bg-black"/>
      <button onClick={() => setChannel(channel() ? 0.0 : 0.9)}>SWITCH CHANNEL</button>
    </>
  );
}
