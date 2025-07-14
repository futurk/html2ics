const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Config endpoint to provide default values and options
app.get('/config', (req, res) => {
    const defaultUrl = process.env.DEFAULT_BASE_URL || '';
    res.json({
        defaultBaseUrlValue: defaultUrl,
        defaultModel: process.env.DEFAULT_MODEL || '',
        baseUrlOptions: [
            { value: 'https://api.openai.com/v1', label: 'OpenAI (Official)' },
            { value: 'https://api.deepseek.com/v1', label: 'DeepSeek (Official)' },
            {
                value: 'custom',
                label: 'Ollama (Local)',
                isDefault: !['https://api.openai.com/v1', 'https://openai-proxy.example.com/v1'].includes(defaultUrl)
            }
        ]
    });
});

// Extract event details endpoint
app.post('/extract', async (req, res) => {
    try {
        const { url, baseUrlValue, apiToken, model } = req.body;

        if (!url || !baseUrlValue) {
            return res.status(400).json({ error: 'URL and base url are required' });
        }

        // Fetch webpage content
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });

        const $ = cheerio.load(response.data);

        // Extract text content (remove scripts and styles)
        $('script, style').remove();
        const textContent = $('body').text().replace(/\s+/g, ' ').trim();

        // Limit content length for API
        const maxLength = 4000;
        const content = textContent.length > maxLength ? textContent.substring(0, maxLength) + '...' : textContent;

        // Initialize OpenAI
        const openaiConfig = {
            baseURL: baseUrlValue
        };
        if (req.body.apiToken) {
            openaiConfig.apiKey = req.body.apiToken;
        }
        const openai = new OpenAI(openaiConfig);

        // Define the structured output schema
        const eventSchema = {
            type: "object",
            properties: {
                title: {
                    type: "string",
                    description: "The event title or name"
                },
                description: {
                    type: "string",
                    description: "A brief description of the event"
                },
                startDate: {
                    type: "string",
                    description: "Event start date and time in ISO format (YYYY-MM-DDTHH:MM)"
                },
                endDate: {
                    type: "string",
                    description: "Event end date and time in ISO format (YYYY-MM-DDTHH:MM), if available"
                },
                location: {
                    type: "string",
                    description: "Event location or venue"
                },
                url: {
                    type: "string",
                    description: "Event URL or registration link"
                }
            },
            required: ["title"],
            additionalProperties: false
        };

        // Extract event details using OpenAI
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: `You are an expert at extracting event information from web page content. 
          Extract the following event details from the provided text:
          - Event title/name
          - Event description
          - Start date and time (convert to ISO format YYYY-MM-DDTHH:MM)
          - End date and time (if available, convert to ISO format YYYY-MM-DDTHH:MM)
          - Location/venue
          - Event URL or registration link
          
          If some information is not available, leave those fields empty or null.
          For dates, try to infer the year if not specified (use current year).
          Convert all times to 24-hour format.`
                },
                {
                    role: "user",
                    content: `Extract event details from this webpage content:\n\n${content}`
                }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "event_details",
                    schema: eventSchema
                }
            }
        });

        const eventDetails = JSON.parse(completion.choices[0].message.content);

        res.json(eventDetails);

    } catch (error) {
        console.error('Error extracting event details:', error);
        res.status(500).json({
            error: error.message || 'Failed to extract event details'
        });
    }
});

// Generate ICS file endpoint
app.post('/generate-ics', async (req, res) => {
    try {
        const { title, description, startDate, endDate, location, url } = req.body;

        if (!title || !startDate) {
            return res.status(400).json({ error: 'Title and start date are required' });
        }

        // Helper function to format date for ICS
        function formatICSDate(dateString) {
            const date = new Date(dateString);
            return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        }

        // Generate unique ID
        const uid = `${Date.now()}-${Math.random().toString(36).substring(2)}@event-extractor`;

        // Create ICS content
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Event Extractor//Event Extractor//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTART:${formatICSDate(startDate)}`,
            endDate ? `DTEND:${formatICSDate(endDate)}` : '',
            `SUMMARY:${title.replace(/,/g, '\\,')}`,
            description ? `DESCRIPTION:${description.replace(/,/g, '\\,').replace(/\n/g, '\\n')}` : '',
            location ? `LOCATION:${location.replace(/,/g, '\\,')}` : '',
            url ? `URL:${url}` : '',
            `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
            'STATUS:CONFIRMED',
            'TRANSP:OPAQUE',
            'END:VEVENT',
            'END:VCALENDAR'
        ].filter(line => line !== '').join('\r\n');

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="event.ics"');
        res.send(icsContent);

    } catch (error) {
        console.error('Error generating ICS file:', error);
        res.status(500).json({
            error: error.message || 'Failed to generate ICS file'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
