/**
 * OpenAI API communication module
 * Provides AI calls to extract metadata from PDF text
 */

class OpenAIService {
    constructor() {
        this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        this.defaultModel = 'gpt-4-turbo';
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }

    /**
     * Extract metadata from PDF text
     * @param {string} text - Extracted PDF text
     * @param {string} apiKey - OpenAI API key
     * @param {string} model - Model to use (default: gpt-4-turbo)
     * @returns {Promise<Object>} Extracted metadata object
     */
    async extractMetadata(text, apiKey, model = this.defaultModel) {
        if (!text || !text.trim()) {
            throw new Error('Text is empty.');
        }

        if (!apiKey) {
            throw new Error('OpenAI API key is required.');
        }

        const prompt = this._buildMetadataPrompt(text);
        
        try {
            const response = await this._callOpenAI(prompt, apiKey, model);
            return this._parseMetadataResponse(response);
        } catch (error) {
            throw new Error(`Failed to extract metadata: ${error.message}`);
        }
    }

    /**
     * Build the metadata extraction prompt
     * @param {string} text - PDF text
     * @returns {string} Completed prompt
     */
    _buildMetadataPrompt(text) {
        return `The following text was extracted from the first page of an academic paper PDF. Extract bibliographic metadata from this text and return valid JSON.

Text:
"""
${text.substring(0, 4000)} // Limit to 4000 characters for token constraints
"""

Follow this JSON schema exactly:
{
  "title": "Paper title",
  "authors": ["Author 1", "Author 2", "Author 3"],
  "year": 2024,
  "journal": "Journal name",
  "volume": "Volume number",
  "issue": "Issue number",
  "pages": "Page range",
  "doi": "DOI number",
  "abstract": "Abstract (if available)",
  "keywords": ["Keyword 1", "Keyword 2"],
  "confidence": 0.95
}

Important rules:
1. Return valid JSON only.
2. Set fields to null when the information cannot be found.
3. Always return authors as an array; separate each author into its own element.
4. Return the year as a number.
5. confidence represents extraction accuracy (between 0 and 1).
6. Include the DOI if it is available.
7. Capture the abstract if it exists - this is very important.
8. Return only the JSON with no additional explanation.
9. When multiple authors are present, include each as a separate array element.
10. Extract the abstract in full sentences without summarizing.

JSON:`;
    }

    /**
     * Call the OpenAI API
     * @param {string} prompt - Prompt to send
     * @param {string} apiKey - API key
     * @param {string} model - Model name
     * @returns {Promise<string>} API response
     */
    async _callOpenAI(prompt, apiKey, model) {
        const requestBody = {
            model: model,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.1, // Keep low for consistent results
            response_format: { type: "json_object" }
        };

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();
                
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('Invalid API response format');
                }

                return data.choices[0].message.content;

            } catch (error) {
                console.error(`OpenAI API call attempt ${attempt}/${this.maxRetries} failed:`, error);

                if (attempt === this.maxRetries) {
                    throw error;
                }

                // Retry with exponential backoff
                await this._sleep(this.retryDelay * Math.pow(2, attempt - 1));
            }
        }
    }

    /**
     * Parse metadata from the API response
     * @param {string} response - OpenAI API response
     * @returns {Object} Parsed metadata
     */
    _parseMetadataResponse(response) {
        try {
            const metadata = JSON.parse(response);
            
            // Validate required fields
            const requiredFields = ['title', 'authors', 'year'];
            for (const field of requiredFields) {
                if (!metadata.hasOwnProperty(field)) {
                    console.warn(`Missing required field: ${field}`);
                }
            }

            // Normalize data types
            if (metadata.year && typeof metadata.year === 'string') {
                metadata.year = parseInt(metadata.year) || null;
            }

            if (metadata.authors && typeof metadata.authors === 'string') {
                metadata.authors = [metadata.authors];
            }

            // Set a default confidence
            if (!metadata.confidence) {
                metadata.confidence = 0.8;
            }

            return metadata;

        } catch (error) {
            throw new Error(`JSON parsing failed: ${error.message}`);
        }
    }

    /**
     * Asynchronous sleep helper
     * @param {number} ms - Delay in milliseconds
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validate the API key
     * @param {string} apiKey - API key to validate
     * @returns {Promise<boolean>} Validation result
     */
    async validateApiKey(apiKey) {
        if (!apiKey || !apiKey.startsWith('sk-')) {
            return false;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }
}

// Export for global access in the Zotero environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenAIService;
} else if (typeof window !== 'undefined') {
    window.OpenAIService = OpenAIService;
}
