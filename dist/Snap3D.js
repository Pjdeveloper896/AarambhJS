// Snap3D.js - minimal WebGL 3D helper (no external libs)

export function mount(containerSelector, setupScene) {
  const container = document.querySelector(containerSelector);
  if (!container) throw new Error('Container not found');

  const canvas = document.createElement('canvas');
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  container.appendChild(canvas);

  const gl = canvas.getContext('webgl');
  if (!gl) throw new Error('WebGL not supported');

  // === Shaders ===
  const vertexSrc = `
    attribute vec3 aPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
    }
  `;

  const fragmentSrc = `
    precision mediump float;
    uniform vec4 uColor;
    void main(void) {
      gl_FragColor = uColor;
    }
  `;

  function compileShader(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  const vertexShader = compileShader(vertexSrc, gl.VERTEX_SHADER);
  const fragmentShader = compileShader(fragmentSrc, gl.FRAGMENT_SHADER);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error('Program link failed: ' + gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
  const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
  const uColor = gl.getUniformLocation(program, 'uColor');

  // === Matrix Utils ===
  function createIdentityMatrix() {
    return new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1
    ]);
  }

  function perspectiveMatrix(fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    const out = new Float32Array(16);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[14] = (2 * far * near) * nf;
    return out;
  }

  function translateMatrix(m, tx, ty, tz) {
    m[12] = tx;
    m[13] = ty;
    m[14] = tz;
  }

  // === Cube Data ===
  const cubeVertices = new Float32Array([
    -1, -1,  1,   1, -1,  1,   1,  1,  1,  -1,  1,  1,
    -1, -1, -1,  -1,  1, -1,   1,  1, -1,   1, -1, -1,
    -1,  1, -1,  -1,  1,  1,   1,  1,  1,   1,  1, -1,
    -1, -1, -1,   1, -1, -1,   1, -1,  1,  -1, -1,  1,
     1, -1, -1,   1,  1, -1,   1,  1,  1,   1, -1,  1,
    -1, -1, -1,  -1, -1,  1,  -1,  1,  1,  -1,  1, -1
  ]);

  const cubeIndices = new Uint16Array([
    0,1,2,  0,2,3,   4,5,6,  4,6,7,
    8,9,10, 8,10,11, 12,13,14,12,14,15,
    16,17,18,16,18,19, 20,21,22,20,22,23
  ]);

  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  const aspect = canvas.width / canvas.height;
  const projectionMatrix = perspectiveMatrix(Math.PI / 4, aspect, 0.1, 100);
  const modelViewMatrix = createIdentityMatrix();

  translateMatrix(modelViewMatrix, 0, 0, -6);

  setupScene?.({ gl, program, uModelViewMatrix, uProjectionMatrix, uColor, modelViewMatrix });

  let rotation = 0;

  function render() {
    rotation += 0.01;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    modelViewMatrix[0] = Math.cos(rotation);
    modelViewMatrix[2] = Math.sin(rotation);
    modelViewMatrix[8] = -Math.sin(rotation);
    modelViewMatrix[10] = Math.cos(rotation);

    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
    gl.uniform4f(uColor, 0.8, 0.1, 0.1, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
  }

  render();

  return { canvas, gl };
}
