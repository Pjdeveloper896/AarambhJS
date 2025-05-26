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

  // Basic shader sources (vertex and fragment)
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

  // Compile shaders & create program
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

  // Locations
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const uModelViewMatrix = gl.getUniformLocation(program, 'uModelViewMatrix');
  const uProjectionMatrix = gl.getUniformLocation(program, 'uProjectionMatrix');
  const uColor = gl.getUniformLocation(program, 'uColor');

  // Matrices utility (simple, use gl-matrix if you want advanced)
  function createIdentityMatrix() {
    return new Float32Array([
      1,0,0,0,
      0,1,0,0,
      0,0,1,0,
      0,0,0,1
    ]);
  }

  // Simple perspective matrix
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

  // Simple translation for modelView matrix
  function translateMatrix(m, tx, ty, tz) {
    m[12] = tx;
    m[13] = ty;
    m[14] = tz;
  }

  // Cube vertex data
  const cubeVertices = new Float32Array([
    // Front face
    -1, -1,  1,
     1, -1,  1,
     1,  1,  1,
    -1,  1,  1,
    // Back face
    -1, -1, -1,
    -1,  1, -1,
     1,  1, -1,
     1, -1, -1,
    // Top face
    -1,  1, -1,
    -1,  1,  1,
     1,  1,  1,
     1,  1, -1,
    // Bottom face
    -1, -1, -1,
     1, -1, -1,
     1, -1,  1,
    -1, -1,  1,
    // Right face
     1, -1, -1,
     1,  1, -1,
     1,  1,  1,
     1, -1,  1,
    // Left face
    -1, -1, -1,
    -1, -1,  1,
    -1,  1,  1,
    -1,  1, -1
  ]);

  // Indices for cube faces (two triangles each)
  const cubeIndices = new Uint16Array([
    0,1,2,  0,2,3,     // front
    4,5,6,  4,6,7,     // back
    8,9,10, 8,10,11,   // top
    12,13,14,12,14,15, // bottom
    16,17,18,16,18,19, // right
    20,21,22,20,22,23  // left
  ]);

  // Setup buffers
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, cubeIndices, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  // Setup projection and model view matrices
  const aspect = canvas.width / canvas.height;
  const projectionMatrix = perspectiveMatrix(Math.PI / 4, aspect, 0.1, 100);
  const modelViewMatrix = createIdentityMatrix();

  translateMatrix(modelViewMatrix, 0, 0, -6);

  // Render loop variables
  let rotation = 0;

  // User setupScene callback gets access to gl and can customize if needed
  setupScene && setupScene({ gl, program, uModelViewMatrix, uProjectionMatrix, uColor, modelViewMatrix });

  function render() {
    rotation += 0.01;

    // Clear screen
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.1, 0.1, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    // Rotate cube on Y axis
    modelViewMatrix[0] = Math.cos(rotation);
    modelViewMatrix[2] = Math.sin(rotation);
    modelViewMatrix[8] = -Math.sin(rotation);
    modelViewMatrix[10] = Math.cos(rotation);

    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);
    gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);
    gl.uniform4f(uColor, 0.8, 0.1, 0.1, 1);

    // Draw cube
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, cubeIndices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render);
  }

  render();

  return { canvas, gl };
}
