import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from flask import Flask, render_template, request, jsonify
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# --- App Setup ---
app = Flask(__name__,
            template_folder='templates',
            static_folder='static')

# --- Global Model Placeholder ---
model = LogisticRegression()
is_model_trained = False

def train_model_if_needed(df):
    """
    A helper function to train a simple model for demonstration.
    This simulates loading a pre-trained model.
    """
    global model, is_model_trained
    if is_model_trained:
        return

    try:
        # Basic feature engineering
        df['Age'] = df['Age'].fillna(df['Age'].median())
        df['Fare'] = df['Fare'].fillna(df['Fare'].median())
        # The 'Sex' column is converted to numeric for the model
        df['Sex'] = df['Sex'].apply(lambda x: 1 if x == 'male' else 0)
        
        # Select features and target
        features = ['Pclass', 'Sex', 'Age', 'Fare']
        target = 'Survived'
        
        X = df[features]
        y = df[target]

        # Simple training
        model.fit(X, y)
        is_model_trained = True
        print("Model has been trained for this session.")
    except Exception as e:
        print(f"Could not train model: {e}")


@app.route('/')
def index():
    """Renders the main HTML page."""
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Receives the uploaded CSV, performs analysis, generates plots,
    makes predictions, and returns all data as JSON.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # --- Data Loading and Cleaning ---
        df = pd.read_csv(io.StringIO(file.stream.read().decode("UTF8")))
        
        # Ensure 'Survived' column exists for training the demo model
        if 'Survived' in df.columns:
            train_model_if_needed(df.copy())

        # Prepare data for prediction and analysis
        df_predict = df.copy()
        df_predict['Age'] = df_predict['Age'].fillna(df_predict['Age'].median())
        df_predict['Fare'] = df_predict['Fare'].fillna(df_predict['Fare'].median())
        
        # FIX: Consistently use and modify the 'Sex' column.
        # No longer creating a separate 'Sex_numeric' column.
        df_predict['Sex'] = df_predict['Sex'].apply(lambda x: 1 if x == 'male' else 0)
        
        # --- Prediction ---
        predictions = []
        if is_model_trained:
            # FIX: Use the same feature names the model was trained on.
            features = ['Pclass', 'Sex', 'Age', 'Fare']
            X_pred = df_predict[features]
            df_predict['Survived_Prediction'] = model.predict(X_pred)
            df_predict['Survival_Probability'] = model.predict_proba(X_pred)[:, 1]
            
            for _, row in df_predict.head(100).iterrows():
                predictions.append({
                    'PassengerId': row.get('PassengerId', 'N/A'),
                    'Name': row.get('Name', 'N/A'),
                    'Predicted_Outcome': int(row['Survived_Prediction']),
                    'Survival_Probability': float(row['Survival_Probability'])
                })

        # --- Data Visualization ---
        charts = {}
        plt.style.use('seaborn-v0_8-darkgrid')

        # Chart 1: Survival Count by Gender
        fig, ax = plt.subplots(figsize=(6, 4))
        # Use the original 'Sex' column for plotting for better labels ('male'/'female')
        sns.countplot(data=df, x='Sex', hue=df_predict['Survived_Prediction'], ax=ax, palette='viridis')
        ax.set_title('Survival Count by Gender')
        
        buf = io.BytesIO()
        fig.savefig(buf, format="png", bbox_inches='tight')
        charts['sex_survival'] = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close(fig)

        # --- Summary Statistics ---
        survived_count = int(df_predict['Survived_Prediction'].sum())
        deceased_count = len(df_predict) - survived_count
        summary = {
            'total': len(df_predict),
            'survived': survived_count,
            'deceased': deceased_count
        }
        
        return jsonify({
            'summary': summary,
            'predictions': predictions,
            'charts': charts
        })

    except Exception as e:
        # Return a specific error message to the frontend
        return jsonify({'error': f"An error occurred on the server: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
