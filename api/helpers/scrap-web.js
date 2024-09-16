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

      const puppeteer = require('puppeteer');
      const { convert } = require('html-to-text');

      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.goto(inputs.url);
      await page.waitForSelector('body'); 
      const html = await page.content();

      const options = {
        "baseElements.selectors": [
          {selector: 'p'},
        ]
      };

      /*const rp = require('request-promise');
      var html = await rp(inputs.url);*/

      const text = convert(html, options);
      if(text.isEmpty()){
        return exits.success([]);
      }
      
      var result = await sails.helpers.getTextInChunks.with({"text": text});
      return exits.success(result);
  	}catch(e){
  		console.log(e);
  	}  	
  }
};

