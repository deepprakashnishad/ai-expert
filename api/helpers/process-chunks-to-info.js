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
    for(let i=0;i < inputs.chunks.length-1; i++){
      console.log(`Processing chunk ${i+1} out of ${inputs.chunks.length}`);
      var chunk = inputs.chunks[i];
      console.log(chunk);
      console.log(`Chunk Length - ${chunk.length}`);
      var mPrompt = `Combine all information in small logical section from the text enclosed in triple hash ###${chunk}###. Your reply should be formatted in an json array`;
      var response = await sails.helpers.callChatGpt.with(
        {
          messages: [{"role": "system", "content": mPrompt}], 
          max_tokens: 2000
        }
      );
      var resContent = JSON.parse(response[0].message.content);
      console.log(`Chunk ${i+1} processed successfully`);
      infoArray = infoArray.concat(resContent);
    }
    return exits.success(infoArray);
  }
};
