const OpenAI = require("openai");
const XLSX = require('xlsx');

const openai = new OpenAI({
	apiKey: "sk-proj-8WaEQhgL6c2OuV78b17KT3BlbkFJT9MhR2DXCjdbKlonFeqh"
})

const fs = require('fs');

async function uploadDataset() {
  try {
    const data = [];
    const fs = require('fs');

    var response = await openai.files.create({ file: fs.createReadStream('demo.jsonl'), purpose: 'fine-tune' });
    console.log(`Uploaded file ID: ${response.id}`);
    return response.id;
  } catch (err) {
    console.error('Error uploading dataset:', err);
  }
}

// Function to create the fine-tuning request
async function createFineTune(datasetId) {
  try {
    const response = await openai.fineTuning.jobs.create({
      model: 'gpt-3.5-turbo', // Choose the desired ChatGPT model (e.g., davinci)
      training_file: datasetId
    });
    console.log(`Fine-tuning started with ID: ${response.id}`);
    return response.id;
  } catch (err) {
    console.error('Error creating fine-tuning:', err);
  }
}

// Function to check fine-tuning status
async function checkFineTuneStatus(fineTuneId) {
  try {
    const response = await openai.fineTuning.jobs.retrieve(fineTuneId);
    console.log(`Fine-tuning status: ${response.status}`);
    if (response.status === 'completed') {
      console.log('Fine-tuning completed successfully!');
      // Use the fine-tuned model ID for generation or other tasks
      const fineTunedModelId = response.model;
      // ...
    }else if(response.status === 'failed'){
      console.log(response.error);
    }
  } catch (err) {
    console.error('Error checking fine-tuning status:', err);
  }
}

// Example usage
(async () => {
  // const datasetId = await uploadDataset();
  // const fineTuneId = await createFineTune(datasetId);
  // await checkFineTuneStatus(fineTuneId);
  await checkFineTuneStatus("ftjob-95UB7chIBoHVLEbDuR0rtMT0");
})();