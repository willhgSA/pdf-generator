const express = require('express');
const multer = require('multer');
const path = require('path');
const puppeteer = require('puppeteer');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const templateRegistry = require('./templates');
const { uploadPDFToAirtable } = require('./config/airtable');
const { validateTemplateData } = require('./templates');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON bodies
app.use(express.json());

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
 *     description: Generates a PDF document using the specified template and provided data. If saveToAirtable is true, you must provide a record_id in the request body to attach the PDF to an existing Airtable record.
 *     tags: [PDF Generation]
 *     parameters:
 *       - in: path
 *         name: templateKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Key of the template to use
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
 *                 description: Airtable record ID to attach the PDF (required if saveToAirtable is true)
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
 *         description: Template not found
 *       500:
 *         description: Server error
 */
app.post('/generate-pdf/:templateKey', async (req, res) => {
    try {
        const { templateKey } = req.params;
        // Get saveToAirtable from query string and convert to boolean
        const saveToAirtable = req.query.saveToAirtable === 'true' || req.query.saveToAirtable === true;
        const { record_id, ...data } = req.body;

        const template = templateRegistry.getTemplate(templateKey);

        if (!template) {
            return res.status(404).json({
                error: `Template ${templateKey} not found`
            });
        }

        // Flexible validation: warn if missing fields, but always return PDF
        const metadata = template;
        const missingFields = validateTemplateData(data, metadata.dataStructure);
        if (missingFields.length > 0) {
            console.warn(`Warning: Missing required fields for template '${templateKey}':`, missingFields);
            res.setHeader('X-Template-Warning', `Missing fields: ${missingFields.join(', ')}`);
        }

        // Prepare data for the template
        const templateData = {
            ...data,
            generatedDate: new Date().toLocaleDateString(),
            pageNumber: 1,
            totalPages: 1
        };

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
                    top: '2cm',
                    right: '2cm',
                    bottom: '2.5cm',
                    left: '2cm'
                },
                printBackground: true,
                displayHeaderFooter: true,
                headerTemplate: '<span></span>',
                footerTemplate: `
                  <div style="width:100%;font-size:10px;text-align:center;color:#666;">
                    Page <span class="pageNumber"></span> of <span class="totalPages"></span>
                  </div>
                `
            });
            await browser.close();
            return Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);
        })();

        // Log to verify the PDF is a Buffer
        console.log('PDF is buffer:', Buffer.isBuffer(pdf), 'Type:', typeof pdf, 'Length:', pdf.length);

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
        const template = templateRegistry.getTemplate(templateKey);

        if (!template) {
            return res.status(404).json({
                error: `Template ${templateKey} not found`
            });
        }

        // Flexible validation: warn if missing fields, but always return HTML
        const metadata = template;
        const missingFields = validateTemplateData(req.body, metadata.dataStructure);
        if (missingFields.length > 0) {
            console.warn(`Warning: Missing required fields for template '${templateKey}':`, missingFields);
            res.setHeader('X-Template-Warning', `Missing fields: ${missingFields.join(', ')}`);
        }

        const data = {
            ...req.body,
            generatedDate: new Date().toLocaleDateString(),
            pageNumber: 1,
            totalPages: 1
        };
        
        const html = templateRegistry.renderTemplate(templateKey, data);
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