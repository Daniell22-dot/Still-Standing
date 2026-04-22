const { spawn } = require('child_process');
const path = require('path');

/**
 * Analyzes text using the Python sentiment analysis script
 * @param {string} text - The text to analyze
 * @returns {Promise<Object>} - The analysis result
 */
const analyzeSentiment = (text) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../scripts/analyze_sentiment.py');
        
        // Spawn python process
        // Use 'python' or 'python3' depending on system
        const pythonProcess = spawn('python', [scriptPath, text]);
        
        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}: ${errorString}`);
                return reject(new Error('Sentiment analysis failed'));
            }
            try {
                const result = JSON.parse(dataString);
                resolve(result);
            } catch (e) {
                reject(new Error('Failed to parse Python output'));
            }
/**
 * Generates a PDF Safety Plan using Python
 * @param {Object} data - User safety plan data
 * @param {string} fileName - Output filename
 * @returns {Promise<Object>} - The PDF path
 */
const generateSafetyPlanPDF = (data, fileName) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../scripts/generate_pdf.py');
        const pythonProcess = spawn('python', [scriptPath, JSON.stringify(data), fileName]);
        
        let dataString = '';
        pythonProcess.stdout.on('data', (d) => dataString += d.toString());
        pythonProcess.on('close', (code) => {
            if (code !== 0) return reject(new Error('PDF generation failed'));
            resolve(JSON.parse(dataString));
        });
    });
};

/**
 * Gets an empathetic AI response from Gemini
 * @param {string} text - User text
 * @returns {Promise<Object>} - The AI response
 */
const getEmpatheticResponse = (text) => {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../../scripts/empathetic_response.py');
        const pythonProcess = spawn('python', [scriptPath, text]);
        
        let dataString = '';
        pythonProcess.stdout.on('data', (d) => dataString += d.toString());
        pythonProcess.on('close', (code) => {
            if (code !== 0) return reject(new Error('AI response generation failed'));
            resolve(JSON.parse(dataString));
        });
    });
};

module.exports = { analyzeSentiment, generateSafetyPlanPDF, getEmpatheticResponse };
