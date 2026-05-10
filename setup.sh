#!/bin/bash
echo "Creating MonArena project files..."

# package.json
cat > package.json << 'EOF'
{
  "name": "monarena",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.0.0",
    "wagmi": "^2.14.0",
    "viem": "^2.21.0",
    "@wagmi/connectors": "^5.3.0",
    "@tanstack/react-query": "^5.59.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.8"
  }
}
EOF

# vite.config.js
cat > vite.config.js << 'EOF'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  define: { global: "globalThis" },
});
EOF

# index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#FFF6EC" />
    <title>MonArena — Two games. One arena.</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

# .gitignore
cat > .gitignore << 'EOF'
node_modules
dist
.env
.env.local
EOF

# .env.example
cat > .env.example << 'EOF'
VITE_WC_PROJECT_ID=your_walletconnect_project_id
VITE_CONTRACT_ADDRESS=your_contract_address
EOF

echo "Base files created!"
