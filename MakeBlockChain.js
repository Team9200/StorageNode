'use strict'

const hound = require('hound')
const fs = require('fs')
const witness = require('./witness')

let transNum = 0
let transJsonList = new Array()

function transMonitor() {
	const watcher = hound.watch('TransPool')
	watcher.on('create', (tmpTrans, stat) => {
		console.log('Trans ' + tmpTrans + ' in')
		var data = fs.readFileSync(tmpTrans)
		var jsondata = JSON.parse(data)
		console.log('JSON in' + jsondata)
		transJsonList.push(jsondata)
		transNum = transNum + 1

		watcher.unwatch('TransPool')
		setTimeout(() => { 
			if(transNum == 3) {
				console.log(transJsonList)
				var localChain = witness.readChain("rach.json")
				localChain.pendingMalwares = transJsonList
				localChain.miningBlock()
				witness.writeChain(localChain, "rach.json")
				transNum = 0
				transJsonList.length = 0
			}
		}, 3000);

		transMonitor()
	})
}

transMonitor()


