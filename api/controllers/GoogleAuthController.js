const { google } = require('googleapis');
const path = require('path');

const SCOPES = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/gmail.readonly",
    ];

module.exports = {
    async authenticate(req, res) {
        const oauth2Client = new google.auth.OAuth2(
            sails.config.custom.GOOGLE.CLIENT_ID,
            sails.config.custom.GOOGLE.CLIENT_SECRET,
            // 'http://localhost:1337/auth/google/callback'
            `${sails.config.custom.baseUrl}/auth/google/callback`
        );

        let clientData = {appId: req.query.appId, redirectUrl: req.query.redirectUrl};

        console.log(req.query);

        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'select_account',
            login_hint: req.query.gmail,
            state: JSON.stringify(clientData)
        });

        res.redirect(authUrl);
        // return res.json({"authUrl": authUrl})
    },

    async callback(req, res) {
        const oauth2Client = new google.auth.OAuth2(
            sails.config.custom.GOOGLE.CLIENT_ID,
            sails.config.custom.GOOGLE.CLIENT_SECRET,
            // 'http://localhost:1337/auth/google/callback'
            `${sails.config.custom.baseUrl}/auth/google/callback`
        );

        var { code, state } = req.query;

        state = JSON.parse(state);
        const appId = state.appId;
        const redirectUrl = state.redirectUrl;

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Store tokens in session or database
        const appDataColl = await AppData.getDatastore().manager.collection(AppData.tableName);

        var result = await appDataColl.updateOne(
            {"cid": appId.toString(), "type": "google"},
            {$set: {"data": {tokens: tokens}}},
            {
                upsert: true
            }
        );

        res.redirect(redirectUrl); // Redirect back to client app or home
    },

    async sendEmail(req, res) {
        const { to, subject, message } = req.body;
        const oauth2Client = new google.auth.OAuth2(
            sails.config.custom.GOOGLE.CLIENT_ID,
            sails.config.custom.GOOGLE.CLIENT_SECRET,
        );

        var googleConfig = await AppData.findOne({cid: req.body.appId.toString(), type: "google"});
        googleConfig = googleConfig.data.tokens;

        oauth2Client.setCredentials(googleConfig);

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const email = `To: ${to}\nSubject: ${subject}\n\n${message}`;
        const base64EncodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

        try {
            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: base64EncodedEmail,
                },
            });
            res.json(response.data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
};
