const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const recordsRoute = require('./routes/records'); // Importing routes
const app = express();
const PORT = 5000;

// Set Python executable to Python 3.11
const pythonExecutable = "C:\\Program Files\\Python311\\python.exe";
// "C:\\Users\\saksh\\AppData\\Roaming\\Python\\Python311\\python.exe";

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// exec('python3 -c "import sys; print(sys.executable)"', (error, stdout, stderr) => {
//     if (error) {
//         console.error(`Exec error: ${error}`);
//         return;
//     }
//     console.log(`Python Executable: ${stdout.trim()}`);
// });


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files to the uploads directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    },
});
const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB connection
mongoose
    .connect('mongodb://127.0.0.1:27017/mern_records', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Routes
app.use('/api/', recordsRoute);

// Health check
app.get('/api', (req, res) => {
    res.send('API is working');
});

// Prediction route
app.post('/api/predict', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const imagePath = path.resolve(req.file.path); // Ensure absolute path
    console.log('Processing image at:', imagePath);

    // Execute the Python script with Python 3.11
    const pythonScript = `"${pythonExecutable}" model_processing.py "${imagePath}"`;
    exec(pythonScript, (error, stdout, stderr) => {
        // Clean up the uploaded image after processing
        fs.unlink(imagePath, (err) => {
            if (err) console.error(`Error deleting file: ${imagePath}`);
        });

        if (error) {
            console.error(`Exec error: ${error}`);
            console.error(`Stderr: ${stderr}`);
            return res.status(500).json({ error: 'Failed to process image.', details: stderr.trim() });
        }

        try {
            // Remove unwanted ANSI escape codes or extra spaces from stdout
            const sanitizedOutput = stdout.replace(/\x1B\[[0-9;]*[mG]/g, '').trim();
            console.log('Sanitized output:', sanitizedOutput);
            const outputLines = sanitizedOutput.split('\n');

            // Map parsed output to JSON fields
            const predictedClass = outputLines[0]?.replace('Predicted Class: ', '').trim() || 'Unknown';
            const confidence = outputLines[1]?.replace('Confidence: ', '').trim() || '0.00';
            const recommendations = outputLines[2]?.replace('Recommendations: ', '').trim() || 'No recommendations available.';

            // Send JSON response
            res.json({
                predictedClass,
                confidence,
                recommendations,
            });
        } catch (parseError) {
            console.error('Error parsing Python script output:', parseError);
            res.status(500).json({ error: 'Error processing prediction results.' });
        }
    });
});
// Start the server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
