module.exports = {


  friendlyName: 'ProcessRawChunksToEmbeddings',


  description: 'This helper converts scrapped raw data chunks to useful informations and saves to db with their embeddings',


  inputs: {
    chunks:{
      type: "json",
      required: true
    },
    textModel: {
      type: "string",
      defaultsTo: "gpt-3.5-turbo"
    },
    embeddingModel: {
      type: "string",
      defaultsTo: "text-embedding-ada-002"
    },
    maxEmbeddingInputLength: {
      type: "number",
      defaultsTo: 8000
    },
    data_key:{
      type: "string",
      defaultsTo: "pageContent"
    },
    doc_id:{
      type: "string",
      required: true
    },
    cat: {
      type: "string",
      defaultsTo: "generic"
    },
    itt:{
      type: "string",
      defaultsTo: "text"
    },
    clientId: {
      type: "string"
    },
    agent: {
      type: "string"
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
    var temp = [];
    var embeddingData = [];

    console.log("Creating embeddings");
    for(let i=0;i<inputs.chunks.length;i++){
      var inputText = inputs.chunks[i][inputs.data_key];

      if(typeof inputText !== "string"){
        inputText = JSON.stringify(inputText);
      }

      if((temp.join(",").length+inputText.length) >= inputs.maxEmbeddingInputLength || i===inputs.chunks.length-1){
        temp.push(inputText);
        console.log(`Embedding completed for ${i+1}/${inputs.chunks.length}`);
        var embResult = await sails.helpers.chatGptEmbedding.with({inputTextArray: temp, userId: inputs.personId});   
        for(var embedding of embResult){
          embeddingData.push({
            it: temp[embedding.index], 
            e: embedding.embedding, 
            md: inputs.chunks[i].metadata,
            cat: inputs.cat,
            itt: inputs.itt,
            d: inputs.doc_id,
            cid: inputs.clientId,
            aid: inputs.agent
          });
        }
        temp = [];
      }else{
        temp.push(inputText);
      }
    }
    console.log("Embeddings created");
    await Cvector.createEach(embeddingData);
    console.log("Embeddings saved to database");
    return exits.success(true);
  }
};
