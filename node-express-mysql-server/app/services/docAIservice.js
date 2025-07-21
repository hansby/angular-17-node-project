const axios = require('axios');
const { getAccessToken } = require('./authService');

async function callDocumentAI(projectId, location = 'us', processorId, data) {
  const token = await getAccessToken();

  const endpoint = `https://${location}-documentai.googleapis.com/v1/projects/${projectId}/locations/${location}/processors/${processorId}:process`;

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
