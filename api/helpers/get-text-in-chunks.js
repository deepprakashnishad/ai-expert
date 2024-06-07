module.exports = {


  friendlyName: 'BardTextCompletion',


  description: 'Call Bard Text Completion',


  inputs: {
    text:{
      type: "string",
      required: true
    },
    chunkMaxLength: {
    	type: "string",
    	defaultsTo: "1000"
    },
    overlapSize: {
      type: "number",
      defaultsTo: 100
    },
    logicalDelimeters:{
      type:"json",
      defaultsTo: ["\n\n", "\n"]
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {

    var babyChunks = inputs.text.split(inputs.logicalDelimeters);
    var result = [];
    var tempText = "";

    for(let i=0; i<babyChunks.length; i++){
      var mChunk = babyChunks[i];

      if((tempText.length + mChunk.length)>= inputs.chunkMaxLength && tempText.length>0){
        result.push(tempText);
        tempText = "";
      }

      if(mChunk.trim().length>0){
        tempText = tempText + "\n" + mChunk;
      }
    }
    if(tempText.length>0){
      result.push(tempText);
      tempText = "";  
    }
    return exits.success(result);
  }
};

