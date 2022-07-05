// export class Shader {
//     vs: WebGLShader | null;
//     fs: WebGLShader | null;
//     va: WebGLVertexArrayObject  | null;
//     program: WebGLProgram | null;

//     constructor() {
//         this.vs = this.initVS();
//         this.fs = this.initFS();
//         this.va = null;
//         this.program = null;
//     }

//     private initVS() : any {
//         return `
//         void main(void) {}
//         `;
//     }

//     private initFS() : any {
//         return `
//         #ifdef GL_ES
//         precision highp float;
//         #endif

//         uniform vec3 unResolution
//         uniform float time;
//         uniform sampler2D tex0;
//         uniform sampler2D tex1;
//         uniform sampler2D fft;
//         uniform vec4 unPar;
//         uniform vec4 unPos;
//         uniform vec3 unBeatBassFFT;

//         void main(void)
//         {
//             vec2 uv = gl_FragCord.xy / unResolution.xy;

//             vec3 col = vec3(0.0);

//             gl_FragColor = vec4(col, 1.0);
//         }
//         `;
//     }

//     public attachShader(GL: any): void {

//     }

//     private loadShader(GL: any, type: any, source: WebGLShader) : any {
//         const shader = GL.createShader(type);

//         GL.shaderSource(shader, source);
//         GL.compileShader(shader);

//         if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
//             alert('An error occurred compiling the shaders: ' + GL.getShaderInfoLog(shader));
//             GL.deleteShader(shader);
//             return null;
//         }

//         return shader;
//     }
// }
