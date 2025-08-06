
# Titanic Survival Prediction Web App

An interactive web application that predicts passenger survival on the Titanic. This project allows users to upload a passenger dataset in CSV format and receive real-time survival predictions based on a pre-trained machine learning model. The front-end is built with HTML, CSS, and JavaScript, and the backend is powered by Python and Flask.

---

## Features

- **Interactive File Upload:** Drag-and-drop or click to upload a CSV dataset.
- **Real-Time Prediction:** The app uses a simplified logistic regression model in JavaScript for instant client-side predictions.
- **Data Analysis Summary:** View key metrics, including the total number of passengers, predicted survivors, and predicted deceased.
- **Detailed Results Table:** See a passenger-by-passenger breakdown of survival predictions and probabilities.
- **Responsive Design:** A clean, modern UI that works on both desktop and mobile devices.
- **Light & Dark Mode:** Toggle between themes for comfortable viewing.

---

## Tech Stack

**Frontend:**
- HTML5
- CSS3 (with Tailwind CSS for utility classes)
- JavaScript (for DOM manipulation, file handling, and client-side prediction)

**Backend (Placeholder/Example):**
- Python 3
- Flask (as the web framework)

**Machine Learning:**
- scikit-learn
- pandas

**Deployment:**
- Render (for static site hosting)

---

## Project Structure

```

/
\|-- index.html          # Main HTML structure
\|-- style.css           # Custom CSS and theme variables
\|-- script.js           # All JavaScript logic
\|-- app.py              # Backend Flask application (for future development)
\|-- requirements.txt    # Python dependencies
\|-- README.md           # Project documentation

````

---

## Setup and Deployment

### Option 1: Run as a Static Site (No Backend)
This is the simplest method and uses the client-side JavaScript model.

1. Clone the repository:
   ```bash
   git clone https://github.com/shreyas27092004/titanic-survival-prediction.git
````
