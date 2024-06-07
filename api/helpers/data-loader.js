module.exports = {


  friendlyName: 'Data Loader',


  description: 'Data Loader',


  inputs: {
    filename:{
      type: "string",
      required: true
    },
    path: {
    	type: "string",
    	required: true
    },
    filetype: {
      type: "string",
      required: true
    },
    webUrl: {
      type: "string",
      required: true
    },
    isHeaderRowPresent:{
      type:"boolean",
      defaultsTo: true
    }
  },


  exits: {
    success:{"description": "Data loaded"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
  	try{

      if(inputs.filetype === "pdf"){
        const loader = new PDFLoader(req.body.filePath, {
          parsedItemSeparator: "",
        });
        const docs = await loader.load();
      }else if(inputs.filetype === "excel"){
        const workbook = XLSX.readFile(path.join(__dirname, 'assets/uploads/reviews/file1.xlsx'));

        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert the sheet to JSON
        const docs = XLSX.utils.sheet_to_json(worksheet);
      }else if(inputs.filetype === "webpage"){
        const docs = await sails.helpers.scrapWeb.with({url: req.body.url});
      }else{
        return exits.success(false);
      }
      
      var chunk_list = [];
      for (var i = 0; i < docs.length; i++) {
        var doc = docs[i];
        const newChunks = await sails.helpers.getTextInChunks.with({"text": doc.pageContent});
          chunk_list = chunk_list.concat(...newChunks);
      }
    
      var response = await sails.helpers.processRawChunksToEmbeddings.with(
         {
           chunks: chunk_list
         }
      );

      exits.success(response);
  	}catch(e){
  		console.log(e);
  	}  	
  }
};

