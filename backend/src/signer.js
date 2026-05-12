import { ethers } from "ethers";
import 'dotenv/config';

export async function signWin(winnerAddress, roomId) {
    const messageHash = ethers.solidityPackedKeccak256(
        ["address", "string"],
        [winnerAddress, roomId]
    );
    // Sign the hash using the private key from .env
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const signature = await wallet.signMessage(ethers.toBeArray(messageHash));
    return signature;
}
