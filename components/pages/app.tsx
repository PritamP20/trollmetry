'use client'

import { Demo } from '@/components/Home'
import { useFrame } from '@/components/farcaster-provider'
import { SafeAreaContainer } from '@/components/safe-area-container'
import Navbar from '../Home/Navbar'

export default function Home() {
  const { context, isLoading, isSDKLoaded } = useFrame()
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

  if (isLoading) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">Loading...</h1>
        </div>
      </SafeAreaContainer>
    )
  }

  if (!isSDKLoaded && !isDevMode) {
    return (
      <SafeAreaContainer insets={context?.client.safeAreaInsets}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 space-y-8">
          <h1 className="text-3xl font-bold text-center">
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
      <Navbar />
      <Demo />
    </SafeAreaContainer>
  )
}
