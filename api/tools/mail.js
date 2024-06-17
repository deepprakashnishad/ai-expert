module.exports = {

	initialize: async function(){
		const transporter = createTransport({
		  service: 'gmail', // Replace with your provider
		  auth: {
		    user: 'radhagovindsewadham@gmail.com',
		    pass: 'bjbx binl hyhx yjes'
		  }
		});

		return transporter;
	},

	send: async function(){

		

		const mailOptions = {
		  from: 'Notamedia <radhagovindsewadham@gmail.com>',
		  to: recipients,
		  subject: subject,
		  text: body,
		  attachments: files
		};

		initialize().sendMail(mailOptions, (error, info) => {
		  if (error) {
		    console.error(error);
		  } else {
		    console.log("Mail sent");
		  }
		});

	}
}