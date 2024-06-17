const { PDFLoader } = require("langchain/document_loaders/fs/pdf");

const cheerio = require("cheerio");
const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { MemoryVectorStore,MongoDBAtlasVectorStore } = require("langchain/vectorstores/memory");
const { Chroma } =require("@langchain/community/vectorstores/chroma");
const { FaissStore } = require("@langchain/community/vectorstores/faiss");
const { QdrantVectorStore } = require("@langchain/qdrant");
const { OpenAIEmbeddings, ChatOpenAI } = require("@langchain/openai");
const { pull } = require("langchain/hub");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { StringOutputParser } = require("@langchain/core/output_parsers");

const { Pinecone } = require("@pinecone-database/pinecone");
const { Document } = require("@langchain/core/documents");
const { PineconeStore } = require("@langchain/pinecone");

const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");

const pinecone = new Pinecone({apiKey: sails.config.custom.PINECONE_API_KEY});

const pineconeIndex = pinecone.Index('ragdoc');

module.exports = {

	webScrapper: async function(req, res){

		/*var existingDoc = await UploadedDocument.findOne({title: req.body.url});

		if(existingDoc){
			return res.successResponse({}, 200, null, true, "This url has been already scrapped");
		}*/

		const loader = new CheerioWebBaseLoader(
		  req.body.url
		);

		const docs = await loader.load();

		const textSplitter = new RecursiveCharacterTextSplitter({
		  chunkSize: 1000,
		  chunkOverlap: 200,
		});
		const splits = await textSplitter.splitDocuments(docs);

		const mDoc = await UploadedDocument.create({"title": req.body.url, "type": "web_url"}).fetch();

		var vectorStore = await sails.helpers.processChunksToEmbeddings.with({
			chunks: splits,
			doc_id: mDoc.id 
		})

		/*const vectorStore = await PineconeStore.fromDocuments(splits,
		  new OpenAIEmbeddings(), {
			  pineconeIndex,
			  maxConcurrency: 5, // Maximum number of batch requests to allow at once. Each batch is 1000 vectors.
			}
		);*/
		/*console.log(process.env.QDRANT_URL)
		
		const vectorStore = await QdrantVectorStore.fromDocuments(splits,
		  new OpenAIEmbeddings(), {
		    url: process.env.QDRANT_URL,
		    collectionName: "cvector",
		  }
		);	*/	

	 	return res.successResponse({data: vectorStore}, 200, null, true, "Website scrapped and information has been processed");
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