# StorageNode

mkdir TransPool
mkdir UnknownFiles

node receiverNS.js     ->     receiver p2p node create
node MakeBlockChain.js     ->     make block chain

TransPool에 json포멧 파일 3개 생기면 BlockChain 생성 시작 -> malwareList에 json 배열로 들어가고 mining이 완료된 블록이 rach.json 파일로 저장
