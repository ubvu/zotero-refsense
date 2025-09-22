const OllamaAPI = {
  async queryOllama(text, model = 'llama3.2:latest', host = 'http://localhost:11434') {
    return new Promise((resolve, reject) => {
      try {
        // Use XMLHttpRequest for Zotero compatibility
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${host}/api/generate`, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              try {
                const data = JSON.parse(xhr.responseText);
                const result = this.parseResponse(data.response);
                resolve(result);
              } catch (parseError) {
                reject(new Error(`Response parsing error: ${parseError.message}`));
              }
            } else {
              reject(new Error(`Ollama API error: ${xhr.status} ${xhr.statusText}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error(`Network error: Unable to connect to the Ollama server. (${host})`));
        };
        
        xhr.ontimeout = () => {
          reject(new Error(`Timeout: Ollama server response is too slow.`));
        };
        
        xhr.timeout = 30000; // 30 seconds timeout
        
        const requestData = JSON.stringify({
          model: model,
          prompt: this.buildPrompt(text),
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
            num_predict: 1000
          }
        });
        
        xhr.send(requestData);
        
      } catch (error) {
        reject(new Error(`Request creation error: ${error.message}`));
      }
    });
  },

  async checkConnection(host = 'http://localhost:11434') {
    return new Promise((resolve) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${host}/api/tags`, true);
        xhr.timeout = 5000;
        
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            resolve(xhr.status === 200);
          }
        };
        
        xhr.onerror = () => resolve(false);
        xhr.ontimeout = () => resolve(false);
        
        xhr.send();
      } catch (error) {
        resolve(false);
      }
    });
  },

  async getAvailableModels(host = 'http://localhost:11434') {
    return new Promise((resolve) => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${host}/api/tags`, true);
        xhr.timeout = 5000;
        
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.models || []);
              } catch (error) {
                resolve([]);
              }
            } else {
              resolve([]);
            }
          }
        };
        
        xhr.onerror = () => resolve([]);
        xhr.ontimeout = () => resolve([]);
        
        xhr.send();
      } catch (error) {
        resolve([]);
      }
    });
  },

  buildPrompt(text) {
    return `Please extract accurate bibliographic metadata from the following academic paper text and return it in JSON format.

Text:
${text.substring(0, 3000)}

Return JSON in the following format only:
{
  "title": "Paper title",
  "authors": ["Author 1", "Author 2"],
  "year": "Publication year",
  "journal": "Journal name",
  "volume": "Volume",
  "issue": "Issue",
  "pages": "Pages",
  "doi": "DOI",
  "abstract": "Full abstract - include if available"
}

Guidelines:
- Extract only accurate information.
- Leave fields as empty strings if the information is uncertain.
- Follow the JSON format exactly.
- Always return the authors as an array. Separate each author into its own element.
- When there are multiple authors, include every author as a separate array entry.
- If an abstract exists, capture it completely. This is very important.
- Do not summarize the abstract; use the original text as-is.
- Return only the JSON without any additional explanation.`;
  },

  parseResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Unable to find JSON in the response');
      }

      const jsonStr = jsonMatch[0];
      const metadata = JSON.parse(jsonStr);

      return {
        title: metadata.title || '',
        authors: Array.isArray(metadata.authors) ? metadata.authors : [],
        year: metadata.year || '',
        journal: metadata.journal || '',
        volume: metadata.volume || '',
        issue: metadata.issue || '',
        pages: metadata.pages || '',
        doi: metadata.doi || '',
        abstract: metadata.abstract || ''
      };
    } catch (error) {
      console.error('Response parsing error:', error);
      throw new Error('Unable to parse AI response: ' + error.message);
    }
  },

  async retryWithBackoff(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = Math.pow(2, i) * 1000;
        console.log(`Retry ${i + 1}/${maxRetries} (after ${delay}ms)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OllamaAPI;
} else if (typeof window !== 'undefined') {
  window.OllamaAPI = OllamaAPI;
}
