const OpenAI = require("openai");

module.exports = {


  friendlyName: 'BardTextCompletion',


  description: 'Call Bard Text Completion',


  inputs: {
    messages:{
      type: "json",
      required: true
    },
    model: {
    	type: "string",
    	defaultsTo: "gpt-3.5-turbo"
    },
    temperature:{
      type:"number",
      defaultsTo: 0.5
    },
    max_tokens: {
      type: "number",
      defaultsTo: 16
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
  	
      return exits.success("To be implemented");
  }
};

