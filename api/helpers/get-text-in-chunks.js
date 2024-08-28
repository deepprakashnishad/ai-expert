module.exports = {


  friendlyName: 'BardTextCompletion',


  description: 'Call Bard Text Completion',


  inputs: {
    text:{
      type: "string",
      required: true
    },
    chunkMaxLength: {
    	type: "number",
    	defaultsTo: 1000
    },
    overlapSize: {
      type: "number",
      defaultsTo: 200
    },
    logicalDelimeters:{
      type:"json",
      defaultsTo: "\n+"
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
    let delimiterRegex = new RegExp(inputs.logicalDelimeters);
    var babyChunks = inputs.text.split(delimiterRegex);
    var result = [];
    var tempText = "";

    for(let i=0; i<babyChunks.length; i++){
      var mChunk = babyChunks[i];

      if((tempText.length + mChunk.length)>= inputs.chunkMaxLength && tempText.length>0){
        result.push(tempText);
        tempText = tempText.slice(-1*inputs.overlapSize);
      }

      if(mChunk.trim().length>0){
        tempText = tempText + "\n" + mChunk;
      }
    }
    if(tempText.length>0){
      result.push(tempText);
      tempText = tempText.slice(-1*inputs.overlapSize);  
    }
    return exits.success(result);
  }
};

