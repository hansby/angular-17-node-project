const axios = require('axios');
const { getAccessToken } = require('./authService');

async function callDocumentAI(projectId, location = 'us', processorId, data) {
  const token = await getAccessToken();

	//https://us-documentai.googleapis.com/v1/projects/522083403925/locations/us/processors/1450436d1aa73a/processorVersions/pretrained-foundation-model-v1.5-pro-2025-06-20:process

  const endpoint = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}/processorVersions/pretrained-foundation-model-v1.5-pro-2025-06-20:process`;



  const response = await axios.post(endpoint, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data;
}

module.exports = {
  callDocumentAI
};
