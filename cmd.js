#!/usr/bin/env node
var http = require('http')
var path = require('path')
var minimist = require('minimist')
var argv = minimist(process.argv.slice(2), {
  alias: { p: 'port' },
  default: { port: 7420 }
})
var st = require('ecstatic')({
  root: path.join(__dirname,'public'),
  gzip: true
})

var concat = require('concat-stream')
var mesh = null, meshqueue = []
process.stdin.pipe(concat(function (body) {
  mesh = body
  meshqueue.forEach(function (q) { q(body) })
  meshqueue = null
}))

var server = http.createServer(function (req, res) {
  if (req.url === '/mesh.json') {
    res.setHeader('content-type', 'text/json')
    if (mesh) res.end(mesh)
    else meshqueue.push(function (mesh) { res.end(mesh) })
  } else st(req,res)
})
server.listen(argv.port, function () {
  var href = 'http://localhost:' + server.address().port
  console.log(href)
})
