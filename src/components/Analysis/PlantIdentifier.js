import React, { useState, useRef, useEffect, useContext } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HistoryContext } from '../../context/HistoryContext';
import './PlantIdentifier.css';

const genAI = new GoogleGenerativeAI('AIzaSyA1kUgKi87qD14cUVf02B37s6qiJMMOakM');

// Utility Functions
export const fetchPlantInfo = async (plantName, language = 'en') => {
  console.log(`Starting API request for ${plantName} in ${language}`);
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Analyze this ${plantName} plant and provide information in ${language} language. 
      Return ONLY a JSON object (no markdown, no explanation) with this structure:
      {
        "name": "${plantName}",
        "scientificName": "scientific name",
        "description": "brief description",
        "careGuide": {
          "water": "watering needs",
          "sunlight": "sunlight requirements",
          "temperature": "ideal temperature range"
        }
      }`;

    console.log('Sending prompt to API...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Raw API response:', text);

    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonStr = jsonMatch[0];
    console.log('Extracted JSON:', jsonStr);

    const parsedData = JSON.parse(jsonStr);
    
    if (!parsedData.name || !parsedData.scientificName || !parsedData.careGuide) {
      throw new Error('Invalid data structure');
    }

    return parsedData;

  } catch (error) {
    console.error('Error fetching plant info:', error);
    throw error;
  }
};

export const analyzePlant = async (imageData, imageType, location, language = 'en') => {
  try {
    console.log('Starting plant analysis...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    const imageBase64 = imageData.startsWith('data:') ? imageData : `data:${imageType};base64,${imageData}`;

    const prompt = `
    Please analyze this plant image and provide a detailed response in ${language} language with the following structure:

    Plant Identification:
    - Scientific name and common name
    - Plant family
    - Growth stage

    Disease Analysis:
    - Current health status
    - Disease identification (if any)
    - Severity assessment

    Treatment Plan:
    - Immediate actions needed
    - Prevention measures
    - Care instructions

    Location Compatibility:
    - Suitability for location: ${location}
    - Climate requirements
    - Growth potential

    Please format the response with clear sections and bullet points.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: imageType
        }
      }
    ]);

    const response = await result.response;
    const analysisText = response.text();
    
    console.log('Analysis complete');
    return analysisText;

  } catch (error) {
    console.error('Plant analysis error:', error);
    throw new Error(`Failed to analyze plant: ${error.message}`);
  }
};

export const getPlantDiseases = async (plantName, language = 'en') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    List common diseases for ${plantName} in ${language} language. 
    Return as JSON array with structure:
    [
      {
        "name": "disease name",
        "symptoms": ["symptom1", "symptom2"],
        "treatment": "treatment description",
        "prevention": "prevention methods"
      }
    ]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Error fetching plant diseases:', error);
    throw error;
  }
};

export const getTreatmentRecommendations = async (disease, language = 'en') => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
    Provide treatment recommendations for ${disease} in ${language} language.
    Return as JSON with structure:
    {
      "immediate": ["step1", "step2"],
      "preventive": ["measure1", "measure2"],
      "organic_solutions": ["solution1", "solution2"],
      "chemical_solutions": ["product1", "product2"]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Error fetching treatment recommendations:', error);
    throw error;
  }
};

export const getLocationName = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_OPENCAGE_API_KEY`
    );
    const data = await response.json();
    return data.results[0].formatted;
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Location not available';
  }
};

// Categories Data
const categories = [
    { id: 'all', name: 'All Plants', emoji: '🌱' },
    { id: 'cereals', name: 'Cereals & Millets', emoji: '🌾' },
    { id: 'pulses', name: 'Pulses', emoji: '🫘' },
    { id: 'vegetables', name: 'Vegetables', emoji: '🥬' },
    { id: 'fruits', name: 'Fruits', emoji: '🍎' },
    { id: 'spices', name: 'Spices', emoji: '🌶️' },
    { id: 'commercial', name: 'Commercial Crops', emoji: '🌿' },
    { id: 'ornamental', name: 'Ornamental Plants', emoji: '🌺' },
    { id: 'medicinal', name: 'Medicinal Plants', emoji: '🌿' },
    { id: 'trees', name: 'Trees', emoji: '🌳' },
    { id: 'others', name: 'Unknown Plant', emoji: '🔍' }
];

// Add 100 trees to the plants array
const treesData = [
    {
        id: 191,
        name: 'Banyan',
        scientificName: 'Ficus benghalensis',
        category: 'trees',
        emoji: '🌳',
        description: 'National tree of India'
    },
    {
        id: 192,
        name: 'Neem',
        scientificName: 'Azadirachta indica',
        category: 'trees',
        emoji: '🌳',
        description: 'Medicinal tree'
    },
    {
        id: 193,
        name: 'Peepal',
        scientificName: 'Ficus religiosa',
        category: 'trees',
        emoji: '🌳',
        description: 'Sacred fig tree'
    },
    {
        id: 194,
        name: 'Teak',
        scientificName: 'Tectona grandis',
        category: 'trees',
        emoji: '🌳',
        description: 'Valuable timber tree'
    },
    {
        id: 195,
        name: 'Ashoka',
        scientificName: 'Saraca asoca',
        category: 'trees',
        emoji: '🌳',
        description: 'Sacred tree of India'
    },
    {
        id: 196,
        name: 'Gulmohar',
        scientificName: 'Delonix regia',
        category: 'trees',
        emoji: '🌺',
        description: 'Flamboyant tree'
    },
    {
        id: 197,
        name: 'Sal',
        scientificName: 'Shorea robusta',
        category: 'trees',
        emoji: '🌳',
        description: 'Important timber tree'
    },
    {
        id: 198,
        name: 'Jamun',
        scientificName: 'Syzygium cumini',
        category: 'trees',
        emoji: '🌳',
        description: 'Indian blackberry tree'
    },
    {
        id: 199,
        name: 'Arjuna',
        scientificName: 'Terminalia arjuna',
        category: 'trees',
        emoji: '🌳',
        description: 'Medicinal bark tree'
    },
    {
        id: 200,
        name: 'Tamarind',
        scientificName: 'Tamarindus indica',
        category: 'trees',
        emoji: '🌳',
        description: 'Sour fruit tree'
    },
    {
        id: 201,
        name: 'Sandalwood',
        scientificName: 'Santalum album',
        category: 'trees',
        emoji: '🌳',
        description: 'Fragrant wood tree'
    },
    {
        id: 202,
        name: 'Bamboo',
        scientificName: 'Bambusoideae',
        category: 'trees',
        emoji: '🎋',
        description: 'Fast-growing grass tree'
    },
    {
        id: 203,
        name: 'Amla',
        scientificName: 'Phyllanthus emblica',
        category: 'trees',
        emoji: '🌳',
        description: 'Indian gooseberry tree'
    },
    {
        id: 204,
        name: 'Mahua',
        scientificName: 'Madhuca longifolia',
        category: 'trees',
        emoji: '🌳',
        description: 'Butter tree'
    },
    {
        id: 205,
        name: 'Palash',
        scientificName: 'Butea monosperma',
        category: 'trees',
        emoji: '🌺',
        description: 'Flame of the forest'
    },
    {
        id: 206,
        name: 'Kadamba',
        scientificName: 'Neolamarckia cadamba',
        category: 'trees',
        emoji: '🌳',
        description: 'Ancient sacred tree'
    },
    {
        id: 207,
        name: 'Sheesham',
        scientificName: 'Dalbergia sissoo',
        category: 'trees',
        emoji: '🌳',
        description: 'Indian rosewood'
    },
    {
        id: 208,
        name: 'Amaltas',
        scientificName: 'Cassia fistula',
        category: 'trees',
        emoji: '🌼',
        description: 'Golden shower tree'
    },
    {
        id: 209,
        name: 'Karanj',
        scientificName: 'Pongamia pinnata',
        category: 'trees',
        emoji: '🌳',
        description: 'Indian beech'
    },
    {
        id: 210,
        name: 'Babul',
        scientificName: 'Acacia nilotica',
        category: 'trees',
        emoji: '🌳',
        description: 'Gum arabic tree'
    },
    {
        id: 211,
        name: 'Chinar',
        scientificName: 'Platanus orientalis',
        category: 'trees',
        emoji: '🍁',
        description: 'Oriental plane tree'
    },
    {
        id: 212,
        name: 'Deodar',
        scientificName: 'Cedrus deodara',
        category: 'trees',
        emoji: '🌲',
        description: 'Himalayan cedar'
    },
    {
        id: 213,
        name: 'Mango',
        scientificName: 'Mangifera indica',
        category: 'trees',
        emoji: '🥭',
        description: 'National fruit tree'
    },
    {
        id: 214,
        name: 'Jackfruit',
        scientificName: 'Artocarpus heterophyllus',
        category: 'trees',
        emoji: '🌳',
        description: 'Largest tree fruit'
    },
    {
        id: 215,
        name: 'Coconut Palm',
        scientificName: 'Cocos nucifera',
        category: 'trees',
        emoji: '🌴',
        description: 'Tropical palm tree'
    },
    {
        id: 216,
        name: 'Mulberry',
        scientificName: 'Morus alba',
        category: 'trees',
        emoji: '🌳',
        description: 'Silkworm host tree'
    },
    {
        id: 217,
        name: 'Indian Cork',
        scientificName: 'Millingtonia hortensis',
        category: 'trees',
        emoji: '🌳',
        description: 'Indian cork tree'
    },
    {
        id: 218,
        name: 'Kachnar',
        scientificName: 'Bauhinia variegata',
        category: 'trees',
        emoji: '🌸',
        description: 'Orchid tree'
    },
    {
        id: 219,
        name: 'Parijat',
        scientificName: 'Nyctanthes arbor-tristis',
        category: 'trees',
        emoji: '🌳',
        description: 'Night jasmine tree'
    },
    {
        id: 220,
        name: 'Indian Coral',
        scientificName: 'Erythrina variegata',
        category: 'trees',
        emoji: '🌳',
        description: 'Tiger claw tree'
    }
];

// Add these new entries to your plants array
const additionalPlants = [
    // Rare Tropical Plants
    {
        id: 221,
        name: 'Rafflesia',
        scientificName: 'Rafflesia arnoldii',
        category: 'ornamental',
        emoji: '🌺',
        description: 'Largest individual flower in the world'
    },
    {
        id: 222,
        name: 'Ghost Orchid',
        scientificName: 'Dendrophylax lindenii',
        category: 'ornamental',
        emoji: '👻',
        description: 'Rare endangered orchid'
    },
    {
        id: 223,
        name: 'Corpse Flower',
        scientificName: 'Amorphophallus titanum',
        category: 'ornamental',
        emoji: '💀',
        description: 'Largest unbranched inflorescence'
    },
    
    // Medicinal Plants
    {
        id: 224,
        name: 'Ginseng',
        scientificName: 'Panax ginseng',
        category: 'medicinal',
        emoji: '🌿',
        description: 'Valuable medicinal root'
    },
    {
        id: 225,
        name: 'Kratom',
        scientificName: 'Mitragyna speciosa',
        category: 'medicinal',
        emoji: '🍃',
        description: 'Traditional medicinal tree'
    },

    // Desert Plants
    {
        id: 226,
        name: 'Saguaro Cactus',
        scientificName: 'Carnegiea gigantea',
        category: 'others',
        emoji: '🌵',
        description: 'Giant desert cactus'
    },
    {
        id: 227,
        name: 'Joshua Tree',
        scientificName: 'Yucca brevifolia',
        category: 'trees',
        emoji: '🏜️',
        description: 'Iconic desert tree'
    },

    // Carnivorous Plants
    {
        id: 228,
        name: 'Venus Flytrap',
        scientificName: 'Dionaea muscipula',
        category: 'others',
        emoji: '🪤',
        description: 'Carnivorous snap trap plant'
    },
    {
        id: 229,
        name: 'Pitcher Plant',
        scientificName: 'Nepenthes',
        category: 'others',
        emoji: '⚱️',
        description: 'Carnivorous pitcher trap'
    },

    // Ancient Plants
    {
        id: 230,
        name: 'Ginkgo',
        scientificName: 'Ginkgo biloba',
        category: 'trees',
        emoji: '🍂',
        description: 'Living fossil tree'
    },
    {
        id: 231,
        name: 'Wollemi Pine',
        scientificName: 'Wollemia nobilis',
        category: 'trees',
        emoji: '🌲',
        description: 'Prehistoric tree species'
    },

    // Aquatic Plants
    {
        id: 232,
        name: 'Giant Kelp',
        scientificName: 'Macrocystis pyrifera',
        category: 'others',
        emoji: '🌊',
        description: 'Marine forest creator'
    },
    {
        id: 233,
        name: 'Victoria Water Lily',
        scientificName: 'Victoria amazonica',
        category: 'others',
        emoji: '💦',
        description: 'Giant aquatic plant'
    },

    // Parasitic Plants
    {
        id: 234,
        name: 'Mistletoe',
        scientificName: 'Viscum album',
        category: 'others',
        emoji: '🎄',
        description: 'Parasitic holiday plant'
    },
    {
        id: 235,
        name: 'Dodder',
        scientificName: 'Cuscuta',
        category: 'others',
        emoji: '🕸️',
        description: 'Parasitic vine'
    }
];

// Add these new entries to your plants array
const morePlants = [
    // Fruits
    {
        id: 236,
        name: 'Pomegranate',
        scientificName: 'Punica granatum',
        category: 'fruits',
        emoji: '🫐',
        description: 'Ancient fruit with ruby seeds'
    },
    {
        id: 237,
        name: 'Dragon Fruit',
        scientificName: 'Hylocereus undatus',
        category: 'fruits',
        emoji: '🐉',
        description: 'Exotic cactus fruit'
    },
    {
        id: 238,
        name: 'Passion Fruit',
        scientificName: 'Passiflora edulis',
        category: 'fruits',
        emoji: '🟣',
        description: 'Tropical vine fruit'
    },
    {
        id: 239,
        name: 'Star Fruit',
        scientificName: 'Averrhoa carambola',
        category: 'fruits',
        emoji: '⭐',
        description: 'Star-shaped tropical fruit'
    },
    {
        id: 240,
        name: 'Kiwi',
        scientificName: 'Actinidia deliciosa',
        category: 'fruits',
        emoji: '🥝',
        description: 'Fuzzy brown fruit'
    },
    {
        id: 241,
        name: 'Fig',
        scientificName: 'Ficus carica',
        category: 'fruits',
        emoji: '🪘',
        description: 'Sweet Mediterranean fruit'
    },
    {
        id: 242,
        name: 'Lychee',
        scientificName: 'Litchi chinensis',
        category: 'fruits',
        emoji: '🌟',
        description: 'Sweet Asian fruit'
    },
    {
        id: 243,
        name: 'Rambutan',
        scientificName: 'Nephelium lappaceum',
        category: 'fruits',
        emoji: '🔴',
        description: 'Hairy red tropical fruit'
    },
    {
        id: 244,
        name: 'Durian',
        scientificName: 'Durio zibethinus',
        category: 'fruits',
        emoji: '👑',
        description: 'King of fruits'
    },
    {
        id: 245,
        name: 'Mangosteen',
        scientificName: 'Garcinia mangostana',
        category: 'fruits',
        emoji: '🟣',
        description: 'Queen of fruits'
    },

    // Flowering Plants
    {
        id: 246,
        name: 'Bird of Paradise',
        scientificName: 'Strelitzia reginae',
        category: 'ornamental',
        emoji: '🦜',
        description: 'Exotic tropical flower'
    },
    {
        id: 247,
        name: 'Cherry Blossom',
        scientificName: 'Prunus serrulata',
        category: 'ornamental',
        emoji: '🌸',
        description: 'Japanese flowering tree'
    },
    {
        id: 248,
        name: 'Chrysanthemum',
        scientificName: 'Chrysanthemum morifolium',
        category: 'ornamental',
        emoji: '🏵️',
        description: 'Traditional Asian flower'
    },
    {
        id: 249,
        name: 'Dahlia',
        scientificName: 'Dahlia pinnata',
        category: 'ornamental',
        emoji: '🎨',
        description: 'Colorful garden flower'
    },
    {
        id: 250,
        name: 'Water Lotus',
        scientificName: 'Nelumbo nucifera',
        category: 'ornamental',
        emoji: '🪷',
        description: 'Sacred aquatic flower'
    },

    // Berries
    {
        id: 251,
        name: 'Blueberry',
        scientificName: 'Vaccinium corymbosum',
        category: 'fruits',
        emoji: '🫐',
        description: 'Antioxidant-rich berry'
    },
    {
        id: 252,
        name: 'Blackberry',
        scientificName: 'Rubus fruticosus',
        category: 'fruits',
        emoji: '🖤',
        description: 'Wild bramble berry'
    },
    {
        id: 253,
        name: 'Raspberry',
        scientificName: 'Rubus idaeus',
        category: 'fruits',
        emoji: '❤️',
        description: 'Sweet red berry'
    },
    {
        id: 254,
        name: 'Mulberry',
        scientificName: 'Morus alba',
        category: 'fruits',
        emoji: '🫐',
        description: 'Silkworm food berry'
    },
    {
        id: 255,
        name: 'Goji Berry',
        scientificName: 'Lycium barbarum',
        category: 'fruits',
        emoji: '🔸',
        description: 'Superfood berry'
    },

    // Citrus
    {
        id: 256,
        name: 'Kumquat',
        scientificName: 'Citrus japonica',
        category: 'fruits',
        emoji: '🟠',
        description: 'Tiny citrus fruit'
    },
    {
        id: 257,
        name: 'Key Lime',
        scientificName: 'Citrus × aurantiifolia',
        category: 'fruits',
        emoji: '🟢',
        description: 'Small tart lime'
    },
    {
        id: 258,
        name: 'Buddha\'s Hand',
        scientificName: 'Citrus medica var. sarcodactylis',
        category: 'fruits',
        emoji: '🖐️',
        description: 'Fingered citron'
    },
    {
        id: 259,
        name: 'Yuzu',
        scientificName: 'Citrus junos',
        category: 'fruits',
        emoji: '🌕',
        description: 'Japanese citrus'
    },
    {
        id: 260,
        name: 'Calamansi',
        scientificName: 'Citrofortunella microcarpa',
        category: 'fruits',
        emoji: '🟡',
        description: 'Philippine lime'
    },

    // Nuts & Seeds
    {
        id: 261,
        name: 'Macadamia',
        scientificName: 'Macadamia integrifolia',
        category: 'commercial',
        emoji: '⚪',
        description: 'Premium tree nut'
    },
    {
        id: 262,
        name: 'Pistachio',
        scientificName: 'Pistacia vera',
        category: 'commercial',
        emoji: '🥜',
        description: 'Green tree nut'
    },
    {
        id: 263,
        name: 'Brazil Nut',
        scientificName: 'Bertholletia excelsa',
        category: 'commercial',
        emoji: '🌰',
        description: 'Amazon rainforest nut'
    },
    {
        id: 264,
        name: 'Kola Nut',
        scientificName: 'Cola acuminata',
        category: 'commercial',
        emoji: '🥤',
        description: 'Caffeine-rich nut'
    },
    {
        id: 265,
        name: 'Pine Nut',
        scientificName: 'Pinus edulis',
        category: 'commercial',
        emoji: '🌲',
        description: 'Conifer seed'
    },

    // Exotic Vegetables
    {
        id: 266,
        name: 'Romanesco',
        scientificName: 'Brassica oleracea',
        category: 'vegetables',
        emoji: '🌀',
        description: 'Fractal broccoli'
    },
    {
        id: 267,
        name: 'Purple Yam',
        scientificName: 'Dioscorea alata',
        category: 'vegetables',
        emoji: '💜',
        description: 'Colorful tuber'
    },
    {
        id: 268,
        name: 'Kohlrabi',
        scientificName: 'Brassica oleracea var. gongylodes',
        category: 'vegetables',
        emoji: '🛸',
        description: 'Alien-looking vegetable'
    },
    {
        id: 269,
        name: 'Fiddlehead Fern',
        scientificName: 'Matteuccia struthiopteris',
        category: 'vegetables',
        emoji: '🎻',
        description: 'Curled young fern'
    },
    {
        id: 270,
        name: 'Samphire',
        scientificName: 'Salicornia europaea',
        category: 'vegetables',
        emoji: '🌊',
        description: 'Sea asparagus'
    },

    // Unique Herbs
    {
        id: 271,
        name: 'Shiso',
        scientificName: 'Perilla frutescens',
        category: 'spices',
        emoji: '🍶',
        description: 'Japanese herb'
    },
    {
        id: 272,
        name: 'Epazote',
        scientificName: 'Dysphania ambrosioides',
        category: 'spices',
        emoji: '🌿',
        description: 'Mexican herb'
    },
    {
        id: 273,
        name: 'Curry Leaf',
        scientificName: 'Murraya koenigii',
        category: 'spices',
        emoji: '🍛',
        description: 'Indian aromatic leaf'
    },
    {
        id: 274,
        name: 'Kaffir Lime',
        scientificName: 'Citrus hystrix',
        category: 'spices',
        emoji: '🌿',
        description: 'Thai citrus leaf'
    },
    {
        id: 275,
        name: 'Lemon Grass',
        scientificName: 'Cymbopogon citratus',
        category: 'spices',
        emoji: '🌾',
        description: 'Citrus-scented grass'
    }
];

// Plants Database
const plants = [
    // Cereals & Millets
    {
        id: 1,
        name: 'Rice',
        scientificName: 'Oryza sativa',
        category: 'cereals',
        emoji: '🌾',
        description: 'Staple food crop'
    },
    {
      id: 2,
      name: 'Wheat',
      scientificName: 'Triticum aestivum',
      category: 'cereals',
      emoji: '🌾',
      description: 'Major cereal grain'
  },
  {
      id: 3,
      name: 'Corn/Maize',
      scientificName: 'Zea mays',
      category: 'cereals',
      emoji: '🌽',
      description: 'Versatile cereal crop'
  },
  {
      id: 4,
      name: 'Barley',
      scientificName: 'Hordeum vulgare',
      category: 'cereals',
      emoji: '🌾',
      description: 'Ancient cereal grain'
  },
  {
      id: 5,
      name: 'Sorghum',
      scientificName: 'Sorghum bicolor',
      category: 'cereals',
      emoji: '🌾',
      description: 'Drought-resistant grain'
  },

  // Pulses
  {
      id: 6,
      name: 'Black Gram',
      scientificName: 'Vigna mungo',
      category: 'pulses',
      emoji: '🫘',
      description: 'Important pulse crop'
  },
  {
      id: 7,
      name: 'Green Gram',
      scientificName: 'Vigna radiata',
      category: 'pulses',
      emoji: '🫘',
      description: 'Nutritious pulse'
  },
  {
      id: 8,
      name: 'Chickpea',
      scientificName: 'Cicer arietinum',
      category: 'pulses',
      emoji: '🫘',
      description: 'Popular legume'
  },
  {
      id: 9,
      name: 'Pigeon Pea',
      scientificName: 'Cajanus cajan',
      category: 'pulses',
      emoji: '🫘',
      description: 'Tropical grain legume'
  },

  // Vegetables
  {
      id: 10,
      name: 'Tomato',
      scientificName: 'Solanum lycopersicum',
      category: 'vegetables',
      emoji: '🍅',
      description: 'Common vegetable'
  },
  {
      id: 11,
      name: 'Potato',
      scientificName: 'Solanum tuberosum',
      category: 'vegetables',
      emoji: '🥔',
      description: 'Root vegetable'
  },
  {
      id: 12,
      name: 'Onion',
      scientificName: 'Allium cepa',
      category: 'vegetables',
      emoji: '🧅',
      description: 'Bulb vegetable'
  },
  {
      id: 13,
      name: 'Carrot',
      scientificName: 'Daucus carota',
      category: 'vegetables',
      emoji: '🥕',
      description: 'Root vegetable'
  },
  {
      id: 14,
      name: 'Cabbage',
      scientificName: 'Brassica oleracea var. capitata',
      category: 'vegetables',
      emoji: '🥬',
      description: 'Leafy vegetable'
  },
  {
      id: 15,
      name: 'Cauliflower',
      scientificName: 'Brassica oleracea var. botrytis',
      category: 'vegetables',
      emoji: '🥦',
      description: 'Cruciferous vegetable'
  },

  // Fruits
  {
      id: 16,
      name: 'Mango',
      scientificName: 'Mangifera indica',
      category: 'fruits',
      emoji: '🥭',
      description: 'Tropical fruit'
  },
  {
      id: 17,
      name: 'Banana',
      scientificName: 'Musa',
      category: 'fruits',
      emoji: '🍌',
      description: 'Tropical fruit'
  },
  {
      id: 18,
      name: 'Apple',
      scientificName: 'Malus domestica',
      category: 'fruits',
      emoji: '🍎',
      description: 'Pomaceous fruit'
  },
  {
      id: 19,
      name: 'Grapes',
      scientificName: 'Vitis vinifera',
      category: 'fruits',
      emoji: '🍇',
      description: 'Berry fruit'
  },
  {
      id: 20,
      name: 'Orange',
      scientificName: 'Citrus × sinensis',
      category: 'fruits',
      emoji: '🍊',
      description: 'Citrus fruit'
  },

  // Spices
  {
      id: 21,
      name: 'Chili',
      scientificName: 'Capsicum annuum',
      category: 'spices',
      emoji: '🌶️',
      description: 'Hot spice'
  },
  {
      id: 22,
      name: 'Turmeric',
      scientificName: 'Curcuma longa',
      category: 'spices',
      emoji: '🌱',
      description: 'Yellow spice'
  },
  {
      id: 23,
      name: 'Ginger',
      scientificName: 'Zingiber officinale',
      category: 'spices',
      emoji: '🌱',
      description: 'Root spice'
  },

  // Commercial Crops
  {
      id: 24,
      name: 'Cotton',
      scientificName: 'Gossypium',
      category: 'commercial',
      emoji: '🌿',
      description: 'Fiber crop'
  },
  {
      id: 25,
      name: 'Sugarcane',
      scientificName: 'Saccharum officinarum',
      category: 'commercial',
      emoji: '🌿',
      description: 'Sugar crop'
  },
  {
      id: 26,
      name: 'Tea',
      scientificName: 'Camellia sinensis',
      category: 'commercial',
      emoji: '🌿',
      description: 'Beverage crop'
  },
  {
      id: 27,
      name: 'Coffee',
      scientificName: 'Coffea',
      category: 'commercial',
      emoji: '☕',
      description: 'Beverage crop'
  },
  {
      id: 28,
      name: 'Coconut',
      scientificName: 'Cocos nucifera',
      category: 'commercial',
      emoji: '🥥',
      description: 'Multi-use palm'
  },

  // Additional Vegetables
  {
      id: 29,
      name: 'Brinjal/Eggplant',
      scientificName: 'Solanum melongena',
      category: 'vegetables',
      emoji: '🍆',
      description: 'Fruit vegetable'
  },
  {
      id: 30,
      name: 'Okra/Lady Finger',
      scientificName: 'Abelmoschus esculentus',
      category: 'vegetables',
      emoji: '🌿',
      description: 'Pod vegetable'
  },

  // Additional Cereals & Millets
  {
      id: 31,
      name: 'Pearl Millet',
      scientificName: 'Pennisetum glaucum',
      category: 'cereals',
      emoji: '🌾',
      description: 'Drought-tolerant cereal'
  },
  {
      id: 32,
      name: 'Finger Millet',
      scientificName: 'Eleusine coracana',
      category: 'cereals',
      emoji: '🌾',
      description: 'Nutritious millet grain'
  },
  {
      id: 33,
      name: 'Oats',
      scientificName: 'Avena sativa',
      category: 'cereals',
      emoji: '🌾',
      description: 'Healthy breakfast grain'
  },
  {
      id: 34,
      name: 'Quinoa',
      scientificName: 'Chenopodium quinoa',
      category: 'cereals',
      emoji: '🌾',
      description: 'Protein-rich pseudocereal'
  },

  // Additional Pulses
  {
      id: 35,
      name: 'Red Lentils',
      scientificName: 'Lens culinaris',
      category: 'pulses',
      emoji: '🫘',
      description: 'Quick-cooking lentils'
  },
  {
      id: 36,
      name: 'Kidney Beans',
      scientificName: 'Phaseolus vulgaris',
      category: 'pulses',
      emoji: '🫘',
      description: 'Red kidney beans'
  },
  {
      id: 37,
      name: 'Navy Beans',
      scientificName: 'Phaseolus vulgaris',
      category: 'pulses',
      emoji: '🫘',
      description: 'White beans'
  },
  {
      id: 38,
      name: 'Pinto Beans',
      scientificName: 'Phaseolus vulgaris',
      category: 'pulses',
      emoji: '🫘',
      description: 'Speckled beans'
  },

  // Additional Vegetables
  {
      id: 39,
      name: 'Spinach',
      scientificName: 'Spinacia oleracea',
      category: 'vegetables',
      emoji: '🥬',
      description: 'Nutrient-rich leafy green'
  },
  {
      id: 40,
      name: 'Bell Pepper',
      scientificName: 'Capsicum annuum',
      category: 'vegetables',
      emoji: '🫑',
      description: 'Sweet pepper variety'
  },
  {
      id: 41,
      name: 'Cucumber',
      scientificName: 'Cucumis sativus',
      category: 'vegetables',
      emoji: '🥒',
      description: 'Refreshing gourd'
  },
  {
      id: 42,
      name: 'Lettuce',
      scientificName: 'Lactuca sativa',
      category: 'vegetables',
      emoji: '🥬',
      description: 'Salad green'
  },
  {
      id: 43,
      name: 'Radish',
      scientificName: 'Raphanus sativus',
      category: 'vegetables',
      emoji: '🥬',
      description: 'Root vegetable'
  },
  {
      id: 44,
      name: 'Beetroot',
      scientificName: 'Beta vulgaris',
      category: 'vegetables',
      emoji: '🥬',
      description: 'Purple root vegetable'
  },

  // Additional Fruits
  {
      id: 45,
      name: 'Pineapple',
      scientificName: 'Ananas comosus',
      category: 'fruits',
      emoji: '🍍',
      description: 'Tropical fruit'
  },
  {
      id: 46,
      name: 'Watermelon',
      scientificName: 'Citrullus lanatus',
      category: 'fruits',
      emoji: '🍉',
      description: 'Summer fruit'
  },
  {
      id: 47,
      name: 'Strawberry',
      scientificName: 'Fragaria × ananassa',
      category: 'fruits',
      emoji: '🍓',
      description: 'Berry fruit'
  },
  {
      id: 48,
      name: 'Peach',
      scientificName: 'Prunus persica',
      category: 'fruits',
      emoji: '🍑',
      description: 'Stone fruit'
  },
  {
      id: 49,
      name: 'Lemon',
      scientificName: 'Citrus limon',
      category: 'fruits',
      emoji: '🍋',
      description: 'Citrus fruit'
  },
  {
      id: 50,
      name: 'Pear',
      scientificName: 'Pyrus',
      category: 'fruits',
      emoji: '🍐',
      description: 'Pomaceous fruit'
  },

  // Additional Spices
  {
      id: 51,
      name: 'Cardamom',
      scientificName: 'Elettaria cardamomum',
      category: 'spices',
      emoji: '🌱',
      description: 'Aromatic spice'
  },
  {
      id: 52,
      name: 'Cinnamon',
      scientificName: 'Cinnamomum verum',
      category: 'spices',
      emoji: '🌱',
      description: 'Bark spice'
  },
  {
      id: 53,
      name: 'Black Pepper',
      scientificName: 'Piper nigrum',
      category: 'spices',
      emoji: '🌱',
      description: 'King of spices'
  },
  {
      id: 54,
      name: 'Clove',
      scientificName: 'Syzygium aromaticum',
      category: 'spices',
      emoji: '🌱',
      description: 'Aromatic flower bud'
  },

  // Additional Commercial Crops
  {
      id: 55,
      name: 'Rubber',
      scientificName: 'Hevea brasiliensis',
      category: 'commercial',
      emoji: '🌳',
      description: 'Latex producing tree'
  },
  {
      id: 56,
      name: 'Jute',
      scientificName: 'Corchorus capsularis',
      category: 'commercial',
      emoji: '🌿',
      description: 'Fiber crop'
  },
  {
      id: 57,
      name: 'Tobacco',
      scientificName: 'Nicotiana tabacum',
      category: 'commercial',
      emoji: '🌿',
      description: 'Commercial leaf crop'
  },
  {
      id: 58,
      name: 'Oil Palm',
      scientificName: 'Elaeis guineensis',
      category: 'commercial',
      emoji: '🌴',
      description: 'Vegetable oil crop'
  },
  {
      id: 59,
      name: 'Cocoa',
      scientificName: 'Theobroma cacao',
      category: 'commercial',
      emoji: '🌿',
      description: 'Chocolate source'
  },
  {
      id: 60,
      name: 'Vanilla',
      scientificName: 'Vanilla planifolia',
      category: 'commercial',
      emoji: '🌿',
      description: 'Flavoring orchid'
  },

  // More Vegetables
  {
      id: 61,
      name: 'Asparagus',
      scientificName: 'Asparagus officinalis',
      category: 'vegetables',
      emoji: '🥬',
      description: 'Spring vegetable'
  },
  {
      id: 62,
      name: 'Brussels Sprouts',
      scientificName: 'Brassica oleracea var. gemmifera',
      category: 'vegetables',
      emoji: '🥬',
      description: 'Miniature cabbage'
  },
  {
      id: 63,
      name: 'Artichoke',
      scientificName: 'Cynara cardunculus var. scolymus',
      category: 'vegetables',
      emoji: '🌿',
      description: 'Edible flower buds'
  },

  // More Fruits
  {
      id: 64,
      name: 'Dragon Fruit',
      scientificName: 'Hylocereus undatus',
      category: 'fruits',
      emoji: '🍈',
      description: 'Exotic cactus fruit'
  },
  {
      id: 65,
      name: 'Passion Fruit',
      scientificName: 'Passiflora edulis',
      category: 'fruits',
      emoji: '🍎',
      description: 'Tropical vine fruit'
  },
  {
      id: 66,
      name: 'Lychee',
      scientificName: 'Litchi chinensis',
      category: 'fruits',
      emoji: '🍒',
      description: 'Sweet tropical fruit'
  },

  // More Spices
  {
      id: 67,
      name: 'Star Anise',
      scientificName: 'Illicium verum',
      category: 'spices',
      emoji: '⭐',
      description: 'Star-shaped spice'
  },
  {
      id: 68,
      name: 'Bay Leaf',
      scientificName: 'Laurus nobilis',
      category: 'spices',
      emoji: '🌿',
      description: 'Aromatic leaf'
  },

  // More Commercial
  {
      id: 69,
      name: 'Hemp',
      scientificName: 'Cannabis sativa',
      category: 'commercial',
      emoji: '🌿',
      description: 'Industrial fiber crop'
  },
  {
      id: 70,
      name: 'Bamboo',
      scientificName: 'Bambusoideae',
      category: 'commercial',
      emoji: '🎋',
      description: 'Fast-growing grass'
  },

  // Others Category - Ornamental Plants
  {
      id: 71,
      name: 'Orchid',
      scientificName: 'Orchidaceae',
      category: 'ornamental',
      emoji: '🌺',
      description: 'Ornamental flower'
  },
  {
      id: 72,
      name: 'Rose',
      scientificName: 'Rosa',
      category: 'ornamental',
      emoji: '🌹',
      description: 'Garden flower'
  },
  {
      id: 73,
      name: 'Tulip',
      scientificName: 'Tulipa',
      category: 'ornamental',
      emoji: '🌷',
      description: 'Spring bulb flower'
  },
  {
      id: 74,
      name: 'Sunflower',
      scientificName: 'Helianthus annuus',
      category: 'ornamental',
      emoji: '🌻',
      description: 'Large flower head'
  },

  // Others - Medicinal Plants
  {
      id: 75,
      name: 'Aloe Vera',
      scientificName: 'Aloe barbadensis miller',
      category: 'medicinal',
      emoji: '🌿',
      description: 'Medicinal succulent'
  },
  {
      id: 76,
      name: 'Mint',
      scientificName: 'Mentha',
      category: 'medicinal',
      emoji: '🌿',
      description: 'Aromatic herb'
  },
  {
      id: 77,
      name: 'Lavender',
      scientificName: 'Lavandula',
      category: 'medicinal',
      emoji: '💜',
      description: 'Fragrant herb'
  },
  {
      id: 78,
      name: 'Chamomile',
      scientificName: 'Matricaria chamomilla',
      category: 'medicinal',
      emoji: '🌼',
      description: 'Herbal tea plant'
  },

  // Others - Indoor Plants
  {
      id: 79,
      name: 'Snake Plant',
      scientificName: 'Dracaena trifasciata',
      category: 'medicinal',
      emoji: '🌿',
      description: 'Air-purifying plant'
  },
  {
      id: 80,
      name: 'Peace Lily',
      scientificName: 'Spathiphyllum',
      category: 'medicinal',
      emoji: '🌿',
      description: 'Indoor flowering plant'
  },
  {
      id: 81,
      name: 'Spider Plant',
      scientificName: 'Chlorophytum comosum',
      category: 'medicinal',
      emoji: '🌿',
      description: 'Hanging house plant'
  },

  // Others - Aquatic Plants
  {
      id: 82,
      name: 'Lotus',
      scientificName: 'Nelumbo nucifera',
      category: 'medicinal',
      emoji: '🪷',
      description: 'Sacred aquatic flower'
  },
  {
      id: 83,
      name: 'Water Lily',
      scientificName: 'Nymphaea',
      category: 'medicinal',
      emoji: '🌺',
      description: 'Floating aquatic plant'
  },

  // Others - Succulents
  {
      id: 84,
      name: 'Jade Plant',
      scientificName: 'Crassula ovata',
      category: 'medicinal',
      emoji: '🪴',
      description: 'Money plant succulent'
  },
  {
      id: 85,
      name: 'Barrel Cactus',
      scientificName: 'Ferocactus',
      category: 'medicinal',
      emoji: '🌵',
      description: 'Round desert plant'
  },

  // Others - Climbers
  {
      id: 86,
      name: 'Morning Glory',
      scientificName: 'Ipomoea',
      category: 'medicinal',
      emoji: '🌸',
      description: 'Climbing vine'
  },
  {
      id: 87,
      name: 'Wisteria',
      scientificName: 'Wisteria',
      category: 'medicinal',
      emoji: '🌸',
      description: 'Ornamental vine'
  },
  {
      id: 88,
      name: 'English Ivy',
      scientificName: 'Hedera helix',
      category: 'medicinal',
      emoji: '🌿',
      description: 'Climbing evergreen'
  },
  {
      id: 89,
      name: 'Jasmine',
      scientificName: 'Jasminum',
      category: 'medicinal',
      emoji: '⚪',
      description: 'Fragrant climber'
  },
  {
      id: 90,
      name: 'Bougainvillea',
      scientificName: 'Bougainvillea',
      category: 'medicinal',
      emoji: '🌺',
      description: 'Ornamental climber'
  },
    ...treesData,
    ...additionalPlants,
    ...morePlants
];

// React Component
const PlantIdentifier = () => {
    const { addToHistory } = useContext(HistoryContext);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [image, setImage] = useState(null);
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState('');
    const videoRef = useRef(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const speechSynthesisRef = useRef(null);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            setError('Image size too large. Please upload an image smaller than 4MB.');
            return;
        }

        setError('');
        setResult('');
        setLoading(true);

        try {
            setImage(URL.createObjectURL(file));
            
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];
                await analyzePlantImage(base64data, file.type);
            };
            reader.onerror = () => {
                setError('Failed to read image file. Please try again.');
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Upload error:', error);
            setError('Failed to upload image. Please try again.');
            setLoading(false);
        }
    };

    const startCamera = async () => {
        try {
            // Check if it's a mobile device
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            const constraints = {
                video: isMobile 
                    ? { 
                        facingMode: { exact: "environment" }  // Use back camera on mobile
                      }
                    : true  // Use default (front) camera on desktop
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(mediaStream);
            setShowCamera(true);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (error) {
            console.error('Camera error:', error);
            // If environment camera fails, fall back to any available camera
            if (error.name === 'OverconstrainedError') {
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                        video: true 
                    });
                    setStream(mediaStream);
                    setShowCamera(true);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (fallbackError) {
                    console.error('Fallback camera error:', fallbackError);
                    setError('Unable to access camera. Please make sure you have granted permission.');
                }
            } else {
                setError('Unable to access camera. Please make sure you have granted permission.');
            }
        }
    };

    const capturePhoto = async () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0);
            
            try {
                const dataUrl = canvas.toDataURL('image/jpeg');
                const base64data = dataUrl.split(',')[1];
                setImage(dataUrl);
                await analyzePlantImage(base64data, 'image/jpeg');
                stopCamera();
            } catch (error) {
                console.error('Capture error:', error);
                setError('Failed to capture photo. Please try again.');
            }
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const analyzePlantImage = async (base64Image, mimeType) => {
        try {
            setLoading(true);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Analyze this ${selectedPlant?.name || 'plant'} image and provide the following information:
                1. Verify if this is a ${selectedPlant?.name || 'plant'}.
                2. If it matches ${selectedPlant?.name || 'the plant'}:
                   - Provide plant health analysis
                   - Identify any diseases
                   - Suggest treatments if needed
                   - Give growth stage
                3. If it doesn't match ${selectedPlant?.name || 'the expected plant'}:
                   - Explain why it's different
                   - Identify what plant it might be instead`;

            const result = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType || 'image/jpeg',
                                data: base64Image
                            }
                        }
                    ]
                }]
            });

            const response = await result.response;
            const analysisText = response.text();
            setResult(analysisText);

            // Add to history after successful analysis
            addToHistory({
                image: base64Image,
                result: analysisText,
                translatedContent: {
                    qaFormat: parseAnalysisToQA(analysisText)
                },
                timestamp: new Date().toISOString()
            });

            setError('');
        } catch (error) {
            console.error("Analysis error:", error);
            setError("Failed to analyze image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Helper function to parse analysis text into Q&A format
    const parseAnalysisToQA = (text) => {
        const sections = text.split('\n\n').filter(Boolean);
        return sections.map(section => {
            const [title, ...content] = section.split('\n');
            return {
                question: title.trim(),
                answer: content.filter(line => line.trim()).map(line => line.trim())
            };
        });
    };

    const handlePlantSelection = (categoryId) => {
        if (categoryId === 'others') {
            // Directly show camera/upload options without selecting a specific plant
            setSelectedPlant({ 
                id: 'unknown', 
                name: 'Unknown Plant', 
                category: 'others',
                emoji: '🔍'
            });
        } else {
            // Existing plant selection logic
            setSelectedPlant(prev => {
                if (prev && prev.id === categoryId) {
                    return null;
                }
                const plant = plants.find(p => p.id === categoryId);
                return plant;
            });
        }
    };

    const filteredPlants = plants.filter(plant => {
        const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || plant.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleReadAloud = () => {
        if (!result) return;

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(result);
        utterance.rate = 0.9; // Slightly slower for better clarity
        utterance.pitch = 1;
        
        utterance.onend = () => {
            setIsSpeaking(false);
        };

        speechSynthesisRef.current = utterance;
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    useEffect(() => {
        return () => {
            if (isSpeaking) {
                window.speechSynthesis.cancel();
            }
        };
    }, [isSpeaking]);

    // Add new paste handler
    const handlePaste = async (event) => {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        let blob = null;

        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                blob = item.getAsFile();
                break;
            }
        }

        if (!blob) {
            setError('No image found in clipboard. Please copy an image first.');
            return;
        }

        if (blob.size > 4 * 1024 * 1024) {
            setError('Image size too large. Please use an image smaller than 4MB.');
            return;
        }

        setError('');
        setResult('');
        setLoading(true);

        try {
            setImage(URL.createObjectURL(blob));
            
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];
                await analyzePlantImage(base64data, blob.type);
            };
            reader.onerror = () => {
                setError('Failed to read image from clipboard. Please try again.');
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            console.error('Paste error:', error);
            setError('Failed to process pasted image. Please try again.');
            setLoading(false);
        }
    };

    // Add paste event listener
    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('paste', handlePaste);
        };
    }, []);

    return (
        <div className="plant-identifier-container">
            <div className="translate-widget-container">
                <div id="google_translate_element"></div>
            </div>

            <header className="header">
                <h1>Plant Identifier</h1>
                <p>Select a plant or choose 'Unknown Plant' for identification</p>
            </header>

            {(!selectedPlant || selectedPlant.category !== 'others') && (
                <div className="search-section">
                    <input
                        type="text"
                        placeholder="🔍 Search plants..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            )}

            <div className="categories-section">
                {categories.map(category => (
                    <div
                        key={category.id}
                        className={`category-tile ${
                            selectedCategory === category.id ? 'active' : ''
                        } ${
                            category.id === 'others' ? 'others-category' : ''
                        }`}
                        onClick={() => {
                            setSelectedCategory(category.id);
                            if (category.id === 'others') {
                                handlePlantSelection('others');
                            }
                        }}
                    >
                        <span className="category-emoji">{category.emoji}</span>
                        <span className="category-name">{category.name}</span>
                    </div>
                ))}
            </div>

            {(!selectedPlant || selectedPlant.category !== 'others') && (
                <div className="plants-section">
                    {filteredPlants.map(plant => (
                        <div
                            key={plant.id}
                            className={`plant-tile ${
                                selectedPlant && selectedPlant.id === plant.id ? 'selected' : ''
                            } ${
                                selectedPlant && selectedPlant.id !== plant.id ? 'disabled' : ''
                            }`}
                            onClick={() => handlePlantSelection(plant.id)}
                        >
                            <span className="plant-emoji">{plant.emoji}</span>
                            <span className="plant-name">{plant.name}</span>
                        </div>
                    ))}
                </div>
            )}

            {selectedPlant && (
                <div className="analysis-modal">
                    <div className="modal-content">
                        <h2>
                            {selectedPlant.category === 'others' 
                                ? 'Plant Identification' 
                                : `${selectedPlant.name} Analysis`}
                        </h2>
                        
                        {selectedPlant.category === 'others' ? (
                            <p className="identification-prompt">
                                Please upload or take a photo of the plant you'd like to identify
                            </p>
                        ) : null}
                        
                        <div className="upload-options">
                            <label className="upload-button">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    hidden
                                />
                                📁 Upload Image
                            </label>
                            <button 
                                className="camera-button"
                                onClick={startCamera}
                            >
                                📸 Take Photo
                            </button>
                            <button 
                                className="paste-button"
                                onClick={() => {
                                    setError('Press Ctrl+V or Cmd+V to paste an image');
                                    setTimeout(() => setError(''), 3000);
                                }}
                            >
                                📋 Paste Image
                            </button>
                        </div>

                        {showCamera && (
                            <div className="camera-container">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="camera-preview"
                                />
                                <div className="camera-controls">
                                    <button onClick={capturePhoto}>📸 Capture</button>
                                    <button onClick={stopCamera}>❌ Cancel</button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                <span className="error-icon">⚠️</span>
                                <div className="error-content">
                                    <strong>Error:</strong> {error}
                                    <p className="error-hint">
                                        {error.includes('Failed to analyze') 
                                            ? 'Make sure the image is clear and try again.' 
                                            : 'Please try uploading a different image.'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {image && (
                            <div className="image-preview">
                                <img src={image} alt="Plant" />
                            </div>
                        )}

                        {loading && (
                            <div className="loading-spinner">
                                <div className="spinner"></div>
                                <p>
                                    {selectedPlant.category === 'others' 
                                        ? 'Identifying plant...' 
                                        : 'Analyzing image...'}
                                </p>
                            </div>
                        )}

                        {result && (
                            <div className="analysis-result">
                                <div className="result-header">
                                    <button 
                                        className={`read-aloud-button ${isSpeaking ? 'speaking' : ''}`}
                                        onClick={handleReadAloud}
                                        aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
                                    >
                                        <span className="read-aloud-icon">
                                            {isSpeaking ? '🔊' : '🔈'}
                                        </span>
                                        {isSpeaking ? 'Stop Reading' : 'Read Aloud'}
                                    </button>
                                </div>
                                <pre>{result}</pre>
                            </div>
                        )}

                        <button 
                            className="close-button"
                            onClick={() => {
                                setSelectedPlant(null);
                                setImage(null);
                                setResult('');
                                setError('');
                                stopCamera();
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlantIdentifier;
