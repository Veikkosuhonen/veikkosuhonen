import { createEffect, onCleanup } from 'solid-js';

const ShaderBackground = () => {
    let canvas: HTMLCanvasElement | undefined;

    const vertexShaderSource = `
        attribute vec4 a_position;
        void main() {
            gl_Position = a_position;
        }
    `;

    const fragmentShaderSource = /* glsl */ `
// Based on https://www.shadertoy.com/view/ldB3zc by Inigo Quilez
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_scroll;

const float speed = 0.15;

float hash1( float n ) { return fract(sin(n)*43758.5453); }
vec2  hash2( vec2  p ) { p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) ); return fract(sin(p)*43758.5453); }

// The parameter w controls the smoothness
vec4 voronoi(in vec2 x, float w) {
    vec2 n = floor( x );
    vec2 f = fract( x );

	vec4 m = vec4( 8.0, 0.0, 0.0, 0.0 );
    for( int j=-2; j<=2; j++ )
    for( int i=-2; i<=2; i++ )
    {
        vec2 g = vec2( float(i),float(j) );
        vec2 o = hash2( n + g );
		
		// animate
        o = 0.5 + 0.5*sin( u_time * speed + 6.2831*o );

        // distance to cell		
		float d = length(g - f + o);
		
        // cell color
		vec3 col = 0.5 + 0.5*sin( hash1(dot(n+g,vec2(7.0,113.0)))*2.5 + 3.5 + vec3(2.0,3.0,0.0));
        // in linear space
        col = col*col;
        
        // do the smooth min for colors and distances		
		float h = smoothstep( -1.0, 1.0, (m.x-d)/w );
	    m.x   = mix( m.x,     d, h ) - h*(1.0-h)*w/(1.0+3.0*w); // distance
		m.yzw = mix( m.yzw, col, h ) - h*(1.0-h)*w/(1.0+3.0*w); // color
    }
	
	return m;
}

// https://iquilezles.org/articles/palettes/
// cosine based palette, 4 vec3 params
vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
    return a + b*cos( 6.283185*(c*t+d) );
}

void main() {
    vec2 p = gl_FragCoord.xy;
    p *= 2.0;
    p.y -= u_scroll * 0.25;
    p /= u_resolution.y;
   
    vec4 v = voronoi( p, 0.05 );

    vec3 col = palette((v.x + v.y + v.z + v.w) * 0.3 - (p.y - 0.5) * 0.3, 
        vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,0.5),vec3(0.8,0.90,0.30)
    );
    
    col *= 0.35;
    col += 0.07;

    col = pow(col, vec3(0.6));
	
    gl_FragColor = vec4( col, 1.0 );
}
    `;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };

    const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    };

    createEffect(() => {
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        if (!vertexShader || !fragmentShader) return;

        const program = createProgram(gl, vertexShader, fragmentShader);
        if (!program) return;

        const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
        const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
        const timeUniformLocation = gl.getUniformLocation(program, 'u_time');
        const scrollUniformLocation = gl.getUniformLocation(program, 'u_scroll');

        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,
            3, -1,
            -1, 3,
        ]), gl.STATIC_DRAW);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        gl.enableVertexAttribArray(positionAttributeLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

        let startTime = Date.now();
        const render = () => {
            const currentTime = (Date.now() - startTime) / 1000;
            gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
            gl.uniform1f(timeUniformLocation, currentTime);
            gl.uniform1f(scrollUniformLocation, window.scrollY);

            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.drawArrays(gl.TRIANGLES, 0, 3);

            requestAnimationFrame(render);
        };

        // Resize canvas
        const resize = () => {
            canvas.width = window.innerWidth * 0.2;
            canvas.height = window.innerHeight * 0.2;
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        };

        resize();
        window.addEventListener('resize', resize);

        render();

        onCleanup(() => {
            gl.deleteShader(vertexShader);
            gl.deleteShader(fragmentShader);
            gl.deleteProgram(program);
            gl.deleteBuffer(positionBuffer);
        });
    });

    return <canvas ref={canvas} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }} />;
};

export default ShaderBackground;