var rp = require('request-promise');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Blockchain = require('./mine');
var bitcoin = new Blockchain();
var uuid = require('uuid/v1');
var nodeAddress = uuid().split('-').join('');
var port = process.argv[2];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// 웹 브라우저에 get 방식으로 /blockchain 주소를 입력했을 때 실행

app.get('/blockchain', function(req, res) {
  res.send(bitcoin);
})

// 웹 브라우저에 post 방식으로 /transaction 주소를 입력했을 때 실행
app.post('/transaction', function(req, res) {
  const blockIndex = bitcoin.addNewTransaction(req.body.transaction);
  res.send({note: `트랜잭션은 ${blockIndex} 블락안으로 들어갈 예정입니다.`})
})

app.post('/intelligence', function(req,res) {
  const blockIndex = bitcoin.addNewMalware(req.body.malware);
  res.send({note: `malwares 정보는 ${blockIndex} 블락안으로 들어갈 예정입니다.`})
})

app.get('/mine', function(req, res){
  const newBlock = bitcoin.miningBlock();
  res.json({
    note: "새로운 블락이 성공적으로 만들어 졌습니다.",
    newBlock: newBlock
  })
})

// 새로운 노드를 등록하고 전체 네트워크에 알림

app.post('/register-and-broadcast-node',function(req,res){
  const newNodeUrl = req.body.newNodeUrl;
  if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {
    bitcoin.networkNodes.push(newNodeUrl);
  }
  const reqNodesPromises = [];
  bitcoin.networkNodes.forEach(networkNode => {
    const requestOption = {
      uri: networkNodesUrl + '/register-node',
      method: 'POST',
      body: {newNodeUrl:newNodeUrl},
      json: true
    };

    reqNodesPromises.push(rp(requestOption))
  });

  Promise.all(reqNodesPromises)
  .then(data=> {
    const bulkRegiterOption = {
      uri : newNodeUrl + '/register-nodes-bulk',
      method : 'POST',
      body: {allNetworkNodes : [...bitcoin.networkNodes,bitcoin.currnetNodeUrl]},
      json: true
    };

    return rq(bulkRegiterOption);
  }).then(data => {
    res.json({nodt : "새로운 노드가 네트워크에 성공적으로 등록이 되었습니다."});
  })
})

app.post('/register-node',function(req,res){
  //새로운 노드 주소
  const newNodeUrl = req.body.newNodeUrl;
  //코인 네트워크에 새로운 노드의 주소가 없다면,
  const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
  //코인의 현재 url이 새로운 노드 주소가 아니라면, 즉 현재 접속한 주소와 중복되지 않는다면,
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl;

  if(nodeNotAlreadyPresent&&notCurrentNode){
  //코인 전체 네트워크에 새로운 주소 등록
  bitcoin.networkNodes.push(newNodeUrl);
  res.json({note: "새로운 노드가 등록되었습니다."})
  }

})

app.post('/register-nodes-bulk',function(req,res){

})

app.get('/search', function(req, res){
  const result = bitcoin.searchBy("sha256","00657A02ABA42D7E31836B5B226F9E6E2D3080482710F9E6B89849E13C70D8C5");
  res.json({
    result: result
  })
})

app.listen(port, function() {
  console.log(`listening on port ${port}...`);
})
