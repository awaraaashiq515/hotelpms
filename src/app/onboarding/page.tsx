'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Building2, Store, Settings,
  ArrowRight, ArrowLeft, Check, Plus, Trash2
} from 'lucide-react'

// Define Consolidated Schema
const onboardingSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  phone: z.string().min(10, 'Phone Number is required'),
  designation: z.string().optional(),
  name: z.string().min(1, 'Organization Name is required'),
  businessType: z.string().min(1, 'Business Type is required'),
  businessPreferences: z.string().optional(),
  propertyName: z.string().min(1, 'Property Name is required'),
  propertyType: z.string().min(1, 'Property Type is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  country: z.string().min(1, 'Country is required'),
  pinCode: z.string().min(6, 'PIN Code must be 6 digits'),
  taxDetails: z.string().optional(),
  categories: z.array(z.object({
    name: z.string().min(1, 'Category Name is required'),
  })).optional(),
  products: z.array(z.object({
    name: z.string().min(1, 'Product Name is required'),
    sellingPrice: z.number().min(0, 'Price must be positive'),
  })).optional(),
  tables: z.array(z.object({
    name: z.string().min(1, 'Table Name is required'),
    floorName: z.string().min(1, 'Floor is required'),
  })).optional(),
})

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const steps = [
    { title: 'Personal', icon: <User className="w-5 h-5" /> },
    { title: 'Organization', icon: <Building2 className="w-5 h-5" /> },
    { title: 'Property', icon: <Store className="w-5 h-5" /> },
    { title: 'Operational', icon: <Settings className="w-5 h-5" /> },
  ]

  const { register, trigger, getValues, control, handleSubmit, formState: { errors } } = useForm<z.infer<typeof onboardingSchema>>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      designation: '',
      name: '',
      businessType: '',
      businessPreferences: '',
      propertyName: '',
      propertyType: '',
      address: '',
      city: '',
      state: '',
      country: '',
      pinCode: '',
      taxDetails: '',
      categories: [{ name: '' }],
      products: [{ name: '', sellingPrice: 0 }],
      tables: [{ name: '', floorName: '' }],
    }
  })

  // Field Arrays for Dynamic Items
  const { fields: categoryFields, append: appendCategory, remove: removeCategory } = useFieldArray({
    control, name: 'categories'
  })

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
    control, name: 'products'
  })

  const { fields: tableFields, append: appendTable, remove: removeTable } = useFieldArray({
    control, name: 'tables'
  })

  const nextStep = async () => {
    let fieldsToValidate: any[] = []
    if (currentStep === 0) fieldsToValidate = ['fullName', 'phone']
    if (currentStep === 1) fieldsToValidate = ['name', 'businessType']
    if (currentStep === 2) fieldsToValidate = ['propertyName', 'propertyType', 'address', 'city', 'state', 'country', 'pinCode']
    
    const isValid = fieldsToValidate.length > 0 ? await trigger(fieldsToValidate) : await trigger()

    if (isValid) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        onSubmit(getValues())
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Structure payload for backend
      const payload = {
        personal: {
          fullName: data.fullName,
          phone: data.phone,
          designation: data.designation,
        },
        organization: {
          name: data.name,
          businessType: data.businessType,
          businessPreferences: data.businessPreferences,
        },
        property: {
          name: data.propertyName,
          type: data.propertyType,
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          pinCode: data.pinCode,
          taxDetails: data.taxDetails,
        },
        categories: data.categories.filter((c: any) => c.name),
        products: data.products.filter((p: any) => p.name).map((p: any) => ({
          ...p,
          sellingPrice: Number(p.sellingPrice)
        })),
        tables: data.tables.filter((t: any) => t.name)
      }

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (res.ok) {
        // Force reload or redirect to dashboard
        router.push('/dashboard')
      } else {
        setSubmitError(result.message || 'Something went wrong')
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col justify-center items-center p-6 text-white font-sans">
      <div className="w-full max-w-4xl bg-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-2xl shadow-2xl p-8">

        {/* Progress Header */}
        <div className="flex justify-between items-center mb-12 border-b border-neutral-700/50 pb-6">
          <div className="flex space-x-4">
            {steps.map((step, index) => (
              <div key={index} className={`flex items-center space-x-2 ${index <= currentStep ? 'text-blue-400' : 'text-neutral-500'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${index <= currentStep ? 'border-blue-400 bg-blue-400/10' : 'border-neutral-600'}`}>
                  {index < currentStep ? <Check className="w-4 h-4" /> : step.icon}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.title}</span>
                {index < steps.length - 1 && <div className="w-6 border-t border-neutral-600" />}
              </div>
            ))}
          </div>
          <div className="text-sm text-neutral-400">Step {currentStep + 1} of {steps.length}</div>
        </div>

        {/* Error Notification */}
        {submitError && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 text-sm">
            {submitError}
          </div>
        )}

        {/* Form Steps */}
        <form onSubmit={handleSubmit(onSubmit)}>

          {/* Step 1: Personal */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-100">Tell us about yourself</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Full Name</label>
                  <input {...register('fullName')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" placeholder="John Doe" />
                  {errors.fullName && <p className="text-red-400 text-xs mt-1">{(errors.fullName as any).message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Phone Number</label>
                  <input {...register('phone')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" placeholder="+91 9876543210" />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{(errors.phone as any).message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Role / Designation</label>
                  <input {...register('designation')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" placeholder="eg. Manager, Owner" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Organization */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-100">Your Organization</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Organization Name</label>
                  <input {...register('name')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" placeholder="Acme Hospitality" />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Business Type</label>
                  <select {...register('businessType')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500">
                    <option value="">Select Type</option>
                    <option value="HOTEL">Hotel</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="RESORT">Resort</option>
                    <option value="HOMESTAY">Homestay</option>
                  </select>
                  {errors.businessType && <p className="text-red-400 text-xs mt-1">{errors.businessType.message as string}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Property */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4 text-blue-100">Property Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Company Name</label>
                  <input {...register('propertyName')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
                  {errors.propertyName && <p className="text-red-400 text-xs mt-1">{errors.propertyName.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Property Type</label>
                  <input {...register('propertyType')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Address</label>
                  <input {...register('address')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">City</label>
                  <input {...register('city')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">State</label>
                  <input {...register('state')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Country</label>
                  <input {...register('country')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">PIN Code</label>
                  <input {...register('pinCode')} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" />
                  {errors.pinCode && <p className="text-red-400 text-xs mt-1">{errors.pinCode.message as string}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Operational Setup */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold mb-4 text-blue-100">Operational Setup</h2>

              {/* Categories */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-neutral-200">Product Categories</h3>
                  <button type="button" onClick={() => appendCategory({ name: '' })} className="text-blue-400 text-sm hover:underline flex items-center"><Plus className="w-4 h-4 mr-1" /> Add</button>
                </div>
                <div className="space-y-2">
                  {categoryFields.map((field, index) => (
                    <div key={field.id} className="flex space-x-2">
                      <input {...register(`categories.${index}.name` as const)} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-2 text-white text-sm" placeholder="eg. Starter, Drinks" />
                      <button type="button" onClick={() => removeCategory(index)} className="text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-neutral-200">Products</h3>
                  <button type="button" onClick={() => appendProduct({ name: '', sellingPrice: 0 })} className="text-blue-400 text-sm hover:underline flex items-center"><Plus className="w-4 h-4 mr-1" /> Add</button>
                </div>
                <div className="space-y-2">
                  {productFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <input {...register(`products.${index}.name` as const)} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-2 text-white text-sm" placeholder="Product Name" />
                      </div>
                      <div className="col-span-3">
                        <input type="number" {...register(`products.${index}.sellingPrice` as const, { valueAsNumber: true })} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-2 text-white text-sm" placeholder="Price" />
                      </div>
                      <button type="button" onClick={() => removeProduct(index)} className="col-span-2 text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tables */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium text-neutral-200">Tables</h3>
                  <button type="button" onClick={() => appendTable({ name: '', floorName: '' })} className="text-blue-400 text-sm hover:underline flex items-center"><Plus className="w-4 h-4 mr-1" /> Add</button>
                </div>
                <div className="space-y-2">
                  {tableFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <input {...register(`tables.${index}.name` as const)} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-2 text-white text-sm" placeholder="T1, Table 1" />
                      </div>
                      <div className="col-span-4">
                        <input {...register(`tables.${index}.floorName` as const)} className="w-full bg-neutral-700/50 border border-neutral-600 rounded-xl p-2 text-white text-sm" placeholder="Floor 1, Ground Floor" />
                      </div>
                      <button type="button" onClick={() => removeTable(index)} className="col-span-2 text-red-400 p-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12 pt-6 border-t border-neutral-700/50">
            <button type="button" onClick={prevStep} className={`px-4 py-2 rounded-xl flex items-center ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-neutral-300 hover:bg-neutral-700/50'}`}>
              <ArrowLeft className="w-4 h-4 mr-2" /> back
            </button>
            <button type="button" onClick={nextStep} disabled={isSubmitting} className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl flex items-center disabled:opacity-50">
              {isSubmitting ? 'Completing...' : currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
