var anormals = require('angle-normals')
var mat4 = require('gl-mat4')

module.exports = function (mesh) {
  var model = []
  return {
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
  }
}
