var resl = require('resl')
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var qs = require('querystring')
var regl = require('regl')()
var solid = require('../solid.js')
var wireframe = require('../wireframe.js')

var state = qs.parse(location.hash.replace(/^#/,''))
if (!state.display) state.display = 'solid'

var camera = require('regl-camera')(regl, {
  center: state.center ? state.center.split(',').map(Number) : [0,0,0],
  theta: Number(state.theta || 0),
  phi: Number(state.phi || 0),
  distance: Number(state.distance || 4)
})
window.camera = camera

window.addEventListener('wheel', recalc)
window.addEventListener('mousemove', recalc)

var neye = []
function recalc (ev) {
  vec3.normalize(neye, camera.eye)
  state.distance = vec3.length(camera.eye)
  state.theta = Math.atan2(neye[2],neye[0])
  state.phi = Math.asin(neye[1])
  location.hash = '#' + qs.stringify(state)
}

window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 0x57) { // w -> wireframe
    state.display = state.display === 'wireframe'
      ? 'solid' : 'wireframe'
    location.hash = '#' + qs.stringify(state)
  }
})

resl({
  manifest: {
    mesh: {
      type: 'text',
      src: '/mesh.json',
      parser: JSON.parse
    }
  },
  onDone: function (assets) {
    var draw = {}
    check()
    regl.frame(function () {
      check()
      regl.clear({ color: [0,0,0,1], depth: true })
      camera(function () { draw[state.display]() })
    })
    function check () {
      if (draw[state.display]) return
      if (state.display === 'wireframe') {
        draw.wireframe = regl(wireframe(assets.mesh))
      } else {
        draw.solid = regl(solid(assets.mesh))
      }
    }
  }
})
