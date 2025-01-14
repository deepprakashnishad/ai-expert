const { google } = require('googleapis');
const path = require('path');

const SCOPES = [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.compose",
        "https://www.googleapis.com/auth/gmail.readonly",
    ];

async function getUserProfile(oauth2Client) {

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        const profileResponse = await gmail.users.getProfile({
            userId: 'me',
        });

        // Extracting the email
        return profileResponse.data.emailAddress;
    } catch (error) {
        return undefined;
    }
}

module.exports = {
    async authenticate(req, res) {
        const oauth2Client = new google.auth.OAuth2(
            sails.config.custom.GOOGLE.CLIENT_ID,
            sails.config.custom.GOOGLE.CLIENT_SECRET,
            // 'http://localhost:1337/auth/google/callback'
            `${sails.config.custom.baseUrl}/auth/google/callback`
        );

        let clientData = {appId: req.query.appId, redirectUrl: req.query.redirectUrl};

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
        console.log(tokens);
        const appDataColl = await AppData.getDatastore().manager.collection(AppData.tableName);
        var existingGoogleAcc = await AppData.findOne({"cid": appId.toString(), "type": "google"});

        var email = await getUserProfile(oauth2Client);
        var result = await appDataColl.updateOne(
            {"cid": appId.toString(), "type": "google"},
            {$set:  {
                "data.email": email,
                "data.tokens": {
                    refresh_token: tokens.refresh_token || existingGoogleAcc.data.tokens.refresh_token,
                    access_token: tokens.access_token || existingGoogleAcc.data.tokens.access_token,
                    scope: tokens.scope || existingGoogleAcc.data.tokens.scope,
                    token_type: tokens.token_type || existingGoogleAcc.data.tokens.token_type,
                    expiry_date: tokens.expiry_date || existingGoogleAcc.data.tokens.expiry_date,
                }
            }},
            {
                upsert: true
            }
        );
        // Store tokens in session or database

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
