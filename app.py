from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import os
import pandas as pd
import numpy as np
from datetime import datetime
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import plotly.graph_objs as go
import plotly.utils
from wordcloud import WordCloud
import matplotlib.pyplot as plt
import io
import base64

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

app = Flask(__name__)
CORS(app)

# Initialize sentiment analyzers
vader_analyzer = SentimentIntensityAnalyzer()

class SentimentAnalyzer:
    def __init__(self):
        self.vader_analyzer = SentimentIntensityAnalyzer()
    
    def analyze_textblob(self, text):
        """Analyze sentiment using TextBlob"""
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        if polarity > 0.1:
            sentiment = 'positive'
        elif polarity < -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return {
            'sentiment': sentiment,
            'polarity': polarity,
            'subjectivity': subjectivity,
            'confidence': abs(polarity)
        }
    
    def analyze_vader(self, text):
        """Analyze sentiment using VADER"""
        scores = self.vader_analyzer.polarity_scores(text)
        
        if scores['compound'] >= 0.05:
            sentiment = 'positive'
        elif scores['compound'] <= -0.05:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return {
            'sentiment': sentiment,
            'compound': scores['compound'],
            'positive': scores['pos'],
            'negative': scores['neg'],
            'neutral': scores['neu'],
            'confidence': abs(scores['compound'])
        }
    
    def analyze_custom(self, text):
        """Custom sentiment analysis using a combination of approaches"""
        # Preprocess text
        tokens = word_tokenize(text.lower())
        stop_words = set(stopwords.words('english'))
        tokens = [word for word in tokens if word.isalnum() and word not in stop_words]
        
        # Simple keyword-based analysis
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'happy', 'joy']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed']
        
        positive_count = sum(1 for word in tokens if word in positive_words)
        negative_count = sum(1 for word in tokens if word in negative_words)
        
        total_words = len(tokens) if len(tokens) > 0 else 1
        sentiment_score = (positive_count - negative_count) / total_words
        
        if sentiment_score > 0.1:
            sentiment = 'positive'
        elif sentiment_score < -0.1:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
            
        return {
            'sentiment': sentiment,
            'score': sentiment_score,
            'positive_words': positive_count,
            'negative_words': negative_count,
            'total_words': total_words,
            'confidence': abs(sentiment_score)
        }

analyzer = SentimentAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_sentiment():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text.strip():
            return jsonify({'error': 'Text is required'}), 400
        
        # Perform analysis with all three methods
        textblob_result = analyzer.analyze_textblob(text)
        vader_result = analyzer.analyze_vader(text)
        custom_result = analyzer.analyze_custom(text)
        
        # Calculate overall sentiment (majority vote)
        sentiments = [textblob_result['sentiment'], vader_result['sentiment'], custom_result['sentiment']]
        overall_sentiment = max(set(sentiments), key=sentiments.count)
        
        # Calculate average confidence
        avg_confidence = (textblob_result['confidence'] + vader_result['confidence'] + custom_result['confidence']) / 3
        
        result = {
            'text': text,
            'overall_sentiment': overall_sentiment,
            'overall_confidence': avg_confidence,
            'textblob': textblob_result,
            'vader': vader_result,
            'custom': custom_result,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze-batch', methods=['POST'])
def analyze_batch():
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        
        if not texts:
            return jsonify({'error': 'Texts array is required'}), 400
        
        results = []
        for text in texts:
            if text.strip():
                textblob_result = analyzer.analyze_textblob(text)
                vader_result = analyzer.analyze_vader(text)
                custom_result = analyzer.analyze_custom(text)
                
                sentiments = [textblob_result['sentiment'], vader_result['sentiment'], custom_result['sentiment']]
                overall_sentiment = max(set(sentiments), key=sentiments.count)
                avg_confidence = (textblob_result['confidence'] + vader_result['confidence'] + custom_result['confidence']) / 3
                
                results.append({
                    'text': text,
                    'overall_sentiment': overall_sentiment,
                    'overall_confidence': avg_confidence,
                    'textblob': textblob_result,
                    'vader': vader_result,
                    'custom': custom_result
                })
        
        return jsonify({'results': results})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-csv', methods=['POST'])
def upload_csv():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Please upload a CSV file'}), 400
        
        # Read CSV file
        df = pd.read_csv(file)
        
        # Assume the first column contains the text
        text_column = df.columns[0]
        texts = df[text_column].dropna().tolist()
        
        # Analyze all texts
        results = []
        for text in texts:
            if isinstance(text, str) and text.strip():
                textblob_result = analyzer.analyze_textblob(text)
                vader_result = analyzer.analyze_vader(text)
                custom_result = analyzer.analyze_custom(text)
                
                sentiments = [textblob_result['sentiment'], vader_result['sentiment'], custom_result['sentiment']]
                overall_sentiment = max(set(sentiments), key=sentiments.count)
                avg_confidence = (textblob_result['confidence'] + vader_result['confidence'] + custom_result['confidence']) / 3
                
                results.append({
                    'text': text,
                    'overall_sentiment': overall_sentiment,
                    'overall_confidence': avg_confidence,
                    'textblob': textblob_result,
                    'vader': vader_result,
                    'custom': custom_result
                })
        
        # Create summary statistics
        sentiment_counts = {}
        for result in results:
            sentiment = result['overall_sentiment']
            sentiment_counts[sentiment] = sentiment_counts.get(sentiment, 0) + 1
        
        summary = {
            'total_texts': len(results),
            'sentiment_distribution': sentiment_counts,
            'average_confidence': np.mean([r['overall_confidence'] for r in results])
        }
        
        return jsonify({
            'results': results,
            'summary': summary
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wordcloud', methods=['POST'])
def generate_wordcloud():
    try:
        data = request.get_json()
        texts = data.get('texts', [])
        
        if not texts:
            return jsonify({'error': 'Texts are required'}), 400
        
        # Combine all texts
        combined_text = ' '.join(texts)
        
        # Generate wordcloud
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(combined_text)
        
        # Convert to base64
        img_buffer = io.BytesIO()
        plt.figure(figsize=(10, 5))
        plt.imshow(wordcloud, interpolation='bilinear')
        plt.axis('off')
        plt.savefig(img_buffer, format='png', bbox_inches='tight', pad_inches=0)
        plt.close()
        
        img_buffer.seek(0)
        img_str = base64.b64encode(img_buffer.getvalue()).decode()
        
        return jsonify({'wordcloud': img_str})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get API usage statistics"""
    return jsonify({
        'status': 'running',
        'version': '1.0.0',
        'models': ['TextBlob', 'VADER', 'Custom'],
        'endpoints': [
            '/api/analyze',
            '/api/analyze-batch', 
            '/api/upload-csv',
            '/api/wordcloud',
            '/api/stats'
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 