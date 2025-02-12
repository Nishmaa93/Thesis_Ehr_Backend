import warnings
warnings.filterwarnings("ignore", message="urllib3 v2 only supports OpenSSL")

import sys  # To handle command-line arguments
# print(sys.executable)

import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing import image
import os
# Define the path to the model file
model_path = os.path.join(os.path.dirname(__file__), 'final_model.keras')

# Class labels
CLASS_LABELS = ['COVID19', 'NORMAL', 'PNEUMONIA', 'TUBERCULOSIS']

# Load the trained model
model = tf.keras.models.load_model(model_path)

# Function to preprocess the input image
def preprocess_image(img_path, target_size=(224, 224)):
    img = image.load_img(img_path, target_size=target_size)  # Load the image
    img_array = image.img_to_array(img)  # Convert to array
    img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
    img_array = img_array / 255.0  # Normalize to [0, 1]
    return img_array

# Define recommendations based on detected class
def get_recommendations(predicted_class):
    recommendations = {
        'COVID19': "Isolate immediately, monitor oxygen levels, and consult a doctor. Follow local health guidelines and get adequate rest.",
        'NORMAL': "No abnormalities detected. Maintain a healthy lifestyle.",
        'PNEUMONIA': "Consult a doctor promptly. Common treatments may include antibiotics or antiviral medications depending on the cause.",
        'TUBERCULOSIS': "Seek immediate medical attention. Treatment usually involves a long course of antibiotics such as Rifampin and Isoniazid."
    }
    return recommendations.get(predicted_class, "No specific recommendations available.")

# Function to predict condition and return results
def predict_condition(image_path):
    # print('SYSTEM RUNNING IN : ${sys.executable}')
    preprocessed_image = preprocess_image(image_path)
    predictions = model.predict(preprocessed_image, verbose=0)
    predicted_class_index = np.argmax(predictions)  # Get the index of the highest probability
    predicted_class = CLASS_LABELS[predicted_class_index]  # Map index to class label
    confidence = predictions[0][predicted_class_index]
    recommendations = get_recommendations(predicted_class)
    return predicted_class, confidence, recommendations

if __name__ == "__main__":
    # Get the image path from the command-line arguments
    if len(sys.argv) < 2:
        print("Error: No image path provided.")
        sys.exit(1)

    image_path = sys.argv[1]
    # image_path="images/preprocessed/test/COVID19/COVID19(460).jpg"

    # Call the function and print the results
    try:
        predicted_class, confidence, recommendations = predict_condition(image_path)
        print(f"Predicted Class: {predicted_class}")
        print(f"Confidence: {confidence:.2f}")
        print(f"Recommendations: {recommendations}")
    except Exception as e:
        print(f"Error during prediction: {str(e)}")
