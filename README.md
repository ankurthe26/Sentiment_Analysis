# 🧠 AI Sentiment Analysis Dashboard

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Advanced AI-powered sentiment analysis platform with multiple models and a stunning modern interface.**

## 🌟 Features

### 🤖 **AI Models**
- **TextBlob**: Rule-based sentiment analysis with polarity scoring
- **VADER**: Social media optimized sentiment analysis
- **Custom AI**: Keyword-based analysis with NLTK preprocessing

### 🎨 **Modern Interface**
- **Dark Mode Design**: Sophisticated glass morphism interface
- **Real-time Analytics**: Interactive charts and visualizations
- **Responsive Design**: Works perfectly on all devices
- **Advanced Animations**: Smooth transitions and micro-interactions

### 📊 **Analysis Capabilities**
- **Single Text Analysis**: Detailed sentiment insights
- **Batch Processing**: Analyze multiple texts simultaneously
- **CSV Upload**: Process large datasets with drag & drop
- **Word Cloud Generation**: Visual text analysis

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip (Python package installer)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sentiment-analysis.git
   cd sentiment-analysis
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python3 app.py
   ```

4. **Open in browser**
   Navigate to `http://localhost:5001`

## 📁 Project Structure

```
sentiment-analysis/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # Project documentation
├── LICENSE               # MIT License
├── .gitignore           # Git ignore rules
├── templates/
│   └── index.html       # Main dashboard template
└── static/
    ├── css/
    │   └── style.css    # Main stylesheet
    └── js/
        └── app.js       # Frontend JavaScript
```

## 🔧 API Endpoints

### Single Text Analysis
```http
POST /api/analyze
Content-Type: application/json

{
    "text": "I love this product!"
}
```

### Batch Analysis
```http
POST /api/analyze-batch
Content-Type: application/json

{
    "texts": ["Text 1", "Text 2", "Text 3"]
}
```

### CSV Upload
```http
POST /api/upload-csv
Content-Type: multipart/form-data

file: your_file.csv
```

### Word Cloud Generation
```http
POST /api/wordcloud
Content-Type: application/json

{
    "texts": ["Text 1", "Text 2", "Text 3"]
}
```

### API Statistics
```http
GET /api/stats
```

## 🧠 Sentiment Analysis Models

### 1. TextBlob
- **Type**: Rule-based sentiment analysis
- **Output**: Polarity (-1 to 1) and subjectivity (0 to 1)
- **Best for**: General text sentiment analysis

### 2. VADER (Valence Aware Dictionary and sEntiment Reasoner)
- **Type**: Lexicon and rule-based sentiment analysis
- **Output**: Compound score (-1 to 1), positive/negative/neutral ratios
- **Best for**: Social media text and informal language

### 3. Custom Model
- **Type**: Keyword-based analysis with NLTK preprocessing
- **Output**: Custom sentiment score and word counts
- **Best for**: Domain-specific analysis

## 📊 Usage Examples

### Single Text Analysis
1. Navigate to the "Single Text" tab
2. Enter your text in the textarea
3. Click "Analyze Sentiment"
4. View detailed results from all three models

### Batch Analysis
1. Go to the "Batch Analysis" tab
2. Enter multiple texts (one per line)
3. Click "Analyze Batch"
4. Review results for all texts

### CSV Upload
1. Select the "CSV Upload" tab
2. Drag and drop or choose a CSV file
3. The first column should contain your text data
4. View comprehensive analysis results

### Analytics
1. Click on the "Analytics" tab
2. View sentiment distribution charts
3. Generate word clouds from analyzed texts

## 🎨 Customization

### Styling
- Modify `static/css/style.css` to customize the appearance
- Update color schemes, fonts, and layout
- Add custom animations and transitions

### Functionality
- Extend `app.py` with additional sentiment analysis models
- Add new API endpoints for specific use cases
- Implement data export features

### Models
- Add new sentiment analysis libraries to `requirements.txt`
- Implement custom analysis logic in the `SentimentAnalyzer` class
- Fine-tune existing models for your specific domain

## 🔍 Technical Details

### Backend (Flask)
- **Framework**: Flask 2.3.3
- **CORS**: Enabled for cross-origin requests
- **Error Handling**: Comprehensive error handling and validation
- **File Processing**: Pandas for CSV data processing

### Frontend (JavaScript)
- **Vanilla JavaScript**: No framework dependencies
- **Bootstrap 5**: Modern UI components
- **Plotly.js**: Interactive charts and visualizations
- **Font Awesome**: Beautiful icons

### Dependencies
- **NLTK**: Natural language processing
- **TextBlob**: Text processing and sentiment analysis
- **VADER**: Social media sentiment analysis
- **Pandas**: Data manipulation
- **Matplotlib/WordCloud**: Visualization
- **Plotly**: Interactive charts

## 🚀 Deployment

### Local Development
```bash
python3 app.py
```

### Production Deployment
```bash
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **TextBlob**: For rule-based sentiment analysis
- **VADER**: For social media sentiment analysis
- **NLTK**: For natural language processing
- **Bootstrap**: For the UI framework
- **Plotly**: For interactive visualizations

## 📞 Support

For questions, issues, or feature requests:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ using Flask and modern web technologies**
