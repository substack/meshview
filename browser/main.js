var glx = require('glslify')
var resl = require('resl')
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')
var vec3 = require('gl-vec3')
var wlines = require('screen-projected-lines')
var qs = require('querystring')
var regl = require('regl')()

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
        draw.wireframe = wireframe(assets.mesh)
      } else {
        draw.solid = solid(assets.mesh)
      }
    }
  }
})

function solid (mesh) {
  var model = []
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vpos, vnorm;
      void main () {
        float l = 0.0
          + max(0.0,dot(normalize(vec3(0.2,1,-0.3)),vnorm))*0.8
          + max(0.0,dot(normalize(vec3(-0.3,-0.5,-0.2)),vnorm))*0.2
          + max(0.0,dot(normalize(vec3(0.8,-0.2,0.5)),vnorm))*0.2
        ;
        gl_FragColor = vec4(l,l,l,1);
      }
    `,
    vert: `
      precision mediump float;
      uniform mat4 projection, view, model;
      attribute vec3 position, normal;
      varying vec3 vnorm, vpos;
      void main () {
        vnorm = normal;
        vpos = position;
        gl_Position = projection * view * model * vec4(position,1);
      }
    `,
    attributes: {
      position: mesh.positions,
      normal: anormals(mesh.cells, mesh.positions)
    },
    uniforms: {
      model: function () {
        return mat4.identity(model)
      }
    },
    elements: mesh.cells
  })
}

function wireframe (mesh) {
  var model = []
  var wmesh = wlines(mesh)
  return regl({
    frag: `
      precision mediump float;
      void main () {
        gl_FragColor = vec4(1,1,1,1);
      }
    `,
    vert: glx`
      precision mediump float;
      #pragma glslify: linevoffset = require('screen-projected-lines')
      uniform mat4 projection, view, model;
      uniform float aspect;
      attribute vec3 position, nextpos;
      attribute float direction;
      void main () {
        mat4 proj = projection * view * model;
        vec4 p = proj * vec4(position,1);
        vec4 n = proj * vec4(nextpos,1);
        vec4 offset = linevoffset(p,n,direction,aspect);
        gl_Position = p + offset * 0.01;
      }
    `,
    attributes: {
      position: wmesh.positions,
      nextpos: wmesh.nextPositions,
      direction: wmesh.directions
    },
    uniforms: {
      model: function () {
        return mat4.identity(model)
      },
      aspect: function (context) {
        return context.viewportWidth / context.viewportHeight
      }
    },
    elements: wmesh.cells
  })
}
