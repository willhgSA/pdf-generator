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
│   ├── data/
│   │   ├── sample-data.js
│   │   └── test-data.json
│   ├── templates/
│   │   ├── media-plan/
│   │   │   ├── template.hbs
│   │   │   └── metadata.json
│   │   ├── ... (otros templates)
│   │   └── index.js
│   └── index.js
├── uploads/
├── .env
├── .gitignore
├── LICENSE
├── package.json
├── package-lock.json
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

Templates are organized in subfolders under `src/templates/`, one folder per template. Each template folder must contain:

- `template.hbs`: The Handlebars template file for the document
- `metadata.json`: A JSON file describing the template's metadata and required data structure

**Example:**
```
src/templates/
└── media-plan/
    ├── template.hbs
    └── metadata.json
```

To add a new template, simply create a new folder inside `src/templates/` with the same structure. The system will automatically detect and load new templates at runtime—**no code changes, recompilation, or server restart required**.

#### metadata.json example
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
- **Automatic template detection**: New templates are available instantly.
- **Hot reloading**: Changes to templates or metadata are picked up without restarting the server.
- **Validation**: Each template can define its required and optional fields in `metadata.json`.

### Adding a New Template
1. Create a new folder in `src/templates/` (e.g., `src/templates/my-new-template/`)
2. Add your `template.hbs` and `metadata.json` inside that folder
3. The template will be available immediately via the API

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

### Example request body for /generate-pdf/media-plan

```json
{
  "status": "approved",
  "improved": "yes",
  "reason": "All requirements met",
  "plan_payload": {
    "media_plan": [
      {
        "media_type": "Digital",
        "outlets": [
          {
            "mediaoutletname": "Social Media",
            "estimated_reach": "2.5M",
            "budget_allocated": 50000,
            "frequency": "Daily",
            "justification": "High engagement with target audience",
            "insertionorderinstructions": "Run native content and influencer partnerships"
          }
        ]
      }
    ],
    "budget_total": 100000,
    "budget_spent": 50000,
    "budget_remaining": 50000,
    "general_justification": {
      "targeting": "Hispanic Millennials and African American Professionals",
      "geographic_focus": "Major metropolitan areas",
      "financialefficiencydetail_explained": "Cost-effective reach with high engagement potential"
    }
  }
}
```

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

## Handlebars Helpers for Formatting

The following Handlebars helpers are available for use in any template:

- `{{currency value}}`: Formats a number as USD currency (e.g., $12,500.00).
- `{{number value}}`: Formats a number with thousands separator (e.g., 12,500).
- `{{formatCurrencyDollars text}}`: Formats only numbers in a string that are preceded by a `$` as USD currency (e.g., "$55000" → "$55,000.00"). Useful for sentences with mixed numbers and amounts.

**Example usage in a template:**
```handlebars
<div>Total: {{currency total}}</div>
<div>Items Sold: {{number items_sold}}</div>
<p>{{formatCurrencyDollars calculation_reference}}</p>
```

## Optional Images in Templates

You can use the `ifFileExists` and `concat` Handlebars helpers to conditionally display images (such as logos) in your templates. This ensures that if an image file is missing, the PDF will still be generated without errors.

**Example usage in a template:**

```handlebars
{{#ifFileExists (concat templateDir "/grassroots-logo.jpg")}}
  <img src="file://{{templateDir}}/grassroots-logo.jpg" alt="Grassroots Media Logo" style="height:60px; margin-bottom:10px;" />
{{/ifFileExists}}
```

- `templateDir` is automatically provided to the template and points to the directory of the current template.
- The image will only be shown if the file exists in the template's directory.
- If the image is missing, the PDF will be generated without the logo and without errors.

This approach is recommended for any optional images or resources you want to include in your templates.

---

## Template Creation Process (Prompt for LLM)

To create a new Handlebars template and its corresponding metadata.json from a PDF design and a sample JSON data structure, use the following prompt:

```
I need you to generate two files for a PDF generation system:
1. A Handlebars template (.hbs) that matches the provided PDF design and uses the provided JSON data structure for dynamic content.
2. A metadata.json file that describes the required and optional fields, and the nested structure of the JSON data needed by the template.

**PDF Design:**
[Describe or attach the PDF design here]

**Sample JSON Data:**
[Paste the JSON data structure here]

**Instructions:**
- The .hbs template should use Handlebars syntax for all dynamic fields and sections.
- Use the helpers `currency`, `number`, and `formatCurrencyDollars` where appropriate for formatting amounts and numbers.
- The metadata.json should specify all required and optional fields, including nested objects and arrays, matching the structure of the sample JSON.
- The output should be production-ready and follow best practices for PDF generation.
- Return both files: the .hbs template and the metadata.json.
```

--- 