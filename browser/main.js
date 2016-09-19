var regl = require('regl')()
var camera = require('regl-camera')(regl, {
  center: [0,0,0],
  distance: 4
})
var resl = require('resl')
var anormals = require('angle-normals')
var mat4 = require('gl-mat4')

resl({
  manifest: {
    mesh: {
      type: 'text',
      src: '/mesh.json',
      parser: JSON.parse
    }
  },
  onDone: function (assets) {
    var draw = Mesh(assets.mesh)
    regl.frame(function () {
      regl.clear({ color: [0,0,0,1], depth: true })
      camera(function () { draw() })
    })
  }
})

function Mesh (mesh) {
  var model = []
  return regl({
    frag: `
      precision mediump float;
      varying vec3 vpos, vnorm;
      void main () {
        float l = max(dot(vec3(0.2,1,-0.3),vnorm)*0.8,
          dot(vec3(-0.3,-1,-0.2),vnorm)*0.05);
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
