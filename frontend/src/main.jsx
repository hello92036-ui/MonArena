import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { projectId, wagmiAdapter, monadMainnet } from './wagmi'

const queryClient = new QueryClient()

createAppKit({
  adapters: [wagmiAdapter],
  networks: [monadMainnet],
  projectId,
  metadata: {
    name: 'MonArena',
    description: 'Web3 Ludo Game',
    url: 'https://monarena.vercel.app',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  },
  // Featured IDs provided by you
  featuredWalletIds: [
    '719bd888109f5e8dd23419b20e749900ce4d2fc6858cf588395f19c82fd036b3', // HaHa
    '18388be9ac2d02726dbac9777c96efaac06d744b2f6d580fccdd4127a6d01fd1', // Rabby
    'a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393', // Phantom
    '2bd8c14e035c2d48f184aaa168559e86b0e3433228d3c4075900a221785019b0'  // Backpack
  ],
  features: { 
    analytics: true,
    allWallets: true 
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)
