var fs = require("fs");
var stream = require("stream");
var util = require("util");

var output = [];

function rStream(pattern){

    if(!(this instanceof rStream)){
        return( new rStream(pattern));
    }

    stream.Transform.call(this,{
        objectMode: true
    });

    if(!(pattern instanceof RegExp)){
       pattern = new RegExp(pattern, "g");
    }

    this._pattern = this._clonePattern(pattern);
    this._inputBuffer = "";
}

util.inherits(rStream, stream.Transform);

rStream.prototype._clonePattern = function(pattern){
    var parts = pattern.toString().slice(1).split("/");
    var regex = parts[0];
    var flags = (parts[1] || "g");
    if(flags.indexOf("g") === -1){
        flags += "g";
    }

    return(new RegExp(regex, flags));
};

rStream.prototype._transform = function(chunk, encoding, getNextChunk){

    Input(chunk.toString("utf8"));
    this._inputBuffer += chunk.toString("utf8");

    var nextOffset = null;
    var match = null;

    while((match = this._pattern.exec(this._inputBuffer)) !== null){
        if(this._pattern.lastIndex < this._inputBuffer.length){

            this.push(match[0]);
            nextOffset = this._pattern.lastIndex;
        } else {
            nextOffset = match.index;
        }
    }

    if(nextOffset !== null){
        this._inputBuffer = this._inputBuffer.slice(nextOffset);
    }else{
        this._inputBuffer = "";
    }

    this._pattern.lastIndex = 0;
    getNextChunk();
};

rStream.prototype._flush = function(flushCompleted){
    console.log("--------------------OUTPUT--------------------")
    console.log(output)
};

function Input(){
    var input = Array.prototype.slice.call(arguments).map(function(value){
            return(value);
    });
    console.log("--------------------INPUT--------------------")
    console.log.apply(console, input);
}

function Output(){
     var out = Array.prototype.slice.call(arguments).map(function(value){
            return(value);
    });
    output.push(out.toString());
}

var params = process.argv.slice(2);

if(params == ","){
    var iStream = fs.createReadStream("input-sensor.txt");
    var rStream = iStream.pipe(new rStream(/[^,]+/g));
}else if(params == "."){
    var iStream = fs.createReadStream("input-sensor.txt");
    var rStream = iStream.pipe(new rStream(/[^.]+/g));
}else {
    console.log(params);
    console.log("Invalid Param: Enter \'.\' or \',\'");
}

rStream.on("readable", function(){
        var content = null;
        while(content = this.read()){
            Output(content.toString("utf8").trim());
        }
});