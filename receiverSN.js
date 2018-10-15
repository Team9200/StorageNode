'use strict'


const libp2p = require('libp2p')
const TCP = require('libp2p-tcp')
const Mplex = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
const PeerInfo = require('peer-info')
const MulticastDNS = require('libp2p-mdns')
const waterfall = require('async/waterfall')
const parallel = require('async/parallel')
const defaultsDeep = require('@nodeutils/defaults-deep')
const pull = require('pull-stream')
const Bootstrap = require('libp2p-railing')
const PeerId = require('peer-id')

const fs = require('fs')

class StorageNode extends libp2p {
	constructor (_options) {
		const defaults = {
modules: {
transport: [ TCP ],
		   streamMuxer: [ Mplex ],
		   connEncryption: [ SECIO ],
		   peerDiscovery: [ MulticastDNS, Bootstrap ]
		 },
config: {
peerDiscovery: {
mdns: {
interval: 1000,
		  enabled: false
	  },
bootstrap: {
interval: 1000,
		  enabled: false,
		  list: _options.bootstrapList
		   }
			   },

EXPERIMENTAL: {
pubsub: true
			  }
		}
		}

		super(defaultsDeep(_options, defaults))
	}
}


function printAddrs (node) {
	console.log('node is listening on:')
		node.peerInfo.multiaddrs.forEach((ma) => console.log(ma.toString()))
}

function fileToSN(protocol, conn) {
	pull(
			conn, 
			pull.map((v) => v.toString()),
			pull.collect((err, data) => {
				fs.writeFile('./UnknownFiles/unknown'+ new Date().getTime(), data, (err) => {})
				})
		)
}

function metaToSN(protocol, conn) {
	pull(
			conn,
			pull.map((v) => v.toString()),
			pull.collect((err, data) => {
				fs.writeFile('./TransPool/tmptrans'+ new Date().getTime(), data, (err) => {})
				})
		)
}        

waterfall([
		(cb) => {
		PeerId.createFromJSON(require('./nodeInfo.json'), (err, peerId) => {
				if (err) { throw err }
				cb(null, peerId)
				})
		}
], (err, peerId) => {
if (err) { throw err }
const receiverSN = new PeerInfo(peerId)
receiverSN.multiaddrs.add('/ip4/0.0.0.0/tcp/10333')
const node = new StorageNode({
peerInfo: receiverSN
})

node.start((err) => {
		if (err) { throw err }
		node.handle('/fileToSN', fileToSN)
		node.handle('/metaToSN', metaToSN)

		console.log("recv SN start")
		})
})
