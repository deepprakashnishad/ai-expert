module.exports = {


  friendlyName: 'Web Scrapper',


  description: 'Extract text from html for given url',


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
        /*"baseElements.selectors": [
          {selector: 'p'},
        ]*/
      };

      var html = await rp(inputs.url);

      const text = convert(html, options);
      
      var result = await sails.helpers.getTextInChunks.with({"text": text});
      return exits.success(result);
  	}catch(e){
  		console.log(e);
  	}  	
  }
};

