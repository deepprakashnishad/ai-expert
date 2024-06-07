const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");


module.exports = {

	webScrapper: async function(req, res){
	 	var rawInfoChunks = await sails.helpers.scrapWeb.with({url: req.body.url});
	 	console.log("Web scrapping completed");
	 	var response = await sails.helpers.processRawChunksToEmbeddings.with(
	 		{
	 			chunks: rawInfoChunks,
	 			personId: req.body.personId,
	 			botId: req.body.botId
	 		}
 		);

	 	res.successResponse({data: response}, 200, null, true, "Website scrapped and information has been processed");
	},

	uploadFile: async function(req, res){
		req.file('avatar').upload({
		  		dirname: require('path').resolve(sails.config.appPath, 'assets/uploads')
			},
			function (err, files) {
			    if (err){
			        return res.serverError(err);
			    }

				console.log(files);	    	
		        return res.json({
			        message: files.length + ' file(s) uploaded successfully!',
			        files: files
	      		}
	      	);
	    });
	},

	pdfScrapper: async function(req, res){
		/*var result = await sails.helpers.scrapPdf.with({path: "assets/uploads/gst.pdf"});

		res.successResponse({data: result}, 200, null, true, "Website scrapped and information has been processed")*/

		const loader = new PDFLoader(req.body.filePath, {
		  parsedItemSeparator: "",
		});

		/*const loader = new PDFLoader("assets/uploads/pdfs/Veritas-Technical-Support-Handbook.pdf", {
		  parsedItemSeparator: "",
		});*/

		const docs = await loader.load();

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
		return res.ok(200);
	},

	excelReader: async function(req, res){
		
	}
}