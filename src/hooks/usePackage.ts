/**
 * usePackage — client-side hook to check which features the current
 * org's package grants. Super Admins always get all features.
 *
 * Usage:
 *   const { hasFeature, discountPercent } = usePackage()
 *   if (!hasFeature('POS')) return <UpgradePrompt />
 */
'use client'

import { useEffect, useState } from 'react'

type PackageState = {
  features: string[]
  discountPercent: number
  isLoaded: boolean
  hasFeature: (key: string) => boolean
}

export function usePackage(): PackageState {
  const [features, setFeatures] = useState<string[]>([])
  const [discountPercent, setDiscountPercent] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data?.packageFeatures) {
          setFeatures(data.packageFeatures)
        }
        if (data?.discountPercent !== undefined) {
          setDiscountPercent(data.discountPercent)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoaded(true))
  }, [])

  const hasFeature = (key: string): boolean => {
    // If no features configured (no package), allow everything (backwards compat)
    if (features.length === 0) return true
    return features.includes(key)
  }

  return { features, discountPercent, isLoaded, hasFeature }
}
