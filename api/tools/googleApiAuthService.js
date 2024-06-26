const fs = require("fs").promises;
const path = require("path");
const process = require("process");

const {authenticate} = require("@google-cloud/local-auth");

// const { GoogleAuth } = require('google-auth-library');

const {google} = require("googleapis");

//Define Scopes

const SCOPES = [
		"https://www.googleapis.com/auth/gmail.send",
		"https://www.googleapis.com/auth/gmail.compose",
		"https://www.googleapis.com/auth/gmail.readonly",
	]

// Fetch and store tokens from files

const TOKEN_PATH = path.join(process.cwd(), './token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), './credentials.json')

const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), './auto-gpt-service-account.json')

// Read previously authorized credentials from saved file

async function loadSavedCredentialsIfExists(){
	try{
		const content = await fs.readFile(TOKEN_PATH);
		const credentials = JSON.parse(content);
		if(credentials.access_token){
			const oAuth = new google.auth.OAuth2()

			oAuth.setCredentials({access_token: credentials.access_token});
			return oAuth;
		}		
		return google.auth.fromJSON(credentials);
	}catch(e){
		return null;
	}
}

// 
async function saveCredentials(client){
	const content = await fs.readFile(CREDENTIALS_PATH);

	const keys = JSON.parse(content);

	const key = keys.web || keys.installed;

	const payload = JSON.stringify({
		type: "authorized_user",
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
		access_token: client.credentials.access_token,
	});
	console.log(payload)
	if(payload.refresh_token){
		console.log("Writing tokenfile");
		var write_result = await fs.writeFile(TOKEN_PATH, payload);	
		console.log(write_result)
	}
	
}

async function authorize(){
	let client = await loadSavedCredentialsIfExists();

	console.log(client);

	if(client){ return client; }

	/*const auth = new GoogleAuth({
	  keyFile: SERVICE_ACCOUNT_PATH,
	  scopes: SCOPES,
	});


	client = await auth.getClient();*/

	client = await authenticate({
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH
	});

	console.log(client)

	if(client.credentials){
		console.log("Saving credentials");
		await saveCredentials(client)
	}

	return client;
}

module.exports = {
	authorize
}