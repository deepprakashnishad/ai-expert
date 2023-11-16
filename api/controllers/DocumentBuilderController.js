module.exports = {

	webScrapper: async function(req, res){
	 	var response = await sails.helpers.webScrapper.with({url: req.body.url});
	 	res.ok(response);
	},
}