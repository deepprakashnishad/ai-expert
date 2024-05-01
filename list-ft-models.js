const OpenAI = require("openai");

const openai = new OpenAI({
	apiKey: "sk-proj-8WaEQhgL6c2OuV78b17KT3BlbkFJT9MhR2DXCjdbKlonFeqh"
})

async function listFineTunedModels() {
  try {
    const response = await openai.fineTuning.jobs.list();
    console.log(response);
    console.log(`Fine-tuning status: ${response.status}`);
  } catch (err) {
    console.error('Error checking fine-tuning status:', err);
  }
}

// Example usage
(async () => {
  await listFineTunedModels();
})();