const { PDFLoader } = require("langchain/document_loaders/fs/pdf");

const cheerio = require("cheerio");
const { CheerioWebBaseLoader } = require("langchain/document_loaders/web/cheerio");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { MongoDBAtlasVectorStore } = require("langchain/vectorstores/memory");
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

async function splitter(loader, delimeter){
	const docs = await loader.load();
	var splits = [];
	var temp = "";
	for(var doc of docs){
		var temp = temp + doc.pageContent;
		// splits = splits.concat(temp);
	}

	splits = await sails.helpers.getTextInChunks.with({"text": temp, "logicalDelimeters": loader.parsedItemSeparator});
	/*const textSplitter = new RecursiveCharacterTextSplitter({
	  chunkSize: 1000,
	  chunkOverlap: 200,
	});
	const splits = await textSplitter.splitDocuments(docs);*/

	return {rawChunks: splits, metadata: docs[0].metadata};
}

module.exports = {

	webScrapper: async function(req, res){

		/*var existingDoc = await UploadedDocument.findOne({title: req.body.url});

		if(existingDoc){
			return res.successResponse({}, 200, null, true, "This url has been already scrapped");
		}*/

		//Personal webscrapping

		const mDoc = await UploadedDocument.create({
			"title": req.body.url, 
			"type": "url", 
			"clientId": req.body.appId
		}).fetch();

		var rawChunks = await sails.helpers.scrapWeb.with({"url": req.body.url});

		var vectorStore = await sails.helpers.processRawChunksToEmbeddings.with({
			chunks: rawChunks,
			metadata: {
				source: req.body.url,
				type: "url"
			},
			doc_id: mDoc.id,
			clientId: req.body.appId
		});

		//Lang chain webscrapping

		/*const loader = new CheerioWebBaseLoader(
		  req.body.url
		);

		const mDoc = await UploadedDocument.create({
			"title": req.body.url, 
			"type": "web_url",
			"client": req.body.clientId,
			"agent": req.body.agent
		}).fetch();

		var splits = await splitter(loader);
		var vectorStore = await sails.helpers.processChunksToEmbeddings.with({
			chunks: splits,
			doc_id: mDoc.id,
			agent: req.body.agent, 
			clientId: req.body.clientId
		})*/

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
		req.file('doc').upload({
		  		dirname: require('path').resolve(sails.config.appPath, 'assets/uploads/pdfs')
			},
			async function (err, files) {
			    if (err){
			        return res.serverError(err);
			    }
			    var file = files[0];
			    const loader = new PDFLoader(file['fd'], {
				  parsedItemSeparator: '\n\n\n',
				});	
				// const mDoc = {id: "temp.pdf"};
				const mDoc = await UploadedDocument.create({"title": file['filename'], "type": "pdf", "clientId": req.body.appId}).fetch();
				var result = await splitter(loader);
				var vectorStore = await sails.helpers.processRawChunksToEmbeddings.with({
					chunks: result.rawChunks,
					metadata: {
						source: file['filename'],
						type: "pdf"
					},
					doc_id: mDoc.id,
					clientId: req.body.appId,
					chunksToInfoFlag: false
				});
		        return res.json({
			        message: files.length + ' file(s) uploaded successfully!',
			        files: files,
			        doc_id: mDoc.id
	      		}
	      	);
	    });
	},

	updateClientId: async function(req, res){
		await Cvector.update({'d': req.body.doc_id}).set({'cid': req.body.appId});
		await UploadedDocument.update({'id': req.body.doc_id}).set({'clientId': req.body.appId});
		return res.ok(200);
	},

	excelReader: async function(req, res){
		
	},

	getUploadedDocuments: async function(req, res){
		var docs = await UploadedDocument.find({clientId: req.query.appId});
		return res.json(docs);
	},

	deleteUploadedDocuments: async function(req, res){
		await Cvector.destroy({d: req.body.docId, cid: req.body.appId});
		await UploadedDocument.destroy({id: req.body.docId, clientId: req.body.appId});

		var docs = await UploadedDocument.find({clientId: req.body.appId});
		return res.json(docs);
	}
}