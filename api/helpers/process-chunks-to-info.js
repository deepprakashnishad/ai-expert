module.exports = {


  friendlyName: 'ProcessRawChunksToEmbeddings',


  description: 'This helper converts scrapped raw data chunks to useful informations',


  inputs: {
    chunks:{
      type: "json",
      required: true
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
    var infoArray = [];
    for(let i=0;i < inputs.chunks.length; i++){
      console.log(`Processing chunk ${i+1} out of ${inputs.chunks.length}`);
      var chunk = inputs.chunks[i];
      var mPrompt = `Breakdown the text enclosed in triple hash in small text into logical section without loosing, ignoring and skipping any text ###${chunk}###. Your reply should be proper json array and must contain every peice of information given in triple hash.`;
      var response = await sails.helpers.callChatGpt.with(
        {
          messages: [{"role": "system", "content": mPrompt}], 
          max_tokens: 4096
        }
      );
      console.log(response[0].message.content)
      var resContent = JSON.parse(response[0].message.content);
      console.log(`Chunk ${i+1} processed successfully`);
      infoArray = infoArray.concat(resContent);
    }
    return exits.success(infoArray);
  }
};
