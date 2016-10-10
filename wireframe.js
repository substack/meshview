var wireframe = require('screen-projected-lines')
var glx = require('glslify')

module.exports = function (mesh) {
  var model = []
  var wmesh = wireframe(mesh)
  return {
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
  }
}
