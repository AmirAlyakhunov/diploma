from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import CLIPProcessor, CLIPModel
from deep_translator import GoogleTranslator
import torch
import numpy as np
from PIL import Image
import io

app = Flask(__name__)
CORS(app)

# Инициализация переводчика
translator = GoogleTranslator(source='auto', target='en')

# Загрузка модели CLIP при старте
MODEL_NAME = "openai/clip-vit-base-patch32"

print("Loading CLIP model...")
model = CLIPModel.from_pretrained(MODEL_NAME)
processor = CLIPProcessor.from_pretrained(MODEL_NAME)
model.eval()
print("CLIP model loaded successfully")


@app.route('/embed/text', methods=['POST'])
def embed_text():
    """Превращает текст в вектор 512-dim"""
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    # Перевод текста на английский для лучшей работы с CLIP
    try:
        translated = translator.translate(text)
        print(f"Original: {text} -> Translated: {translated}")
    except Exception as e:
        print(f"Translation error: {e}, using original text")
        translated = text
    
    # Токенизация и получение эмбеддинга
    inputs = processor(text=[translated], return_tensors="pt", padding=True)
    
    with torch.no_grad():
        text_features = model.get_text_features(**inputs)
        # Извлекаем тензор из BaseModelOutputWithPooling
        if hasattr(text_features, 'pooler_output'):
            text_features = text_features.pooler_output
        elif hasattr(text_features, 'last_hidden_state'):
            text_features = text_features.last_hidden_state[:, 0]
        # Нормализация вектора
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)
    
    embedding = text_features.numpy()[0].tolist()
    
    return jsonify({'embedding': embedding})


@app.route('/embed/image', methods=['POST'])
def embed_image():
    """Превращает изображение в вектор 512-dim"""
    if 'image' not in request.files:
        return jsonify({'error': 'Image file is required'}), 400
    
    image_file = request.files['image']
    
    try:
        # Открываем изображение
        image = Image.open(image_file.stream).convert('RGB')
        
        # Обработка изображения
        inputs = processor(images=image, return_tensors="pt")
        
        with torch.no_grad():
            image_features = model.get_image_features(**inputs)
            # Разные версии transformers возвращают по-разному
            if hasattr(image_features, 'pooler_output'):
                image_features = image_features.pooler_output
            elif hasattr(image_features, 'last_hidden_state'):
                image_features = image_features.last_hidden_state[:, 0]
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
        
        embedding = image_features.numpy()[0].tolist()
        
        return jsonify({'embedding': embedding})
    
    except Exception as e:
        import traceback
        print(f"Error in embed_image: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Проверка работоспособности"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)