import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { defineChain } from 'viem';

export const monadMainnet = defineChain({
  id: 143,
  name: 'Monad Mainnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.monad.xyz/'] } },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://monvision.io/' } },
});

export const projectId = 'e43a96003e8a44a51cb84f4ef0960835'; 

const metadata = {
  name: 'MonArena',
  description: 'Web3 Ludo Game',
  url: 'https://monarena.vercel.app',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

export const wagmiAdapter = new WagmiAdapter({
  networks: [monadMainnet],
  projectId,
});

export const config = wagmiAdapter.wagmiConfig;
