import { NextResponse } from 'next/server'
import { apiResponse } from '@/lib/api-utils'

export async function POST() {
  const response = apiResponse(null, 'Logged out successfully')
  
  // Clear the session cookie
  response.cookies.set({
    name: 'session',
    value: '',
    expires: new Date(0),
    path: '/',
  })

  return response
}
