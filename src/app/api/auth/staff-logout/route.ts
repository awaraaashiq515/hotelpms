import { NextResponse } from 'next/server'
import { apiResponse } from '@/lib/api-utils'

export async function POST() {
  const response = apiResponse(null, 'Logged out successfully')
  
  // Clear the staff_session cookie specifically
  response.cookies.set({
    name: 'staff_session',
    value: '',
    expires: new Date(0),
    path: '/',
  })

  return response
}
