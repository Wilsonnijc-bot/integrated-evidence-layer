# How to Run the Web Server

## Quick Start

1. **Open Terminal** (if not already open)

2. **Navigate to the project directory**:
   ```bash
   cd /Users/nijiachen/integrated-evidence-layer
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

## What You'll See

- The server will start and show:
  ```
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Ready in X.Xs
  ```

- Press `Ctrl + C` in the terminal to stop the server

## If You Get Errors

- **Port 3000 already in use?**
  - Kill the process: `lsof -ti:3000 | xargs kill -9`
  - Or use a different port: `PORT=3001 npm run dev`

- **Dependencies not installed?**
  ```bash
  npm install
  ```

- **Need to restart?**
  - Press `Ctrl + C` to stop
  - Run `npm run dev` again

## Testing the API

Once the server is running:
1. Go to `http://localhost:3000`
2. Enter a token address (e.g., `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` for USDC)
3. Select a chain (Ethereum, BSC, etc.)
4. Click "Fetch risk evidence"
5. You'll see the detailed report with real GoPlus data!

