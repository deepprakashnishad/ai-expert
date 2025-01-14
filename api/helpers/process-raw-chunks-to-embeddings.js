module.exports = {


  friendlyName: 'ProcessRawChunksToEmbeddings',


  description: 'This helper converts scrapped raw data chunks to useful informations and saves to db with their embeddings',


  inputs: {
    chunks:{
      type: "json",
      required: true
    },
    personId:{
      type: "json",
      required: false
    },
    botId:{
      type: "string",
      required: false
    },
    agentId:{
      type: "string",
      required: false
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
    metadata: {
      type: "json"
    },
    clientId: {
      type: "string"
    },
    data_key:{
      type: "string",
      defaultsTo: "pageContent"
    },
    doc_id:{
      type: "string",
      required: true
    },
    chunksToInfoFlag: {
      type: "boolean",
      defaultsTo: false
    },
    cvectorId: {
      type: "string"
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
    console.log("Converting raw data to useful information");
    var infoArray = inputs.chunks;
    if(inputs.chunksToInfoFlag){
      infoArray = await sails.helpers.processChunksToInfo.with({chunks: inputs.chunks});
    }
    
    console.log("Useful information retrieved");
    var temp = [];
    var embeddingData = [];

    console.log("Creating embeddings");
    for(let i=0;i<infoArray.length;i++){
      var inputText = infoArray[i];

      if(typeof inputText !== "string"){
        inputText = JSON.stringify(inputText);
      }

      if((temp.join(",").length+inputText.length) >= inputs.maxEmbeddingInputLength || i===infoArray.length-1){
        if(temp.length===0 && inputText.length>0){
          temp.push(inputText);
        }
        if(temp.length>0){
          var embResult = await sails.helpers.chatGptEmbedding.with({inputTextArray: temp, userId: inputs.personId});   
          for(var embedding of embResult){
            embeddingData.push({
              p: inputs.personId, 
              b:inputs.botId, 
              it: temp[embedding.index], 
              e: embedding.embedding, 
              a: inputs.agentId, 
              md: inputs.metadata,
              cid: inputs.clientId,
              d: inputs.doc_id
            });
          }  
        }
        
        temp = [];
        temp.push(inputText);
      }else{
        temp.push(inputText);
        inputText="";
      }
    }
    
    if(temp.length>0){
      var embResult = await sails.helpers.chatGptEmbedding.with({inputTextArray: temp, userId: inputs.personId});   
      for(var embedding of embResult){
        embeddingData.push({
          p: inputs.personId, 
          b:inputs.botId, 
          it: temp[embedding.index], 
          e: embedding.embedding, 
          a: inputs.agentId, 
          md: inputs.metadata,
          cid: inputs.clientId,
          d: inputs.doc_id
        });
      }
    }

    if(embeddingData.length>0){
      if(embeddingData.length>1 || (embeddingData.length===1 && !inputs.cvectorId)){
        await Cvector.createEach(embeddingData);
      } else if(embeddingData.length===1 && inputs.cvectorId){
        await Cvector.updateOne({id: inputs.cvectorId}).set(embeddingData[0]);
      }
    }
    
    return exits.success(infoArray);
  }
};
