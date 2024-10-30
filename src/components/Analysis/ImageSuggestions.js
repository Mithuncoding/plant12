import React, { useState, useEffect } from 'react';
import axios from 'axios';
import cheerio from 'cheerio';
import './ImageSuggestions.css';

const ImageSuggestions = ({ analysisResult }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const scrapeImages = async (searchTerm) => {
        try {
            setLoading(true);
            const formattedSearch = searchTerm.replace(' ', '+');
            const url = `https://www.bing.com/images/search?q=${formattedSearch}&FORM=HDRSC2`;
            
            const response = await axios.get(`http://localhost:3001/scrape`, {
                params: {
                    url: url
                }
            });

            const $ = cheerio.load(response.data);
            let imageUrls = [];

            // Find all image containers
            $('a.iusc').each((i, element) => {
                try {
                    const mAttr = $(element).attr('m');
                    if (mAttr) {
                        const imageData = JSON.parse(mAttr);
                        if (imageData.murl) {
                            imageUrls.push(imageData.murl);
                        }
                    }
                } catch (e) {
                    console.error('Error parsing image data:', e);
                }
            });

            // Take only the first two images
            imageUrls = imageUrls.slice(0, 2);
            
            if (imageUrls.length > 0) {
                setImages(imageUrls);
            } else {
                throw new Error('No images found');
            }

        } catch (error) {
            console.error('Scraping error:', error);
            // Set fallback images
            setImages([
                'https://via.placeholder.com/300x200?text=Image+Not+Found',
                'https://via.placeholder.com/300x200?text=Try+Again'
            ]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!analysisResult) return;

        // Extract treatment information from analysis
        if (analysisResult.toLowerCase().includes('fungicide')) {
            scrapeImages('plant fungicide treatment');
        } else if (analysisResult.toLowerCase().includes('pest')) {
            scrapeImages('plant pesticide treatment');
        } else if (analysisResult.toLowerCase().includes('healthy')) {
            scrapeImages('healthy plant example');
        } else {
            scrapeImages('plant treatment solution');
        }
    }, [analysisResult]);

    return (
        <div className="image-suggestions">
            <h3 className="suggestions-title">Related Images</h3>
            
            {loading ? (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading images...</p>
                </div>
            ) : (
                <div className="images-grid">
                    {images.map((url, index) => (
                        <div key={index} className="image-card">
                            <img 
                                src={url} 
                                alt="Plant treatment"
                                onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/300x200?text=Image+Load+Error';
                                }}
                            />
                            <a 
                                href={url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="download-button"
                            >
                                📥 Download
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ImageSuggestions;