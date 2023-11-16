const OpenAI = require("openai");

module.exports = {


  friendlyName: 'CallChatGPT',


  description: 'Call Chat GPT',


  inputs: {
    url:{
      type: "string",
      required: true
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
  	try{

      const rp = require('request-promise');
      const { convert } = require('html-to-text');

      const options = {
        "baseElements.selectors": [{selector: 'p'}]
      };
      console.log(html);
      var html = await rp(inputs.url);
      const text = convert(html, options);
      
      console.log(text);

      return exits.success(text);
  	}catch(e){
  		console.log(e);
  	}  	
  }
};

