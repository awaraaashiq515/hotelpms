import { redirect } from 'next/navigation'

// This page has been moved to /staff-portal/[propertyCode]
// Redirect anyone visiting the old test URL
export default function WalkieTalkieTestRedirect() {
  redirect('/staff-portal')
}
