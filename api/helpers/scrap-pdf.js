const PDFExtract = require('pdf.js-extract').PDFExtract;

module.exports = {

  friendlyName: 'PDF Text Extractor',


  description: 'Extract text from pdf',


  inputs: {
    path:{
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
      const pdfExtract = new PDFExtract();

      const options = {}; /* see below */
      var data = await pdfExtract.extract(inputs.path, options);

      var finalText = "";

      for(var i=0;i<data.pages.length;i++){
        var content = data.pages[i].content;
        var oldXPosition = 0;
        for(var j=0; j<content.length; j++){
          if(content[j].x > oldXPosition){
            finalText = finalText + "\n"+content[j].str;
          }else{
            finalText = finalText + " "+content[j].str;
          }
          oldXPosition = content[j].x;
        }
      }
      var result = await sails.helpers.getTextInChunks.with({"text": finalText});
      return exits.success(result);

      /*let doc = await pdfjsLib.getDocument(inputs.path).promise;
      let pageCount = doc.numPages;

      var pdfFullText = "";
      for(var i=0;i<pageCount;i++){
        let page1 = await doc.getPage(1);
        let content = await page1.getTextContent();
        let strings = content.items.map(function(item) {
            return item.str;
        });
        pdfFullText = pdfFullText + strings;
      }
      console.log(pdfFullText);
      return exits.success(pdfFullText);*/
  	}catch(e){
  		console.log(e);
  	}  	
  }
};

