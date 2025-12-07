'use client'

import GameWrapper from '@/components/GameWrapper'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import Navbar from '../Home/Navbar'
import { WalletActions } from '@/components/Home/WalletActions'

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame()
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8 bg-[#0f0f23]">
          <h1 className="text-3xl font-bold text-center text-white">Loading...</h1>
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded && !isDevMode) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8 bg-[#0f0f23]">
          <h1 className="text-3xl font-bold text-center text-white">
            No farcaster SDK found, please use this miniapp in the farcaster app
          </h1>
        </div>
      </SafeAreaContainer>
    )
  }

  return (
    <SafeAreaContainer insets={context?.client.safeAreaInsets}>
      {isDevMode && !isSDKLoaded && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Development Mode</p>
          <p className="text-sm">
            Running outside Farcaster app. Some features may not work correctly.
          </p>
        </div>
      )}
      <div className="bg-[#0f0f23] min-h-screen">
        <div className="container mx-auto max-w-lg px-2">
          <div className="py-2">
            <div className="text-center mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-[#e74c3c] mb-1">Math Devil Game</h1>
              <p className="text-gray-400 text-xs mb-2">Connect wallet to save score on-chain</p>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-xs">
                <WalletActions />
              </div>
            </div>
          </div>
        </div>
        <GameWrapper />
      </div>
    </SafeAreaContainer>
  )
}
