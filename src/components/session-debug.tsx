'use client'

import { useAuth, useUser } from '@clerk/nextjs'

export default function SessionDebug() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return <div className="p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
      <p className="text-yellow-400">Cargando sesión...</p>
    </div>
  }

  return (
    <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg mb-4">
      <h3 className="text-blue-400 font-semibold mb-2">Debug de Sesión</h3>
      <div className="text-sm text-blue-300 space-y-1">
        <p><strong>isSignedIn:</strong> {isSignedIn ? 'true' : 'false'}</p>
        <p><strong>userId:</strong> {userId || 'undefined'}</p>
        <p><strong>user.publicMetadata:</strong> {JSON.stringify(user?.publicMetadata, null, 2)}</p>
        <p><strong>user.privateMetadata:</strong> {JSON.stringify((user as { privateMetadata?: unknown })?.privateMetadata, null, 2)}</p>
      </div>
    </div>
  )
}
