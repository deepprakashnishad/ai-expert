const {createTransport} = require('nodemailer');
const { z } = require("zod");
const axios = require("axios");

const path = require("path");
const process = require("process");

const description = require('./description.js');

const { initializeAgentExecutorWithOptions } = require("langchain/agents");
const { OpenAI } = require("@langchain/openai");
const {
  GmailCreateDraft,
  GmailGetMessage,
  GmailGetThread,
  GmailSearch,
  GmailSendMessage,
} = require("@langchain/community/tools/gmail");

const {TavilySearchResults} = require("@langchain/community/tools/tavily_search");



const {google} = require("googleapis");

const {authorize} = require("./googleApiAuthService.js");

const { StructuredTool } = require("@langchain/core/tools");

class MyGmailCreateDraft extends GmailCreateDraft{
  constructor(fields){
    super(fields);

    this.schema = this.schema.extend({
        appId: z.string() // Add the appId property
    });
  }

  async _call(arg) {
    const auth = await authorize(arg.appId);
    const gmail = google.gmail({ version: 'v1', auth });

    const { message, to, subject, cc, bcc } = arg;
    const create_message = this.prepareDraftMessage(message, to, subject, cc, bcc);
    const response = await gmail.users.drafts.create({
        userId: "me",
        requestBody: create_message,
    });
    return `Draft created. Draft Id: ${response.data.id}`;
  }
}

class MyGmailSearch extends GmailSearch {
  gmail;
  appId;
  constructor(fields){
    super(fields);

    this.schema = this.schema.extend({
        appId: z.string() // Add the appId property
    });
  }

  async _call(arg) {
    const { appId, query, maxResults = 10, resource = "messages" } = arg;
    this.appId = appId;
    if(!this.gmail){
      var auth = await authorize(appId);
      this.gmail = google.gmail({ version: 'v1', auth });
    }

    const response = await this.gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults,
    });
    const { data } = response;
    if (!data) {
        throw new Error("No data returned from Gmail");
    }
    const { messages } = data;
    if (!messages) {
        throw new Error("No messages returned from Gmail");
    }
    if (resource === "messages") {
        const parsedMessages = await this.parseMessages(messages);
        return `Result for the query ${query}:\n${JSON.stringify(parsedMessages)}`;
    }
    else if (resource === "threads") {
        const parsedThreads = await this.parseThreads(messages);
        return `Result for the query ${query}:\n${JSON.stringify(parsedThreads)}`;
    }
    throw new Error(`Invalid resource: ${resource}`);
  }

  async parseMessages(messages) {
    if(!this.gmail){
      var auth = await authorize(this.appId);
      this.gmail = google.gmail({ version: 'v1', auth });
    }
    const parsedMessages = await Promise.all(messages.map(async (message) => {
        const messageData = await this.gmail.users.messages.get({
            userId: "me",
            format: "raw",
            id: message.id ?? "",
        });
        const headers = messageData.data.payload?.headers || [];
        const subject = headers.find((header) => header.name === "Subject");
        const sender = headers.find((header) => header.name === "From");
        let body = "";
        if (messageData.data.payload?.parts) {
            body = messageData.data.payload.parts
                .map((part) => part.body?.data ?? "")
                .join("");
        }
        else if (messageData.data.payload?.body?.data) {
            body = messageData.data.payload.body.data;
        }
        return {
            id: message.id,
            threadId: message.threadId,
            snippet: message.snippet,
            body,
            subject,
            sender,
        };
    }));
    return parsedMessages;
  }

  async parseThreads(threads) {
    if(!this.gmail){
      var auth = await authorize(this.appId);
      this.gmail = google.gmail({ version: 'v1', auth });
    }
    const parsedThreads = await Promise.all(threads.map(async (thread) => {
        const threadData = await this.gmail.users.threads.get({
            userId: "me",
            format: "raw",
            id: thread.id ?? "",
        });
        const headers = threadData.data.messages?.[0]?.payload?.headers || [];
        const subject = headers.find((header) => header.name === "Subject");
        const sender = headers.find((header) => header.name === "From");
        let body = "";
        if (threadData.data.messages?.[0]?.payload?.parts) {
            body = threadData.data.messages[0].payload.parts
                .map((part) => part.body?.data ?? "")
                .join("");
        }
        else if (threadData.data.messages?.[0]?.payload?.body?.data) {
            body = threadData.data.messages[0].payload.body.data;
        }
        return {
            id: thread.id,
            snippet: thread.snippet,
            body,
            subject,
            sender,
        };
    }));
    return parsedThreads;
  }
}

class MyGmailGetThread extends GmailGetThread{
  gmail;
  constructor(fields){
    super(fields);

    this.schema = this.schema.extend({
        appId: z.string() // Add the appId property
    });
  }

  async _call(arg) {
    const { threadId, appId } = arg;

    if(!this.gmail){
      var auth = await authorize(appId);
      this.gmail = google.gmail({ version: 'v1', auth });
    }
    const thread = await this.gmail.users.threads.get({
        userId: "me",
        id: threadId,
    });
    const { data } = thread;
    if (!data) {
        throw new Error("No data returned from Gmail");
    }
    const { messages } = data;
    if (!messages) {
        throw new Error("No messages returned from Gmail");
    }
    return `Result for the prompt ${threadId} \n${JSON.stringify(messages.map((message) => {
        const { payload } = message;
        if (!payload) {
            throw new Error("No payload returned from Gmail");
        }
        const { headers } = payload;
        if (!headers) {
            throw new Error("No headers returned from Gmail");
        }
        const subject = headers.find((header) => header.name === "Subject");
        if (!subject) {
            throw new Error("No subject returned from Gmail");
        }
        const body = headers.find((header) => header.name === "Body");
        if (!body) {
            throw new Error("No body returned from Gmail");
        }
        const from = headers.find((header) => header.name === "From");
        if (!from) {
            throw new Error("No from returned from Gmail");
        }
        const to = headers.find((header) => header.name === "To");
        if (!to) {
            throw new Error("No to returned from Gmail");
        }
        const date = headers.find((header) => header.name === "Date");
        if (!date) {
            throw new Error("No date returned from Gmail");
        }
        const messageIdHeader = headers.find((header) => header.name === "Message-ID");
        if (!messageIdHeader) {
            throw new Error("No message id returned from Gmail");
        }
        return {
            subject: subject.value,
            body: body.value,
            from: from.value,
            to: to.value,
            date: date.value,
            messageId: messageIdHeader.value,
        };
    }))}`;
  }
}

class MyGmailGetMessage extends GmailGetMessage{
  gmail;

  constructor(fields){
    super(fields);

    this.schema = this.schema.extend({
        appId: z.string() // Add the appId property
    });
  }

  async _call(arg) {
    const { messageId, appId } = arg;
    if(!this.gmail){
      var auth = await authorize(appId);
      this.gmail = google.gmail({ version: 'v1', auth });
    }
    const message = await this.gmail.users.messages.get({
        userId: "me",
        id: messageId,
    });
    const { data } = message;
    if (!data) {
        throw new Error("No data returned from Gmail");
    }
    const { payload } = data;
    if (!payload) {
        throw new Error("No payload returned from Gmail");
    }
    const { headers } = payload;
    if (!headers) {
        throw new Error("No headers returned from Gmail");
    }
    const subject = headers.find((header) => header.name === "Subject");
    if (!subject) {
        throw new Error("No subject returned from Gmail");
    }
    const body = headers.find((header) => header.name === "Body");
    if (!body) {
        throw new Error("No body returned from Gmail");
    }
    const from = headers.find((header) => header.name === "From");
    if (!from) {
        throw new Error("No from returned from Gmail");
    }
    const to = headers.find((header) => header.name === "To");
    if (!to) {
        throw new Error("No to returned from Gmail");
    }
    const date = headers.find((header) => header.name === "Date");
    if (!date) {
        throw new Error("No date returned from Gmail");
    }
    const messageIdHeader = headers.find((header) => header.name === "Message-ID");
    if (!messageIdHeader) {
        throw new Error("No message id returned from Gmail");
    }
    return `Result for the prompt ${messageId} \n${JSON.stringify({
        subject: subject.value,
        body: body.value,
        from: from.value,
        to: to.value,
        date: date.value,
        messageId: messageIdHeader.value,
    })}`;
  }
}

class MyGmailSendMessage extends GmailSendMessage{
  gmail;

  constructor(fields){
    super(fields);

    Object.defineProperty(this, "name", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "gmail_send_message"
    });

    this.schema = this.schema.extend({
      message: z.string(),
      to: z.array(z.string()),
      subject: z.string(),
      cc: z.array(z.string()).optional(),
      bcc: z.array(z.string()).optional(),
      appId: z.string() // Add the appId property
    });

    Object.defineProperty(this, "description", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: description.SEND_EMAIL_DESC
    });
  }

  async _call(arg) {
    const { message, to, subject, cc, bcc, appId } = arg;

    console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nSend Message Tool has been called with following args\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
    console.log(arg);

    if(!this.gmail){
      var auth = await authorize(appId);
      this.gmail = google.gmail({ version: 'v1', auth });
    }

    const rawMessage = this.createEmailMessage({
        message,
        to,
        subject,
        cc,
        bcc,
    });
    try {
        const response = await this.gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw: rawMessage,
            },
        });
        return `Message sent. Message Id: ${response.data.id}`;
    }
    catch (error) {
        throw new Error(`An error occurred while sending the message: ${error}`);
    }
  }
}

async function gmail_agent(state) {

  const {conversation, llm, user} = state;
  console.log(user);
  const userQuery = `{userQuery: ${conversation[conversation.length-1]['content']}, appId: ${user.appId}}`;

  const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), './auto-gpt-service-account.json');
  const serviceAccount = require(SERVICE_ACCOUNT_PATH);

  // These are the default parameters for the Gmail tools
  const gmailParams = {
    credentials: {
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'), // Ensure proper formatting
    },
    scopes: ["https://mail.google.com/"],
  };

  // For custom parameters, uncomment the code above, replace the values with your own, and pass it to the tools below
  const tools = [
    new MyGmailCreateDraft(gmailParams),
    new MyGmailGetMessage(gmailParams),
    new MyGmailGetThread(gmailParams),
    new MyGmailSearch(gmailParams),
    new MyGmailSendMessage(gmailParams),
    new TavilySearchResults()
  ];

  const gmailAgent = await initializeAgentExecutorWithOptions(tools, llm, {
    agentType: "structured-chat-zero-shot-react-description",
    verbose: true,
  });

  // const query = `Create a gmail draft for me to edit of a letter from the perspective of a sentient parrot who is looking to collaborate on some research with her estranged friend, a cat. Under no circumstances may you send the message, however.`;

  const result = await gmailAgent.invoke({ input: userQuery });
    // Create Result {
    //   output: 'I have created a draft email for you to edit. The draft Id is r5681294731961864018.'
    // }
  console.log("Result", result);

  return {
      finalResult: result,
      "lastExecutedNode": "gmail_agent"
  };
}

module.exports = {
  gmail_agent
}

async function listMessages(query="", userId="me", maxResults=10, labelIds = [], includeSpamTrash = false){
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.list({
    q: query,
    userId: 'me',
    maxResults: 10,
    labelIds: labelIds,
    includeSpamTrash: includeSpamTrash
  });

  const messages = res.data.messages;
  if (messages.length) {
    console.log('Messages:');
    messages.forEach((message) => {
      console.log(`- ${message.id}`);
      console.log(message);
    });

    return messages;
  } else {
    console.log('No messages found.');
  }
}

async function listThreads(query="", userId="me", maxResults=10, labelIds = [], includeSpamTrash = false){
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.list({
    q: query,
    userId: userId,
    maxResults: maxResults,
    labelIds: labelIds,
    includeSpamTrash: includeSpamTrash
  });

  const messages = res.data.messages;
  if (messages.length) {
    console.log('Messages:');
    messages.forEach((message) => {
      console.log(`- ${message.id}`);
      console.log(message);
    });
  } else {
    console.log('No messages found.');
  }
}

async function getMessage(messageId, userId="me"){
  const auth = await authorize();
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.messages.get({
    id: messageId,
    userId: userId
  });

  const message = res.data;
  if (messages.length) {
    return message;
  } else {
    console.log('No messages found.');
  }
}