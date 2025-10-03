'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function StripeDebugPage() {
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [webhookLogs, setWebhookLogs] = useState<any>(null)
  const [userRole, setUserRole] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const checkPaymentStatus = async () => {
    setLoading(true)
    try {
      const url = sessionId 
        ? `/api/debug/stripe-payment-status?session_id=${sessionId}`
        : '/api/debug/stripe-payment-status'
      
      const response = await fetch(url)
      const data = await response.json()
      setPaymentStatus(data)
    } catch (error) {
      console.error('Error checking payment status:', error)
    }
    setLoading(false)
  }

  const checkWebhookLogs = async () => {
    try {
      const response = await fetch('/api/debug/webhook-logs')
      const data = await response.json()
      setWebhookLogs(data)
    } catch (error) {
      console.error('Error checking webhook logs:', error)
    }
  }

  const checkUserRole = async () => {
    try {
      const response = await fetch('/api/check-role')
      const data = await response.json()
      setUserRole(data)
    } catch (error) {
      console.error('Error checking user role:', error)
    }
  }

  const assignRole = async (role: string) => {
    try {
      const response = await fetch('/api/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })
      const data = await response.json()
      if (data.success) {
        alert(`Role ${role} assigned successfully!`)
        checkUserRole()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert(`Error: ${error}`)
    }
  }

  useEffect(() => {
    checkPaymentStatus()
    checkWebhookLogs()
    checkUserRole()
  }, [sessionId])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Stripe Payment Debug</h1>
        
        {sessionId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-800">Session ID Detected</h2>
            <p className="text-blue-600">{sessionId}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Role Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Current User Role</h2>
              <button 
                onClick={checkUserRole}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Refresh
              </button>
            </div>
            
            {userRole ? (
              <div className="space-y-2">
                <p><strong>Role:</strong> {userRole.role || 'None'}</p>
                <p><strong>Email:</strong> {userRole.email}</p>
                <p><strong>Member Access:</strong> {userRole.access?.memberArea ? '✅' : '❌'}</p>
                <p><strong>Scout Access:</strong> {userRole.access?.scoutArea ? '✅' : '❌'}</p>
                <p><strong>Admin:</strong> {userRole.access?.isAdmin ? '✅' : '❌'}</p>
                
                <div className="mt-4 space-x-2">
                  <button 
                    onClick={() => assignRole('member')}
                    className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    Assign Member
                  </button>
                  <button 
                    onClick={() => assignRole('scout')}
                    className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
                  >
                    Assign Scout
                  </button>
                  <button 
                    onClick={() => assignRole('admin')}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Assign Admin
                  </button>
                </div>
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Payment Status</h2>
              <button 
                onClick={checkPaymentStatus}
                disabled={loading}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            {paymentStatus ? (
              <div className="space-y-2">
                <p><strong>Valid Session:</strong> {paymentStatus.analysis?.hasValidSession ? '✅' : '❌'}</p>
                <p><strong>Active Subscription:</strong> {paymentStatus.analysis?.hasActiveSubscription ? '✅' : '❌'}</p>
                <p><strong>Total Sessions:</strong> {paymentStatus.analysis?.totalSessions || 0}</p>
                <p><strong>Last Session Status:</strong> {paymentStatus.analysis?.lastSessionStatus || 'none'}</p>
                
                {paymentStatus.stripeData?.specificSession && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h3 className="font-semibold">Current Session</h3>
                    <p><strong>Status:</strong> {paymentStatus.stripeData.specificSession.status}</p>
                    <p><strong>Payment Status:</strong> {paymentStatus.stripeData.specificSession.payment_status}</p>
                    <p><strong>Amount:</strong> {paymentStatus.stripeData.specificSession.amount_total / 100} {paymentStatus.stripeData.specificSession.currency?.toUpperCase()}</p>
                  </div>
                )}
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>

          {/* Webhook Logs */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Recent Webhook Events</h2>
              <button 
                onClick={checkWebhookLogs}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Refresh
              </button>
            </div>
            
            {webhookLogs ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {webhookLogs.logs?.length > 0 ? (
                  webhookLogs.logs.map((log: any, index: number) => (
                    <div key={index} className={`p-3 rounded ${log.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p><strong>{log.event}</strong> {log.success ? '✅' : '❌'}</p>
                          <p className="text-sm text-gray-600">{log.timestamp}</p>
                          {log.error && <p className="text-sm text-red-600">Error: {log.error}</p>}
                        </div>
                        <details className="text-xs">
                          <summary className="cursor-pointer">Data</summary>
                          <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto max-w-md">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No webhook events recorded</p>
                )}
              </div>
            ) : (
              <p>Loading...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}