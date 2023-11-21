module.exports = {

	webScrapper: async function(req, res){
	 	var rawInfoChunks = await sails.helpers.webScrapper.with({url: req.body.url});
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
}