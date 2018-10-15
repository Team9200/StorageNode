const fs = require('fs');
const sha256File = require('sha256-file');
const Uint64LE = require("int64-buffer").Uint64LE;
const hound = require('hound');
//var zip = require('file-zip');




function getFilesizeInBytes(filename) {			// get File Name / return File Size

    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;

}


function changeEndianness(str){				// change endian

        const result = [];
        if(str.length % 2 == 1) str = "0"+str;
        let len = str.length - 2;
        while (len >= 0) {
          result.push(str.substr(len, 2));
          len -= 2;
        }
        return result.join('');

}

function string2Byte(str) {				// get ByteString / return Byte 	ex) 1122 >> [buf 11,22]

    var result = [];
    if(str.length % 2 != 0) str = "0"+str;
    while (str.length >= 2) { 
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
    }
    const buf = Buffer.from(result);
    return buf;
}


function toAscii(str) {				// get string / return ascii
	var hex = '';
	for(var i=0;i<str.length;i++) {
		hex += ''+str.charCodeAt(i);
	}
	return hex;
}

function zipCompress(path){


	zip.zipFile([path],'out.zip',function(err){

	    if(err){
	        console.log('zip error',err)
	    }else{
	        console.log('zip success');
	    }
	})

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////


function createStorage(size){	// GB 단위

	const path = "test.storage";
	var data='\0'

	for (var i = 0; i <= 28; i++) {				// 0.5GB 생성
		data+=data;
	}

	for (var i = 0; i < size * 2; i++) {		// 0.5GB 라서 2를 곱함. 

			setTimeout(function() {fs.appendFile(path, data, function (err) { if (err) throw err; console.log('Success!'); });}, 2500*i);
		
	}

}

////////////////////////////////////////////////////////////////////////////////////////////////////////////


function parseHeader(fd){				// Get file handle / return headerinfo object

	return new Promise(function(resolve, reject){
		
		var i=0;
		var limit = getFilesizeInBytes("test.storage")/1024/1024/1024*204;		// file size 당 header 제한값

		for(; i < limit ;i++){

			(function(i,limit){
				this.setTimeout(function(){

				
				try{

					var buffer = new Buffer(1);
				    fs.readSync(fd, buffer,0, 1, 64*i);

					if(buffer == '\0' && i != 0){

						var buf = new Buffer(64);
						fs.readSync(fd, buf,0, 64, 64*(i-1));

						if(buf[0] != 0){

							var HeaderInfo = new Object();
				            HeaderInfo.index = i;
				            HeaderInfo.size = buf.slice(8,16);
				            HeaderInfo.start = buf.slice(16,24);
				            HeaderInfo.block = buf.slice(24,32);
				            HeaderInfo.hash	= buf.slice(32,64);
							resolve(HeaderInfo);
							console.log(buf,i);

						}
					
					}
					if(i == limit-1) resolve(0);

				}
				catch(err){

					//console.log("parseHeader: ", err);

				}

				}, 60);

			})(i,limit);
		}
	
	});

}

/////////////////////////////////////////////////////////////////////////////////////////////////////////

function createHeaderBuffer(analCheck, fileName, startOffset){			// Get 분석여부, File Name, Start offset / return header buffer

	return new Promise(function(resolve, reject){

		var size = getFilesizeInBytes(fileName);	
		var block = Math.ceil(size/1024/1024);

		var anal = new Uint64LE(toAscii(analCheck)).toBuffer();				// 8 Byte							
		var fileSize = new Uint64LE(size).toBuffer();						// 8 Byte
		var offset = new Uint64LE(startOffset).toBuffer();						// 8 Byte
		var usedBlock = new Uint64LE(block).toBuffer();						// 8 Byte	
		var hash = string2Byte(changeEndianness(sha256File(fileName)));     // 32 Byte sha256

		var buffer = Buffer.concat([anal,fileSize,offset,usedBlock, hash],64);	// buffer concat
		resolve(buffer);	

	});

}

var writeHeader = function(fd, index, buffer) {			// Get file handle, header index, header buffer

	return new Promise(function(resolve, reject){

		fs.writeSync(fd, buffer, 0, buffer.langth, 64*index);
	 	resolve();

	});

}

////////////////////////////////////////////////////////////////////////////////////////////////

function updateStorage(targetFile, storageFile ,targetName, offset){		// Get target File handle , Storage File handle, target Name, Start offset / return 0 

	return new Promise(function(resolve, reject){
	
		var srcFileSize= getFilesizeInBytes(targetName);
		var count = Math.ceil(srcFileSize/1024/1024);

		for(var index = 0; index < count ;index++){

			(function(index, count){

				this.setTimeout(function(){

					try{

						var buf = new Buffer(1024*1024);
					    fs.readSync(targetFile, buf,0, buf.length, buf.length*index);
					    writeFile(storageFile ,offset ,buf, index)
						if(index == count-1) resolve(0);

					}
					catch(err){

						console.log("updateStorage function error : ",index,err);
					}

				}, 60);

			})(index,count);

		}
	});

}

function writeFile(fd, offset,buffer, index){		// Get Storage File handle, Start offset, Header buffer, block index / return Null

	return new Promise(function(resolve, reject){

		try{

			fs.writeSync(fd, buffer, 0, buffer.length, offset+(1024*1024*index));  
			resolve();

		}
		catch(err){

			console.log("writeFile Function Error: ",err);
		}


	});
}

////////////////////////////////////////////////////////////////////////////////////////////////

function searchHeader(fd, hash){		// Get Storage File handle, hash / return Headerinfo object

	return new Promise(function(resolve, reject){
		
		var i=0;
		var limit = getFilesizeInBytes("test.storage")/1024/1024/1024*204;
		var HeaderInfo = new Object();

		for(; i < limit ;i++){

			(function(i,limit){
				this.setTimeout(function(){
				try{

					var buf = new Buffer(64);
				    fs.readSync(fd, buf,0, 64, 64*i);

					if(buf.slice(32,64).toString('hex') == changeEndianness(hash)){

						console.log("Find ..");
			           	HeaderInfo.index = i;
			            HeaderInfo.size = buf.slice(8,16);
			            HeaderInfo.start = buf.slice(16,24);
			            HeaderInfo.block = buf.slice(24,32);
			            HeaderInfo.hash	= buf.slice(32,64);
						resolve(HeaderInfo);
					
					}
					if(i == limit - 1) resolve(0);


				}
				catch(err){

					console.log("searchHeader : ",err);

				}

				}, 60);
			})(i,limit);
		}
	
	});

}
                   
function extractFile(resultFile ,fd, offset, size){			// resultFileName handle, Storage handle, Start offset, file size / return 0



	return new Promise(function(resolve, reject){

		var block = Math.floor(size / 1024 / 1024);
		var last = size - (1024*1024*block);
		
		for(var i = 0; i < block;i++){

			(function(i,block){
				this.setTimeout(function(){
				try{

					var buf = new Buffer(1024*1024);
				    fs.readSync(fd, buf,0, buf.length, offset+(1024*1024*i));
				    writeFile(resultFile, 0, buf, i);

					if(i == block-1){

						var buff = new Buffer(last);
						fs.readSync(fd, buff,0, buff.length, offset+(1024*1024*(i+1)));
						writeFile(resultFile, 0, buff, i+1);
				    	resolve(0);

					}

				}
				catch(err){

					//console.log(err);

				}

				}, 60);
			})(i,block);
		}

	});


}
//////////////////////////////////////////////////////////////////////////////////////////


 async function ParseData(){	// return write file header

 	try{
		var fd = await fs.openSync("test.storage", "r+");
	}
	catch(err){

		console.log("ParseData function fs.openSync Error");
	}

	var parse= await parseHeader(fd);					// header를 읽으면서 어느곳이 빈곳인지 확인하고 다음에 어디에 들어가야할지 찾는다.
	var header = new Object();
	console.log(parse);

	if(parse == 0){

		header.index = 0;
		header.offset = getFilesizeInBytes("test.storage")/1024/1024/1024*204*64;

	}
	else{

		header.index = parse.index;
		var block = parseInt("0x"+changeEndianness(parse.block.toString('hex')));
		var start = parseInt("0x"+changeEndianness(parse.start.toString('hex')));
		start += (block * 1024*1024);
		header.offset = start;
		
	}
	await fs.closeSync(fd);

	return header;

}

async function fileRecive(srcFileName, result){		// 파일을 받아와 저장 / Get Source File Name , 분석여부 / return null 

	var header = await ParseData();
	console.log("Header : ",header);

	try{
		var storageFile = fs.openSync("test.storage", "r+");
		var sourceFile = fs.openSync(srcFileName, "r+");
		console.log("oepn Success");
	}
	catch(err){
		console.log(err);
	}

	console.log("creating Header Buffers..")
	console.log(header.offset);
	var buffer= await createHeaderBuffer(result, srcFileName, header.offset);			// write Header
	console.log("writing Header..");
	console.log(buffer);
	await writeHeader(storageFile, header.index, buffer);
	console.log("writing File..");
	await updateStorage(sourceFile,storageFile,srcFileName,header.offset);		//	쓸 파일, 쓰여질 곳, 쓸 파일의 이름, 쓸곳에 시작 주소.
	console.log("Done..");

	await fs.unlinkSync(srcFileName);

	await fs.closeSync(sourceFile);
	await fs.closeSync(storageFile);


}
async function fileExtract(hash){		//	파일을 해쉬값을 통해 추출 / Get hash , return Null

	var storageFile = fs.openSync("test.storage", "r+");
	var search = await searchHeader(storageFile,hash);

	if(search != 0){

		var start = parseInt("0x"+changeEndianness(search.start.toString('hex')));
		var size = parseInt("0x"+changeEndianness(search.size.toString('hex')));
		var hash = changeEndianness(search.hash.toString('hex'));
		var resultFile = await fs.openSync(hash, "w+");
		console.log("Extracting File..");

		await extractFile(resultFile,storageFile, start,size);
		
	}
	else{

		console.log("Not Found!");

	}
	fs.closeSync(storageFile);

	console.log("Done..")

}

////////////////////////////////////////////////////////////////////////////////////////////////

function fileMonitor(){		// storage 라는 폴더를 감시하다가 파일이 생성되면 파일을 storage에 저장.

	watcher = hound.watch('UnknownFiles');
	watcher.on('create', function(file, stats) {
		
		console.log(file + ' was created');
		
		watcher.unwatch('UnknownFiles');
		setTimeout(function(){fileRecive(file,"F");}, 3000);
		fileMonitor();

	});

}
////////////////////////////////////////////////////////////////////////////////////////////////

//createStorage(1);		// storage 파일 생성  arg1 : n GB

//fileMonitor();		// 파일 생성 감시

fileExtract(sha256File("12345678901234567890"));	// 파일 추출 arg1 : hash 
