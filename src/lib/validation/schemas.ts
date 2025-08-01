import { z } from 'zod'

// Helper schemas for reusable validation patterns
const nonEmptyString = z.string().trim().min(1, 'This field is required')
const optionalString = z.string().trim().optional().or(z.literal(''))
const optionalStringWithMax = (max: number, field: string) => 
  z.string().trim().max(max, `${field} must be less than ${max} characters`).optional().or(z.literal(''))
const phoneNumber = z.string().regex(/^[\d\s\-\(\)\+\.]*$/, 'Please enter a valid phone number').optional().or(z.literal(''))
const zipCode = z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code (12345 or 12345-6789)').optional().or(z.literal(''))
const stateCode = z.string().length(2, 'State must be 2 characters').toUpperCase().optional().or(z.literal(''))

// Job validation schema
export const jobSchema = z.object({
  // Job identification
  job_number: z.string().min(1, 'Job number is required'),
  jobno: z.string().min(1, 'Job number with type is required'),
  bol_number: optionalString,
  po_number: optionalString,
  
  // Job details
  commodity: nonEmptyString.max(100, 'Commodity must be less than 100 characters'),
  pieces: z.coerce.number().int('Pieces must be a whole number').min(1, 'Pieces must be at least 1'),
  weight: z.coerce.number().min(0.1, 'Weight must be greater than 0'),
  service_type: z.enum(['NFO', 'NDO', 'OBC', 'Charter']),
  job_type: z.enum(['Call', 'Email', 'Web']),
  
  // Shipper information
  shipper_name: nonEmptyString.max(100, 'Shipper name must be less than 100 characters'),
  shipper_address1: optionalStringWithMax(100, 'Address line 1'),
  shipper_address2: optionalStringWithMax(100, 'Address line 2'),
  shipper_city: optionalStringWithMax(50, 'City'),
  shipper_state: stateCode,
  shipper_zip: zipCode,
  shipper_phone: phoneNumber,
  shipper_contact: optionalStringWithMax(50, 'Contact name'),
  
  // Consignee information
  consignee_name: nonEmptyString.max(100, 'Consignee name must be less than 100 characters'),
  consignee_address1: optionalStringWithMax(100, 'Address line 1'),
  consignee_address2: optionalStringWithMax(100, 'Address line 2'),
  consignee_city: optionalStringWithMax(50, 'City'),
  consignee_state: stateCode,
  consignee_zip: zipCode,
  consignee_phone: phoneNumber,
  consignee_contact: optionalStringWithMax(50, 'Contact name'),
  
  // Scheduling
  ready_date: z.string().optional().or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true
      // Simple date format validation - accept any valid date
      const date = new Date(val)
      return !isNaN(date.getTime())
    }, 'Please enter a valid date'),
  ready_time: z.string().optional().or(z.literal(''))
    .refine((val) => {
      if (!val || val === '') return true
      return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(val)
    }, 'Please enter a valid time in HH:MM format')
})

// Type inference for TypeScript
export type JobFormData = z.infer<typeof jobSchema>

// User validation schema (for user management)
export const userSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  first_name: nonEmptyString.max(50, 'First name must be less than 50 characters'),
  last_name: nonEmptyString.max(50, 'Last name must be less than 50 characters'),
  role: z.enum(['admin', 'management', 'operations', 'lsp', 'customer'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

export type UserFormData = z.infer<typeof userSchema>

// Customer validation schema
export const customerSchema = z.object({
  name: nonEmptyString.max(100, 'Customer name must be less than 100 characters'),
  contact_email: z.string().email('Please enter a valid email address'),
  contact_phone: phoneNumber,
  address1: optionalStringWithMax(100, 'Address line 1'),
  address2: optionalStringWithMax(100, 'Address line 2'),
  city: optionalStringWithMax(50, 'City'),
  state: stateCode,
  zip: zipCode,
  billing_contact: optionalStringWithMax(50, 'Billing contact'),
  payment_terms: z.enum(['NET_30', 'NET_60', 'COD', 'PREPAID']).optional()
})

export type CustomerFormData = z.infer<typeof customerSchema>

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
})

export type LoginFormData = z.infer<typeof loginSchema>

// Utility function to get user-friendly error messages
export function getValidationErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  
  error.issues.forEach((err) => {
    const path = err.path.join('.')
    errors[path] = err.message
  })
  
  return errors
}

// Utility function to validate and return formatted errors
export function validateForm<T>(schema: z.ZodSchema<T>, data: any): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { 
    success: false, 
    errors: getValidationErrors(result.error) 
  }
} 