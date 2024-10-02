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

      let html;

      try{
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto(inputs.url);
        await page.waitForSelector('body'); 
        html = await page.content();
      }catch(e){
        const rp = require('request-promise');
        html = await rp(inputs.url);
      }

      const options = {
        selectors: [
          { selector: 'p', options: { ignoreHref: true } }, // Convert <p> elements
          { selector: 'img', options: { ignoreImage: true } }, // Ignore <img> elements
          { selector: 'h1', options: { ignoreHref: true } }, // Ignore <h1> elements
          { selector: 'h2', options: { ignoreHref: true } }, // Ignore <h2> elements
          { selector: 'h3', options: { ignoreHref: true } }, // Ignore <h3> elements
        ]
      };

      var text = convert(html, options);

      console.log(text);
      if(text.length===0){
        return exits.success([]);
      }

      // text = text.split('\n').filter(line => !line.includes('data:image')).join('\n');
      text = text
      .split('\n')
      .filter(line => 
        line.trim() !== '' && // Remove empty lines
        !line.includes('data:image') && // Ignore data URIs
        !line.includes('javascript:void(0);') && // Ignore JS void links
        !line.includes('http://') && // Optionally ignore HTTP links
        !line.includes('https://') // Optionally ignore HTTPS links
      )
      .join('\n');
      
      var result = await sails.helpers.getTextInChunks.with({"text": text});
      return exits.success(result);
  	}catch(e){
      console.log(e);
      return exits.success([]);
  	}  	
  }
};

