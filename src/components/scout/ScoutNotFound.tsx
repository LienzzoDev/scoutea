'use client'

import { AlertCircle, ArrowLeft, Search } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface ScoutNotFoundProps {
  scoutId: string
  error?: string
}

export function ScoutNotFound({ scoutId, error }: ScoutNotFoundProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Scout Not Found
          </CardTitle>
          <CardDescription className="text-gray-600">
            The scout you're looking for doesn't exist or has been removed.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <strong>Scout ID:</strong> <code className="bg-white px-2 py-1 rounded text-xs">{scoutId}</code>
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-2">
                <strong>Error:</strong> {error}
              </p>
            )}
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/member/scouts">
                <Search className="w-4 h-4 mr-2" />
                Browse All Scouts
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/member/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ScoutNotFound