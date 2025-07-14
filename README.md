# Event Extractor

A Node.js + Express.js application that extracts event details from web pages using OpenAI's structured output and generates downloadable ICS calendar files.

## Features

- 🤖 **AI-Powered Extraction**: Uses OpenAI's structured output to extract event details from web pages
- 🎯 **Smart Web Scraping**: Extracts clean text content using Cheerio
- ✏️ **Editable Form**: Review and modify extracted event details before generating ICS
- 📅 **ICS Generation**: Creates RFC-compliant calendar files for download
- 🔧 **Environment Configuration**: Secure API key management with .env files
- 🎨 **Clean UI**: Modern, responsive web interface

## Project Structure

```
event-extractor/
├── app.js              # Main Express application
├── package.json        # Dependencies and scripts
├── .env               # Environment variables (create this)
├── public/
│   └── index.html     # Frontend HTML interface
└── README.md          # This file
```

## Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   Create a `.env` file in the root directory:
   ```bash
   DEFAULT_BASE_URL=http://localhost:11434/v1/
   DEFAULT_MODEL=qwen3:0.6b
   ```

## Usage

1. **Start the server**:
   ```bash
   npm start
   ```
   
   For development with auto-restart:
   ```bash
   npm run dev
   ```

2. **Open your browser** and go to `http://localhost:3000`

3. **Extract event details**:
   - Enter the URL of an event webpage
   - The base url and model tag fields will be pre-filled if configured in `.env`
   - Click "Extract Event Details"

4. **Review and edit** the extracted information in the form

5. **Generate ICS file** by clicking "Generate & Download ICS File"

## API Endpoints

- `GET /` - Serves the main HTML interface
- `GET /config` - Returns configuration (default OpenAI token)
- `POST /extract` - Extracts event details from a webpage
- `POST /generate-ics` - Generates and downloads ICS file

## Dependencies

- **express**: Web framework
- **axios**: HTTP client for web scraping
- **cheerio**: Server-side jQuery for HTML parsing
- **openai**: OpenAI API client
- **dotenv**: Environment variable management

## Security Notes

- API keys are handled securely via environment variables
- No data is persisted on the server
- All processing happens in memory during the session
- Remember to add `.env` to your `.gitignore` file

### File Structure Check

Ensure your project structure looks like this:
```
├── app.js
├── package.json
├── .env
├── public/
│   └── index.html
└── README.md
```

## License

MIT License - Feel free to use and modify as needed.