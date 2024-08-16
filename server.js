require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const shortid = require('shortid');
const Url = require('./models/Url');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(express.static('views'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });

// Shorten URL
app.post('/shorten', async (req, res) => {
    try {
        const { originalUrl } = req.body;
        if (!originalUrl) {
            return res.status(400).json({ error: 'Original URL is required' });
        }

        // Validate URL format
        const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
        if (!urlRegex.test(originalUrl)) {
            return res.status(400).json({ error: 'Invalid URL format' });
        }

        // Check for 'localhost'
        // if (originalUrl.includes('localhost')) {
        //     return res.status(400).json({ error: 'URL cannot contain "localhost"' });
        // }

        const shortId = shortid.generate();
        const newUrl = new Url({ originalUrl, shortId });

        await newUrl.save();
        res.json({ shortUrl: `/${shortId}` }); // Return only the short path
    } catch (error) {
        console.error('Error shortening the URL:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// Redirect to the original URL
app.get('/:shortId', async (req, res) => {
    try {
        const { shortId } = req.params;
        const url = await Url.findOne({ shortId });
        if (url) {
            res.redirect(url.originalUrl);
        } else {
            res.status(404).json({ error: 'URL not found' });
        }
    } catch (error) {
        console.error('Error redirecting URL:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
