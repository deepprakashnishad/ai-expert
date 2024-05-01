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
		var result = await sails.helpers.scrapPdf.with({path: "assets/uploads/gst.pdf"});

		res.successResponse({data: result}, 200, null, true, "Website scrapped and information has been processed")
	},

	excelReader: async function(req, res){
		
	}
}