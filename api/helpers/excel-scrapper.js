const XLSX = require('xlsx');
const path = require('path');

module.exports = {


  friendlyName: 'Excel Scrapper',


  description: 'Scrap excel file',


  inputs: {
    filename:{
      type: "string",
      required: true
    },
    path: {
    	type: "string",
    	required: true
    },
    isHeaderRowPresent:{
      type:"boolean",
      defaultsTo: true
    }
  },


  exits: {
    success:{"description": "Message sent"},
    msgMissing: {"description":"Message missing."},
    invalidMessageType: {"description": "Invalid message type"}
  },


  fn: async function (inputs, exits) {
  	try{

      const workbook = XLSX.readFile(path.join(__dirname, 'assets/uploads/reviews/file1.xlsx'));

      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert the sheet to JSON
      const data = XLSX.utils.sheet_to_json(worksheet);

      exits.success(data);
  	}catch(e){
  		console.log(e);
  	}  	
  }
};

