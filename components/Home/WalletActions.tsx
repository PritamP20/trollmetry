import { useFrame } from '@/components/farcaster-provider'
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector'
import { parseEther } from 'viem'
import { base } from 'viem/chains'
import { useAppKit } from '@reown/appkit/react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useSwitchChain,
} from 'wagmi'

export function WalletActions() {
  const { isEthProviderAvailable } = useFrame()
  const { isConnected, address, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: hash, sendTransaction } = useSendTransaction()
  const { switchChain } = useSwitchChain()
  const { connect } = useConnect()
  const { open } = useAppKit()

  async function sendTransactionHandler() {
    sendTransaction({
      to: '0x7f748f154B6D180D35fA12460C7E4C631e28A9d7',
      value: parseEther('1'),
    })
  }

  if (isConnected) {
    return (
      <div className="space-y-2 rounded-lg p-2 bg-[#001226] border border-[#0A5CDD]/40">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#A3B3C2]">
              <span className="font-mono text-white text-xs">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
            </p>
            <button
              type="button"
              className="bg-[#11253F] hover:bg-[#1a355a] text-white rounded px-2 py-1 text-xs border border-[#0A5CDD]/30"
              onClick={() => disconnect()}
            >
              Disconnect
            </button>
          </div>
          {chainId !== base.id && (
            <button
              type="button"
              className="bg-[#0A5CDD] hover:bg-[#0b6ef3] text-white rounded px-2 py-1 text-xs w-full"
              onClick={() => switchChain({ chainId: base.id })}
            >
              Switch to Base
            </button>
          )}
        </div>
      </div>
    )
  }

  if (isEthProviderAvailable) {
    return (
      <div className="rounded-lg p-2 bg-[#001226] border border-[#0A5CDD]/40">
        <button
          type="button"
          className="bg-[#0A5CDD] hover:bg-[#0b6ef3] text-white w-full rounded px-3 py-2 text-xs"
          onClick={() => {
            if (isEthProviderAvailable) {
              // Inside Warpcast MiniApp: use the Farcaster connector
              connect({ connector: miniAppConnector() })
            } else {
              // On the web: open the WalletConnect/AppKit modal
              open?.()
            }
          }}
        >
          Connect Wallet
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-lg p-2 bg-[#001226] border border-[#0A5CDD]/40">
      <p className="text-xs text-center text-[#A3B3C2]">Connect via Warpcast</p>
    </div>
  )
}
