module.exports = {


  friendlyName: 'CallChatGPT',


  description: 'Call Chat GPT',


  inputs: {
    messages:{
      type: "json",
      required: true
    },
    model: {
    	type: "string",
    	defaultsTo: "gpt-3.5-turbo-0125"
    },
    temperature:{
      type:"number",
      defaultsTo: 0.5
    },
    max_tokens: {
      type: "number",
      defaultsTo: 16
    },
    response_format: {
      type: "string",
      defaultsTo: "json_object"
    },
    tools: {
      type: "json",
      defaultsTo: []
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
  	try{
      const OpenAI = require("openai");

      const openAI = new OpenAI({
        apiKey: sails.config.custom.OPEN_API_KEY
      })
      var resp;
      if(inputs.tools && inputs.tools.length > 0){
        resp = await openAI.chat.completions.create({
          "response_format": { "type": inputs.response_format },
          "messages": inputs.messages,
          "model": 'gpt-3.5-turbo',
          "max_tokens": inputs.max_tokens,
          "temperature": inputs.temperature,
          "tools": inputs.tools
        });
      }else{
        resp = await openAI.chat.completions.create({
          "response_format": { "type": inputs.response_format },
          "messages": inputs.messages,
          "model": 'gpt-3.5-turbo',
          "max_tokens": inputs.max_tokens,
          "temperature": inputs.temperature
        });
      }
			
      // console.log(resp);
      return exits.success(resp.choices);
  	}catch(e){
  		console.log(e);
  	}  	
  }
};

