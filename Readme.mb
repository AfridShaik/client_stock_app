
# Stock_App: Real-Time Stock Price Streaming Application

## Overview

Stock_App is a sophisticated real-time stock price streaming application designed to provide users with live updates on stock prices. The application is built with a React frontend and a Node.js backend, both implemented using TypeScript. It aims to deliver a seamless user experience by efficiently managing data updates and ensuring optimal performance.

## Key Features

1. **Real-Time Data Streaming**: Establishes a two-way WebSocket connection between the frontend and backend, allowing for real-time updates of stock prices.
2. **Web Worker Utilization**: The frontend employs a web worker to handle incoming data from the backend, ensuring the main thread remains responsive.
3. **Throttling Mechanism**: Implements throttling in the web worker to control the frequency of updates sent to the main thread, enhancing UI performance.
4. **Dynamic Stock List**: Users can view and select stocks to track, with data fetched from a JSON file in the backend.
5. **Error Handling**: Designed to handle errors and disconnections from the WebSocket connection, providing appropriate feedback to users.
6. **TypeScript Implementation**: The entire application is built using TypeScript, ensuring type safety and improving code quality.

## Project Structure

The project is divided into two main parts: the frontend and the backend.

### Frontend

- **React Application**: Provides a user-friendly interface for displaying stock prices.
- **Web Worker**: Manages data processing without blocking the UI.
- **Styling**: Ensures a pleasant user experience with a well-designed interface.

### Backend

- **Node.js Server**: Handles WebSocket connections and data fetching.
- **Price Simulator**: Generates stock prices based on initial values provided in a JSON file.

## Installation and Setup

To set up the application locally, follow these steps:

1. **Install Dependencies**:
   Navigate to both the client and backend directories and install the necessary dependencies:
   ```bash
   cd Stock_App/client_stock_app
   npm install
   cd ../backend
   npm install
   ```

2. **Run the Application**:
   - Start the backend server:
     ```bash
     npm start
     ```
     The server will run on `http://localhost:8080`.

   - In a new terminal, start the React application:
     ```bash
     cd client_stock_app
     npm start
     ```
     The application will be available at `http://localhost:3000`.

## Debugging

### Common Issues

1. **WebSocket Connection Failures**
   - Ensure the backend server is running on port 8080.
   - Verify WebSocket URL configuration.
   - Check browser console for connection errors.

2. **Price Updates Not Showing**
   - Verify stock subscription status.
   - Check WebSocket connection state.
   - Inspect worker messages in browser dev tools.

3. **Performance Issues**
   - Monitor browser CPU usage.
   - Check network tab for WebSocket traffic.
   - Verify throttling mechanism is working.

## Project Architecture

### Frontend Components

- `App.tsx`: Main application component.
- `Portfolio.tsx`: Portfolio management.
- `worker.ts`: WebSocket worker implementation.
- `workerContext.tsx`: Global state management.

### Backend Components

- `server.ts`: WebSocket and HTTP server.
- `PriceSimulator.ts`: Stock price simulation.
- `stock_list.json`: Initial stock data.

### Data Flow

1. Client initiates WebSocket connection.
2. Server broadcasts price updates every 25ms.
3. Web Worker throttles updates to 100ms.
4. React components render updated prices.

## Stock Portfolio Feature

### Overview

The Portfolio component provides real-time tracking of selected stocks and their total value. It maintains a WebSocket connection to receive live price updates and calculates the portfolio's total value automatically.

### Features

- **Real-Time Updates**: Live price updates through WebSocket connection.
- **Automatic Total Value Calculation**: Calculates the portfolio's total value.
- **Individual Stock Price Display**: Displays prices of individual stocks.
- **Formatted Currency Display**: Prices are displayed with 2 decimal places.

## Conclusion

The Stock_App project is an ambitious undertaking that combines real-time data streaming with a user-friendly interface. By leveraging modern web technologies and best practices, this application aims to provide a robust solution for tracking stock prices in real-time.

Feel free to reach out if you have any questions or need further assistance during the development process.
