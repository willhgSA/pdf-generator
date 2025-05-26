# PDF Generator API

A REST API service that generates PDF documents using Handlebars templates and Puppeteer. This service is designed to create professional PDF reports and documents with a clean, modern design. It uses Handlebars for template rendering and Puppeteer for PDF generation.

## Features

- PDF generation using Handlebars templates and Puppeteer
- Handlebars for dynamic template rendering with powerful templating features
- Puppeteer for high-quality PDF generation with CSS support
- Support for multiple template types
- Integration with Airtable for document storage (stores Firebase Storage URLs)
- Swagger documentation for API endpoints
- Customizable PDF styling and layout

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Airtable account and API key
- Firebase project (for future implementation)

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd pdf-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_airtable_base_id
AIRTABLE_PDF_RECORDS_TABLE=your_pdf_records_table
AIRTABLE_PDF_FIELD_NAME=your_pdf_field_name
```

## Project Structure

```
pdf-generator/
├── src/
│   ├── config/
│   │   ├── airtable.js
│   │   └── swagger.js
│   ├── templates/
│   │   ├── media-plan.hbs
│   │   └── index.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

## Technology Stack

- **Handlebars**: Used for template rendering with support for:
  - Dynamic content insertion
  - Conditional rendering
  - Loops and iterations
  - Custom helpers
  - Layouts and partials

- **Puppeteer**: Used for PDF generation with features like:
  - High-quality PDF output
  - Full CSS support
  - Custom page sizes and margins
  - Background colors and images
  - Page breaks control

## Templates System

### Dynamic Template Loading

The system implements a dynamic template loading mechanism that allows adding new templates without modifying the code. Each template is organized in its own directory with the following structure:

```
src/templates/
└── template-name/
    ├── template.hbs    # The Handlebars template file
    └── metadata.json   # Template configuration and validation
```

### Template Directory Structure

Each template directory must contain:

1. **template.hbs**: The Handlebars template file containing the HTML and template logic
2. **metadata.json**: Configuration file that defines:
   - Template metadata (name, description, version, author)
   - Data structure validation rules
   - Required and optional fields

Example metadata.json:
```json
{
    "name": "Media Plan Analysis",
    "description": "Template for media plan analysis and reporting",
    "version": "1.0.0",
    "author": "Singular Design",
    "dataStructure": {
        "required": ["status", "improved", "reason", "plan_payload"],
        "optional": ["generatedDate"],
        "plan_payload": {
            "required": [
                "media_plan",
                "budget_total",
                "budget_spent",
                "budget_remaining",
                "general_justification"
            ],
            "media_plan": {
                "required": ["media_type", "outlets"],
                "outlets": {
                    "required": [
                        "mediaoutletname",
                        "estimated_reach",
                        "budget_allocated",
                        "frequency",
                        "justification",
                        "insertionorderinstructions"
                    ]
                }
            }
        }
    }
}
```

### Features

1. **Automatic Template Detection**
   - Templates are automatically detected at startup
   - New templates are loaded without server restart
   - Changes to existing templates are detected and reloaded

2. **Hot Reloading**
   - Templates are watched for changes
   - Automatic recompilation when files are modified
   - No server restart required for template updates

3. **Data Validation**
   - Validates required fields
   - Supports nested data structures
   - Handles optional fields
   - Provides clear error messages

4. **Template Management**
   - Easy template addition
   - Centralized template registry
   - Template metadata management
   - Version control support

### Adding a New Template

1. Create a new directory in `src/templates/` with your template name
2. Add `template.hbs` with your Handlebars template
3. Create `metadata.json` with template configuration
4. The system will automatically detect and load the template

Example template.hbs:
```handlebars
<div class="header">
    <h1>{{title}}</h1>
    <p>Generated on: {{generatedDate}}</p>
</div>

{{#each items}}
    <div class="item">
        <h2>{{name}}</h2>
        <p>{{description}}</p>
        {{#if metrics}}
            <div class="metrics">
                {{#each metrics}}
                    <div class="metric">
                        <span>{{label}}:</span>
                        <strong>{{value}}</strong>
                    </div>
                {{/each}}
            </div>
        {{/if}}
    </div>
{{/each}}
```

### Template Creation Process

We recommend using an LLM (Large Language Model) to convert PDF templates into Handlebars templates. Here's the process:

1. Prepare your inputs:
   - PDF template (design/layout)
   - JSON data structure (sample data)

2. Use this prompt with an LLM:
```
I need to create a Handlebars template (.hbs) based on a PDF design and JSON data structure.

PDF Design Requirements:
[Describe or attach the PDF design]

JSON Data Structure:
[Include the JSON structure]

Please create a Handlebars template that:
1. Matches the PDF design exactly
2. Uses the provided JSON structure for data
3. Includes proper HTML and CSS
4. Uses Handlebars syntax for dynamic content
5. Handles all edge cases (empty data, optional sections)
6. Is responsive and print-friendly
7. Includes proper page breaks and styling for PDF generation

The template should be production-ready and follow best practices for PDF generation.
```

3. Create the template files:
   - Save the generated template as `template.hbs`
   - Create the corresponding `metadata.json`
   - Place both files in a new directory under `src/templates/`

4. The template will be automatically available through the API
   - No server restart required
   - No code changes needed
   - Immediate availability for use

## API Endpoints

### GET /templates
Returns a list of all available PDF templates.

### POST /generate-pdf/{templateKey}
Generates a PDF using the specified template.

Query Parameters:
- `saveToAirtable` (boolean): Whether to save the PDF to Airtable

Request Body:
```json
{
  "record_id": "string", // Required if saveToAirtable is true
  // Template specific data
}
```

### POST /preview/{templateKey}
Generates an HTML preview of the template with the provided data.

## Available Templates

### Media Plan Analysis
Template for generating media plan analysis reports with:
- Status section
- Media type sections
- Budget summary
- General justification

## Development

To start the development server:
```bash
npm run dev
```

To start the production server:
```bash
npm start
```

## TODO

- [ ] Implement Firebase Storage integration for PDF storage
- [ ] Add more template types
- [ ] Implement PDF compression
- [ ] Add authentication
- [ ] Add rate limiting
- [ ] Add error logging
- [ ] Add unit tests

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or concerns, please open an issue in the repository. 