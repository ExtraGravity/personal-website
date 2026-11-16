<template>
  <svg class="wire-shape" :viewBox="`0 0 ${SIZE} ${SIZE}`" aria-hidden="true">
    <polygon
      v-for="f in faces"
      :key="f.id"
      :points="f.pts"
      :fill="f.fill"
    />
    <path class="wire-edges" :d="pathData" :style="{ opacity: edgeOpacity }" />
  </svg>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

/* A slowly rotating icosahedron (20 faces). Each frame we rotate the 12
   vertices, perspective-project them, shade the front-facing triangles by a
   fixed light direction (varied tint), and overlay thin wireframe edges. */
const SIZE = 240          // viewBox units
const C = SIZE / 2        // centre
const R = 34              // projection scale
const CAM = 6             // camera distance (perspective strength)
const TINT = '42, 245, 255'   // --accent, as rgb channels for rgba() fills
const LIGHT = (() => {        // normalized light direction (front-top-right)
  const v = [0.4, 0.6, 1]
  const m = Math.hypot(...v)
  return v.map((c) => c / m)
})()

// 12 vertices: cyclic permutations of (0, ±1, ±φ)
const phi = (1 + Math.sqrt(5)) / 2
const verts = [
  [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
  [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
  [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1],
]
// 30 edges (vertex pairs one edge-length, ²=4, apart) + adjacency
const edges = []
const adj = verts.map(() => new Set())
for (let i = 0; i < verts.length; i++) {
  for (let j = i + 1; j < verts.length; j++) {
    const dx = verts[i][0] - verts[j][0]
    const dy = verts[i][1] - verts[j][1]
    const dz = verts[i][2] - verts[j][2]
    if (Math.abs(dx * dx + dy * dy + dz * dz - 4) < 0.01) {
      edges.push([i, j])
      adj[i].add(j); adj[j].add(i)
    }
  }
}
// 20 triangular faces: mutually-adjacent vertex triples (i<j<k)
const faceIdx = []
for (let i = 0; i < 12; i++)
  for (const j of adj[i]) if (j > i)
    for (const k of adj[j]) if (k > j && adj[i].has(k)) faceIdx.push([i, j, k])

const faces = ref([])
const pathData = ref('')
const edgeOpacity = ref(0.5)   // bright while tracing in, dims as faces arrive
let raf = null
let ax = 0.4   // tilt so it doesn't read as a flat ring
let ay = 0
const BASE = 0.0004   // idle spin — very slow when nothing is happening

// Interactions add a burst of spin that decays back to BASE. Two channels so
// hover and click can jerk over different timescales: hover is quick/snappy,
// click delivers more movement and lingers a little longer.
let fast = 0
let slow = 0
function kick(amount, snappy = true) {
  if (snappy) fast += amount
  else slow += amount
}
defineExpose({ kick })

/* one-time load-in: edges trace on first, then faces tint in. Frame-counted
   (not wall-clock) so it always plays out whenever rendering happens — e.g.
   if the page first loads in a background tab and is viewed later. */
const START_DELAY = 1500    // ms — begin just before the header starts typing (1.8s)
const EDGE_STEP = 1 / 66    // ~1.1s of edge-drawing at 60fps
const FACE_STEP = 1 / 78    // ~1.3s for the staggered face fade-in
const FACE_STAGGER = 0.6    // fraction of the face stage spent offsetting starts
const FLASH = 3           // how much brighter a face flashes as it appears
let startTime = 0
let edgeProg = 0     // 0→1 fraction of edges drawn
let faceProg = 0
const easeOut = (t) => 1 - (1 - t) * (1 - t)
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t)

// trig hoisted out of the per-vertex loop — set once per frame in render()
let cosAY = 1, sinAY = 0, cosAX = 1, sinAX = 0
function rotate([x, y, z]) {
  const x1 = x * cosAY + z * sinAY
  const z1 = -x * sinAY + z * cosAY
  return [x1, y * cosAX - z1 * sinAX, y * sinAX + z1 * cosAX]
}
function project([x, y, z]) {
  const p = CAM / (CAM - z)
  return [C + x * R * p, C + y * R * p]
}

function render() {
  cosAY = Math.cos(ay); sinAY = Math.sin(ay)
  cosAX = Math.cos(ax); sinAX = Math.sin(ax)
  const r3 = verts.map(rotate)       // rotated 3D
  const p2 = r3.map(project)         // projected 2D
  const fs = []
  for (let f = 0; f < faceIdx.length; f++) {
    const [a, b, c] = faceIdx[f]
    const A = r3[a], B = r3[b], D = r3[c]
    // face normal
    let nx = (B[1] - A[1]) * (D[2] - A[2]) - (B[2] - A[2]) * (D[1] - A[1])
    let ny = (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2])
    let nz = (B[0] - A[0]) * (D[1] - A[1]) - (B[1] - A[1]) * (D[0] - A[0])
    // orient outward (centroid points away from the origin on a convex solid)
    if (nx * (A[0] + B[0] + D[0]) + ny * (A[1] + B[1] + D[1]) + nz * (A[2] + B[2] + D[2]) < 0) {
      nx = -nx; ny = -ny; nz = -nz
    }
    if (nz <= 0) continue            // cull back faces
    // staggered fade-in: each face starts a little after the previous one
    const p = clamp01((faceProg - (f / faceIdx.length) * FACE_STAGGER) / (1 - FACE_STAGGER))
    if (p <= 0) continue             // this face hasn't started yet
    // fade in while flashing brighter than the resting tint, then settle to it
    const m = easeOut(p) + FLASH * 4 * p * (1 - p)
    const len = Math.hypot(nx, ny, nz) || 1
    const bright = Math.max(0, (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / len)
    const alpha = ((0.015 + bright * 0.055) * m).toFixed(3)
    fs.push({
      id: f,
      pts: `${p2[a][0].toFixed(1)},${p2[a][1].toFixed(1)} ${p2[b][0].toFixed(1)},${p2[b][1].toFixed(1)} ${p2[c][0].toFixed(1)},${p2[c][1].toFixed(1)}`,
      fill: `rgba(${TINT}, ${alpha})`,
    })
  }
  faces.value = fs
  // edges trace on in order; the frontier edge grows from start → end
  const drawn = edgeProg * edges.length
  let d = ''
  for (let k = 0; k < edges.length && k < drawn; k++) {
    const [i, j] = edges[k]
    const a = p2[i], b = p2[j]
    const t = Math.min(1, drawn - k)
    const ex = a[0] + (b[0] - a[0]) * t
    const ey = a[1] + (b[1] - a[1]) * t
    d += `M${a[0].toFixed(1)} ${a[1].toFixed(1)}L${ex.toFixed(1)} ${ey.toFixed(1)}`
  }
  pathData.value = d
}

function frame() {
  // load-in (after the start delay): advance edges first, then the face fade-in
  if (performance.now() - startTime >= START_DELAY) {
    if (edgeProg < 1) edgeProg = Math.min(1, edgeProg + EDGE_STEP)
    else if (faceProg < 1) faceProg = Math.min(1, faceProg + FACE_STEP)
  }
  // edges trace in bright, then recede to their faint resting opacity as the
  // faces fade in — a one-shot transition, so stop writing once it settles
  if (faceProg < 1) edgeOpacity.value = 0.12 + (1 - faceProg) * 0.4
  else if (edgeOpacity.value !== 0.12) edgeOpacity.value = 0.12

  // decay each channel toward 0 (faster decay = burst spent in less time;
  // kicks are scaled up to match so the total rotation distance is unchanged)
  fast *= 0.68   // snappy (hover)
  slow *= 0.83   // lingers a little longer (click)
  const speed = BASE + fast + slow
  ay += speed
  ax += speed * 0.4
  render()
  raf = requestAnimationFrame(frame)
}

onMounted(() => {
  // reduced motion: skip the build-in and rotation, show the finished shape
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    edgeProg = faceProg = 1
    edgeOpacity.value = 0.12
    render()
    return
  }
  startTime = performance.now()
  frame()
})
onUnmounted(() => raf && cancelAnimationFrame(raf))
</script>

<style scoped>
.wire-shape {
  position: fixed;
  top: 50%;
  left: 50%;
  width: min(86vw, 86vh);
  height: min(86vw, 86vh);
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 1;
}
.wire-edges {
  fill: none;
  stroke: var(--accent);
  stroke-width: 0.5;
  stroke-linejoin: round;
  /* round caps + zero-length dashes = dots */
  stroke-linecap: round;
  stroke-dasharray: 0 1.6;
  /* opacity is driven inline by the load-in (bright while tracing, then faint) */
}
</style>
