# Smart Contract Deployment Guide

## Deploy to Sepolia Testnet

### Option 1: Using Remix IDE (Easiest - 5 minutes)

1. **Get Sepolia ETH**
   - Go to https://sepoliafaucet.com/ or https://www.alchemy.com/faucets/ethereum-sepolia
   - Request testnet ETH for your wallet

2. **Open Remix**
   - Go to https://remix.ethereum.org/

3. **Create Contract File**
   - Create a new file called `MathDevilGame.sol`
   - Copy the contents of `contracts/MathDevilGame.sol` into it

4. **Compile**
   - Click on "Solidity Compiler" (left sidebar)
   - Select compiler version `0.8.20`
   - Click "Compile MathDevilGame.sol"

5. **Deploy**
   - Click on "Deploy & Run Transactions" (left sidebar)
   - Change ENVIRONMENT to "Injected Provider - MetaMask"
   - Connect your MetaMask wallet and switch to Sepolia network
   - Click "Deploy"
   - Confirm the transaction in MetaMask

6. **Copy Contract Address**
   - After deployment, you'll see the contract under "Deployed Contracts"
   - Click the copy icon next to the contract address

7. **Update Environment Variable**
   - Create or update `.env.local` in your project root:
   ```
   NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=0xYourContractAddressHere
   ```

### Option 2: Using Hardhat (Advanced)

1. **Install Hardhat**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **Initialize Hardhat**
   ```bash
   npx hardhat init
   ```

3. **Configure for Sepolia**
   Add to `hardhat.config.js`:
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");

   module.exports = {
     solidity: "0.8.20",
     networks: {
       sepolia: {
         url: "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
         accounts: ["YOUR_PRIVATE_KEY"]
       }
     }
   };
   ```

4. **Create Deploy Script**
   Create `scripts/deploy.js`:
   ```javascript
   async function main() {
     const MathDevilGame = await ethers.getContractFactory("MathDevilGame");
     const game = await MathDevilGame.deploy();
     await game.waitForDeployment();
     console.log("MathDevilGame deployed to:", await game.getAddress());
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1;
   });
   ```

5. **Deploy**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

6. **Update Environment Variable**
   ```
   NEXT_PUBLIC_GAME_CONTRACT_ADDRESS=0xYourContractAddressHere
   ```

### Option 3: Using Foundry (Fast)

1. **Install Foundry**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Initialize**
   ```bash
   forge init
   mv contracts/MathDevilGame.sol src/
   ```

3. **Deploy**
   ```bash
   forge create --rpc-url https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY \
     --private-key YOUR_PRIVATE_KEY \
     src/MathDevilGame.sol:MathDevilGame
   ```

## After Deployment

1. Update `.env.local` with the contract address
2. Restart your development server: `npm run dev`
3. Test the game and score submission
4. Verify contract on Etherscan (optional):
   - Go to https://sepolia.etherscan.io/
   - Search for your contract address
   - Click "Verify and Publish"
   - Follow the steps

## Quick Test Without Deployment

The app will work without a deployed contract! It will:
- Show a message that the contract isn't deployed
- Still allow you to play the game
- Just won't save scores on-chain

Perfect for testing the game mechanics first!
