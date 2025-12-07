import App from '@/components/pages/app'
import { APP_URL } from '@/lib/constants'
import type { Metadata } from 'next'

const frame = {
  version: 'next',
  imageUrl: `${APP_URL}/images/base.png`,
  button: {
    title: 'Play Math Devil',
    action: {
      type: 'launch_frame',
      name: 'Math Devil - Troll Game',
      url: APP_URL,
      splashImageUrl: `${APP_URL}/images/splash.png`,
      splashBackgroundColor: '#0f0f23',
    },
  },
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Math Devil - Troll Game on Farcaster',
    openGraph: {
      title: 'Math Devil - Troll Game',
      description: 'A devilish math platformer with on-chain points, badges & leaderboard on Sepolia',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  }
}

export default function Home() {
  return <App />
}
