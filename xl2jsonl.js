const xlsx = require('xlsx');
const fs = require('fs');

// Define the path to the XLSX file
const filePath = 'SampleData1.xlsx';

// Read the XLSX file
const workbook = xlsx.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

// Define the path to the output JSONL file
const outputFilePath = 'demo.jsonl';

// Convert to JSONL format
const jsonlData = data.map(item => {
	var finalData = {"messages": [
		{"role": "system", "content": "You are knowledgable technical analyst and a full stack developer. You reply with suggesstions after doing impact analysis of code related to the project. In case project is not provided in prompt you can ask user to specify the project name. You should provide solution in form of code."}, 
		{"role": "user", "content": JSON.stringify(item)}, 
		{"role": "assistant", "content": "{path: '', code: '', linenumber: ''}"}]};
	return JSON.stringify(finalData);
}).join('\n');

// Write to JSONL file
fs.writeFileSync(outputFilePath, jsonlData);


console.log('Conversion complete!');