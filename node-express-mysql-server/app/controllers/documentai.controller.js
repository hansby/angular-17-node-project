
const projectId = '522083403925';
const location = 'us';
const processorId = '5b018beea92e33bf' // Proof of Address Processor ID
const filePath = __basedir + "/resources/static/assets/uploads/";

const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;

// Instantiates a client
// apiEndpoint regions available: eu-documentai.googleapis.com, us-documentai.googleapis.com (Required if using eu based processor)
// const client = new DocumentProcessorServiceClient({apiEndpoint: 'eu-documentai.googleapis.com'});
const client = new DocumentProcessorServiceClient();

async function documentAICheckPOA(fileName) {
  // The full resource name of the processor, e.g.:
  // projects/project-id/locations/location/processor/processor-id
  // You must create new processors in the Cloud Console first
  const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;

  // Read the file into memory.
  const fs = require('fs').promises;
  const imageFile = await fs.readFile(filePath+"/"+fileName);

  // Convert the image data to a Buffer and base64 encode it.
  const encodedImage = Buffer.from(imageFile).toString('base64');

  const request = {
    name,
    rawDocument: {
      content: encodedImage,
      mimeType: 'application/pdf',
    },
  };

  // Recognizes text entities in the PDF document
  const [result] = await client.processDocument(request);
  const {document} = result;

  // Get all of the document text as one big string
  const {text} = document;

  // Extract shards from the text field
  const getText = textAnchor => {
    if (!textAnchor.textSegments || textAnchor.textSegments.length === 0) {
      return '';
    }

    // First shard in document doesn't have startIndex property
    const startIndex = textAnchor.textSegments[0].startIndex || 0;
    const endIndex = textAnchor.textSegments[0].endIndex;

    return text.substring(startIndex, endIndex);
  };

  // Read the text recognition output from the processor
  console.log('The document contains the following paragraphs:');
  const [page1] = document.pages;
  const {paragraphs} = page1;

  for (const paragraph of paragraphs) {
    const paragraphText = getText(paragraph.layout.textAnchor);
    console.log(`Paragraph text:\n${paragraphText}`);
  }
}

module.exports = {
	documentAICheckPOA
}