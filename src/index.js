const express = require('express');
const multer = require('multer');
const path = require('path');
const puppeteer = require('puppeteer');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const templateRegistry = require('./templates');
const { uploadPDFToAirtable } = require('./config/airtable');
const { validateTemplateData } = require('./templates');
const handlebars = require('handlebars');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON bodies
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /templates:
 *   get:
 *     summary: Get all available templates
 *     description: Returns a list of all available PDF templates
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: List of available templates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 */
app.get('/templates', (req, res) => {
    try {
        const templates = templateRegistry.getAllTemplates();
        res.json(templates);
    } catch (error) {
        res.status(500).json({
            error: 'Error fetching templates',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /generate-pdf/{templateKey}:
 *   post:
 *     summary: Generate a PDF using a specific template
 *     description: Generates a PDF document using either an inline template provided in the request body or a template from the templates directory. If saveToAirtable is true, you must provide a record_id in the request body to attach the PDF to an existing Airtable record.
 *     tags: [PDF Generation]
 *     parameters:
 *       - in: path
 *         name: templateKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Key of the template to use (only used when not providing an inline template)
 *       - in: query
 *         name: saveToAirtable
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Whether to save the PDF to Airtable
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               record_id:
 *                 type: string
 *                 description: Airtable record ID to attach the PDF to an existing Airtable record (required if saveToAirtable is true)
 *               handlebars_template:
 *                 type: string
 *                 description: Optional: Inline Handlebars template. If provided, this template will be used instead of the folder-based template.
 *               json:
 *                 type: object
 *                 description: Optional: Data for the template when using an inline template. If not provided, the rest of the body will be used as template data.
 *             allOf:
 *               - oneOf:
 *                   - $ref: '#/components/schemas/MediaPlanRequest'
 *                   - $ref: '#/components/schemas/CampaignSummaryRequest'
 *                   - $ref: '#/components/schemas/BudgetReportRequest'
 *                   - $ref: '#/components/schemas/PerformanceMetricsRequest'
 *     responses:
 *       200:
 *         description: PDF file generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pdf:
 *                   type: string
 *                   format: binary
 *                 airtableRecord:
 *                   type: object
 *                   description: Airtable record if saved
 *       400:
 *         description: Invalid request body or template key
 *       404:
 *         description: Template not found (only when using folder-based templates)
 *       500:
 *         description: Server error
 */
app.post('/generate-pdf/:templateKey', async (req, res) => {
    try {
        const { templateKey } = req.params;
        console.log('Generating PDF for template:', templateKey);
        
        // Get saveToAirtable from query string and convert to boolean
        const saveToAirtable = req.query.saveToAirtable === 'true' || req.query.saveToAirtable === true;
        const { record_id, handlebars_template, json, ...data } = req.body;

        let template;
        let templateData;

        // Check if we have an inline template
        if (handlebars_template) {
            console.log('Using inline template');
            try {
                // Always parse handlebars_template as a string
                let cleanedTemplate = '';
                if (typeof handlebars_template === 'string') {
                    cleanedTemplate = handlebars_template;
                } else if (typeof handlebars_template === 'object' && handlebars_template !== null) {
                    // If for some reason it comes as an object (rare), try to stringify it
                    try {
                        cleanedTemplate = JSON.stringify(handlebars_template);
                    } catch (err) {
                        console.error('Error stringifying handlebars_template:', err);
                        return res.status(400).json({
                            error: 'Failed to stringify handlebars_template',
                            details: err.message
                        });
                    }
                } else {
                    // Fallback for other types (Buffer, etc)
                    cleanedTemplate = String(handlebars_template);
                }
                // Remove extra quotes if present
                if (cleanedTemplate.startsWith('"') && cleanedTemplate.endsWith('"')) {
                    cleanedTemplate = cleanedTemplate.slice(1, -1);
                }
                // Replace escaped newlines with real newlines
                cleanedTemplate = cleanedTemplate.replace(/\\n/g, '\n');
                // Replace escaped quotes
                cleanedTemplate = cleanedTemplate.replace(/\\"/g, '"');
                // Replace double escaped quotes
                cleanedTemplate = cleanedTemplate.replace(/\\\\"/g, '\\"');
                // Compile the cleaned template
                const compiledTemplate = handlebars.compile(cleanedTemplate);
                template = {
                    name: 'Inline Template',
                    description: 'Template provided in request body',
                    version: '1.0.0',
                    author: 'User',
                    dataStructure: {}, // No validation for inline templates
                    path: null
                };
                // Store the compiled template temporarily
                compiledTemplates[templateKey] = compiledTemplate;
                // Use the provided JSON data or fallback to the rest of the body
                templateData = json || data;
            } catch (error) {
                console.error('Error compiling inline template:', error);
                return res.status(400).json({
                    error: 'Invalid Handlebars template',
                    details: error.message
                });
            }
        } else {
            console.log('Using folder-based template');
            // Use the existing template system
            template = templateRegistry.getTemplate(templateKey);
            if (!template) {
                return res.status(404).json({
                    error: `Template ${templateKey} not found`
                });
            }

            // Flexible validation: warn if missing fields, but always return PDF
            const metadata = template;
            const missingFields = validateTemplateData(data, metadata.dataStructure);
            console.log('Missing fields:', missingFields);
            
            if (missingFields.length > 0) {
                console.warn(`Warning: Missing required fields for template '${templateKey}':`, missingFields);
                res.setHeader('X-Template-Warning', `Missing fields: ${missingFields.join(', ')}`);
            }

            // Prepare data for the template
            const templateDir = path.dirname(template.path);
            templateData = {
                ...data,
                generatedDate: new Date().toLocaleDateString(),
                pageNumber: 1,
                totalPages: 1,
                templateDir
            };
        }

        // Render the template with data
        const pdf = await (async () => {
            const browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox']
            });
            const page = await browser.newPage();
            await page.setContent(templateRegistry.renderTemplate(templateKey, templateData));
            const pdfBuffer = await page.pdf({
                format: 'A4',
                margin: {
                    top: '3cm',
                    right: '2cm',
                    bottom: '3cm',
                    left: '2cm'
                },
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: ``,
                footerTemplate: `
                  <div style='width:calc(100% - 4cm);margin:0 auto;border-top:1px solid #C3875B;padding-top:8px;font-size:10px;text-align:center;color:#C3875B;'>
                    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                  </div>
                `
            });
            await browser.close();
            return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
        })();

        // Clean up temporary template if it was inline
        if (handlebars_template) {
            delete compiledTemplates[templateKey];
        }

        // Check if the PDF is larger than 5 MB before uploading to Airtable
        if (saveToAirtable && pdf.length > 5 * 1024 * 1024) {
            return res.status(400).json({
                error: 'PDF is larger than 5 MB and cannot be uploaded to Airtable.'
            });
        }

        let airtableRecord = null;
        if (saveToAirtable) {
            if (!record_id) {
                return res.status(400).json({
                    error: 'Missing record_id in request body. You must provide a record_id to attach the PDF to an existing Airtable record.'
                });
            }
            try {
                airtableRecord = await uploadPDFToAirtable(pdf, record_id);
            } catch (error) {
                console.error('Error saving to Airtable:', error);
                // Continue with PDF generation even if Airtable save fails
            }
        }

        // Send the PDF as a response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${templateKey}-report.pdf`);
        
        // If Airtable record was created, send it in the response
        if (airtableRecord) {
            res.json({
                pdf: pdf.toString('base64'),
                airtableRecord
            });
        } else {
            res.send(pdf);
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({
            error: 'Error generating PDF',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /preview/{templateKey}:
 *   post:
 *     summary: Preview a template with data
 *     description: Renders the specified template with the provided data and returns the HTML
 *     tags: [Preview]
 *     parameters:
 *       - in: path
 *         name: templateKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Key of the template to preview
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/MediaPlanRequest'
 *               - $ref: '#/components/schemas/CampaignSummaryRequest'
 *               - $ref: '#/components/schemas/BudgetReportRequest'
 *               - $ref: '#/components/schemas/PerformanceMetricsRequest'
 *     responses:
 *       200:
 *         description: HTML preview generated successfully
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       404:
 *         description: Template not found
 *       500:
 *         description: Server error
 */
app.post('/preview/:templateKey', (req, res) => {
    try {
        const { templateKey } = req.params;
        const { handlebars_template, json, ...data } = req.body;
        let template;
        let templateData;

        // Check if we have an inline template
        if (handlebars_template) {
            try {
                // Always parse handlebars_template as a string
                let cleanedTemplate = '';
                if (typeof handlebars_template === 'string') {
                    cleanedTemplate = handlebars_template;
                } else if (typeof handlebars_template === 'object' && handlebars_template !== null) {
                    try {
                        cleanedTemplate = JSON.stringify(handlebars_template);
                    } catch (err) {
                        console.error('Error stringifying handlebars_template:', err);
                        return res.status(400).json({
                            error: 'Failed to stringify handlebars_template',
                            details: err.message
                        });
                    }
                } else {
                    cleanedTemplate = String(handlebars_template);
                }
                if (cleanedTemplate.startsWith('"') && cleanedTemplate.endsWith('"')) {
                    cleanedTemplate = cleanedTemplate.slice(1, -1);
                }
                cleanedTemplate = cleanedTemplate.replace(/\\n/g, '\n');
                cleanedTemplate = cleanedTemplate.replace(/\\"/g, '"');
                cleanedTemplate = cleanedTemplate.replace(/\\\\"/g, '\\"');
                const compiledTemplate = handlebars.compile(cleanedTemplate);
                template = {
                    name: 'Inline Template',
                    description: 'Template provided in request body',
                    version: '1.0.0',
                    author: 'User',
                    dataStructure: {},
                    path: null
                };
                templateData = json || data;
                // Render the inline template
                const html = compiledTemplate(templateData);
                res.send(html);
                return;
            } catch (error) {
                console.error('Error compiling inline template:', error);
                return res.status(400).json({
                    error: 'Invalid Handlebars template',
                    details: error.message
                });
            }
        }

        // Fallback to folder-based template
        const templateObj = templateRegistry.getTemplate(templateKey);
        if (!templateObj) {
            return res.status(404).json({
                error: `Template ${templateKey} not found`
            });
        }

        // Flexible validation: warn if missing fields, but always return HTML
        const metadata = templateObj;
        const missingFields = validateTemplateData(req.body, metadata.dataStructure);
        if (missingFields.length > 0) {
            console.warn(`Warning: Missing required fields for template '${templateKey}':`, missingFields);
            res.setHeader('X-Template-Warning', `Missing fields: ${missingFields.join(', ')}`);
        }

        const templateDir = path.dirname(templateObj.path);
        const templateDataFolder = {
            ...req.body,
            generatedDate: new Date().toLocaleDateString(),
            pageNumber: 1,
            totalPages: 1,
            templateDir
        };
        const html = templateRegistry.renderTemplate(templateKey, templateDataFolder);
        res.send(html);
    } catch (error) {
        console.error('Error generating preview:', error);
        res.status(500).json({
            error: 'Error generating preview',
            details: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
}); 