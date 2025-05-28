const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Template registry
const templates = {};
const compiledTemplates = {};

/**
 * Load template metadata from JSON file
 * @param {string} metadataPath - Path to the metadata.json file
 * @returns {Object} Template metadata
 */
function loadTemplateMetadata(metadataPath) {
    try {
        const metadataContent = fs.readFileSync(metadataPath, 'utf8');
        return JSON.parse(metadataContent);
    } catch (error) {
        console.error(`Error loading template metadata from ${metadataPath}:`, error);
        return null;
    }
}

/**
 * Load and compile a template
 * @param {string} templatePath - Path to the template.hbs file
 * @returns {Function|null} Compiled template function or null if error
 */
function loadAndCompileTemplate(templatePath) {
    try {
        const templateContent = fs.readFileSync(templatePath, 'utf8');
        return handlebars.compile(templateContent);
    } catch (error) {
        console.error(`Error loading template from ${templatePath}:`, error);
        return null;
    }
}

/**
 * Load all templates from the templates directory
 */
function loadTemplates() {
    const templatesDir = path.join(__dirname);
    
    // Read all directories in the templates folder
    const templateDirs = fs.readdirSync(templatesDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    templateDirs.forEach(dirName => {
        const dirPath = path.join(templatesDir, dirName);
        const templatePath = path.join(dirPath, 'template.hbs');
        const metadataPath = path.join(dirPath, 'metadata.json');

        // Check if both template and metadata files exist
        if (fs.existsSync(templatePath) && fs.existsSync(metadataPath)) {
            const metadata = loadTemplateMetadata(metadataPath);
            if (metadata) {
                // Store template information
                templates[dirName] = {
                    name: metadata.name,
                    description: metadata.description,
                    version: metadata.version,
                    author: metadata.author,
                    dataStructure: metadata.dataStructure,
                    path: templatePath
                };

                // Compile and store template
                const compiledTemplate = loadAndCompileTemplate(templatePath);
                if (compiledTemplate) {
                    compiledTemplates[dirName] = compiledTemplate;
                }
            }
        }
    });
}

// Initial template loading
loadTemplates();

// Watch for changes in templates directory
fs.watch(path.join(__dirname), { recursive: true }, (eventType, filename) => {
    if (filename) {
        console.log(`Template change detected: ${filename}`);
        // Reload templates when changes are detected
        loadTemplates();
    }
});

// Register Handlebars helpers
handlebars.registerHelper('currency', function(value) {
    if (typeof value !== 'number') {
        value = Number(value);
    }
    if (isNaN(value)) return value;
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
});

handlebars.registerHelper('number', function(value) {
    if (typeof value !== 'number') {
        value = Number(value);
    }
    if (isNaN(value)) return value;
    return value.toLocaleString('en-US');
});

handlebars.registerHelper('formatCurrencyDollars', function(text) {
    if (typeof text !== 'string') return text;
    // Regex: busca $ seguido de números, opcionalmente entre paréntesis
    return text.replace(/\$([0-9,]+(?:\.\d+)?)/g, (match, num) => {
        const n = Number(num.replace(/,/g, ''));
        if (isNaN(n)) return match;
        return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    });
});

handlebars.registerHelper('ifFileExists', function(filePath, options) {
    try {
        if (fs.existsSync(filePath)) {
            return options.fn(this);
        }
    } catch (e) {}
    return options.inverse(this);
});

handlebars.registerHelper('concat', function() {
    return Array.from(arguments).slice(0, -1).join('');
});

// Template registry methods
const templateRegistry = {
    /**
     * Get all available templates
     * @returns {Object} Object containing all template metadata
     */
    getAllTemplates: () => {
        return Object.entries(templates).reduce((acc, [key, template]) => {
            acc[key] = {
                name: template.name,
                description: template.description,
                version: template.version,
                author: template.author,
                dataStructure: template.dataStructure
            };
            return acc;
        }, {});
    },

    /**
     * Get a specific template by key
     * @param {string} templateKey - The key of the template to get
     * @returns {Object|null} Template metadata or null if not found
     */
    getTemplate: (templateKey) => {
        return templates[templateKey] || null;
    },

    /**
     * Render a template with data
     * @param {string} templateKey - The key of the template to render
     * @param {Object} data - The data to render the template with
     * @returns {string} The rendered HTML
     */
    renderTemplate: (templateKey, data) => {
        const template = compiledTemplates[templateKey];
        if (!template) {
            throw new Error(`Template ${templateKey} not found`);
        }
        return template(data);
    },

    /**
     * Reload all templates
     * @returns {boolean} Success status
     */
    reloadTemplates: () => {
        try {
            loadTemplates();
            return true;
        } catch (error) {
            console.error('Error reloading templates:', error);
            return false;
        }
    }
};

/**
 * Validate data against template metadata (required fields only, recursive)
 * @param {Object} data - Data to validate
 * @param {Object} structure - Structure from metadata.json (usually metadata.dataStructure)
 * @param {string} path - Current path (for nested fields)
 * @returns {string[]} Array of missing field paths
 */
function validateTemplateData(data, structure, path = '') {
    let errors = [];
    if (!structure) return errors;
    // Validate required fields at this level
    if (Array.isArray(structure.required)) {
        for (const field of structure.required) {
            if (!(field in data)) {
                errors.push(path ? `${path}.${field}` : field);
            } else if (typeof structure[field] === 'object' && structure[field] !== null && !Array.isArray(structure[field])) {
                // If the structure defines a nested object, validate recursively
                errors = errors.concat(
                    validateTemplateData(data[field], structure[field], path ? `${path}.${field}` : field)
                );
            }
        }
    }
    return errors;
}

module.exports = { ...templateRegistry, validateTemplateData }; 