# BMI Calculator

A lightweight, responsive BMI calculator that runs in the browser. The app supports metric and imperial inputs, explains the result category, provides general health tips, and saves recent calculations in your browser.

## Features

- Calculate BMI from height in metres or centimetres and weight in kilograms or pounds.
- Display an Underweight, Normal, Overweight, or Obese category with general guidance.
- Keep up to 50 recent calculations in browser local storage.
- Install as a progressive web app where supported; includes a service worker for offline use after the app has been loaded.
- No account or external service is required to calculate BMI.

## Run locally

Requires Node.js. From the project directory, run:

```sh
node server.js
```

Then open [http://localhost:5500](http://localhost:5500) in a browser. To use another port, set the `PORT` environment variable before starting the server.

## Note

BMI is a general screening measure, not a diagnosis or a substitute for medical advice.
