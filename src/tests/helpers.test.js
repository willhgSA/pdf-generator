// Import handlebars to access registered helpers
const handlebars = require('handlebars');
// We need to ensure our helpers are registered before tests run.
// This might mean importing the module that registers them.
require('../templates/index.js');

describe('Handlebars Helpers', () => {
    describe('formatDate', () => {
        it('should format a date as YYYY-MM-DD', () => {
            const date = '2023-10-26T10:00:00.000Z'; // A specific UTC date
            // Setting timezone to UTC for consistent testing, actual output might depend on server's timezone
            // For YYYY-MM-DD, the current implementation manually constructs it, so timezone influence is on Date() parsing
            const expectedDate = new Date(date);
            const formatted = handlebars.helpers.formatDate(expectedDate, 'YYYY-MM-DD');
            expect(formatted).toBe(`${expectedDate.getUTCFullYear()}-${('0' + (expectedDate.getUTCMonth() + 1)).slice(-2)}-${('0' + expectedDate.getUTCDate()).slice(-2)}`);
        });

        it('should format a date using default options when format is not YYYY-MM-DD or valid JSON', () => {
            const date = new Date(2023, 9, 26); // October 26, 2023 (month is 0-indexed)
            // Default format is 'long' month, 'numeric' day, 'numeric' year for en-US
            const formatted = handlebars.helpers.formatDate(date, 'SomeInvalidFormatString');
            // This will use Intl.DateTimeFormat with default options: { year: 'numeric', month: 'long', day: 'numeric' }
            expect(formatted).toBe('October 26, 2023');
        });

        it('should format a Date object using default options', () => {
            const date = new Date(2024, 0, 15); // January 15, 2024
            const formatted = handlebars.helpers.formatDate(date); // No format string provided
            expect(formatted).toBe('January 15, 2024');
        });

        it('should handle an invalid date string by formatting it as "Invalid Date" or similar default for it', () => {
            const formatted = handlebars.helpers.formatDate('not a real date');
            // new Date('not a real date').toString() is "Invalid Date"
            // Intl.DateTimeFormat will format "Invalid Date" according to locale.
            // For en-US, an invalid date typically results in "Invalid Date" or similar from toLocaleString/format
            // The exact output can be tricky as Intl.DateTimeFormat might throw or return specific strings.
            // new Date('not a real date').toString() is "Invalid Date"
            // The helper should now return 'Invalid Date' directly.
            expect(formatted).toBe('Invalid Date');
        });

        it('should format a date using a valid JSON options string for format', () => {
            const date = new Date(2023, 9, 26); // October 26, 2023
            const formatOptions = JSON.stringify({ year: '2-digit', month: 'numeric', day: 'numeric' });
            const formatted = handlebars.helpers.formatDate(date, formatOptions);
            // For en-US, this would be like "10/26/23"
            expect(formatted).toBe('10/26/23');
        });

        // Test for 'DD/MM/YYYY' - current implementation doesn't directly support this custom string.
        // It would require modification to formatDate or using a JSON that results in this (locale dependent).
        // For now, this test will show the limitation or how it behaves with such a string.
        it("should use default formatting for 'DD/MM/YYYY' as it's not 'YYYY-MM-DD' or valid JSON", () => {
            const date = new Date(2023, 9, 26); // October 26, 2023 (month is 0-indexed)
            const formatted = handlebars.helpers.formatDate(date, 'DD/MM/YYYY');
            // It will fall into the catch or default path if JSON.parse fails
            expect(formatted).toBe('October 26, 2023');
        });
    });

    describe('getCurrentYear', () => {
        it('should return the current year', () => {
            const currentYear = new Date().getFullYear();
            expect(handlebars.helpers.getCurrentYear()).toBe(currentYear);
        });
    });
});
