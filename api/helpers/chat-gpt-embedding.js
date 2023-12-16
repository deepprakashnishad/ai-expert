module.exports = {


  friendlyName: 'CallChatGPT',


  description: 'Call Chat GPT',


  inputs: {
    inputTextArray:{
      type: "json",
      required: true
    },
    model: {
    	type: "string",
    	defaultsTo: "text-embedding-ada-002"
    },
    format: {
      type: "string",
      defaultsTo: "float"
    },
    userId: {
      type: "string"
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
  	try{
      console.log("Creating Embeddings");
      const OpenAI = require("openai");

      const openAI = new OpenAI({
        apiKey: sails.config.custom.OPEN_API_KEY
      });

      console.log("OpenAI instance created successfully");

      var embeddingResponse;

      if(inputs.userId){
        embeddingResponse = await openAI.embeddings.create({
          "model": "text-embedding-ada-002", // Model that creates our embeddings
          "input": inputs.inputTextArray,
          "format": inputs.format,
          "user": inputs.userId
        });
      }else{
        embeddingResponse = await openAI.embeddings.create({
          "model": "text-embedding-ada-002", // Model that creates our embeddings
          "input": inputs.inputTextArray,
          "format": inputs.format
        });
      }
      console.log("Recieved response");
      return exits.success(embeddingResponse.data);
  	}catch(e){
  		console.log(e);
  	}  	
  }
};

