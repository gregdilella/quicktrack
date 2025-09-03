export type VehicleType = 'CAR_SUV_MINVAN' | 'CARGO_VAN' | string

export interface NetjetsQuoteInput {
  weightlbs: number
  pieces: number
  shipperstate?: string | null
  consigneestate?: string | null
  Originalshippermiles?: number | null
  PickUpVehicleType?: VehicleType | null
  shippercity?: string | null
  flightorigenmerge?: string | null
  FlightTenderered?: Date | null
  pickupdate?: Date | null
  Originalconsigneemiles?: number | null
  deliverydate?: Date | null
  FlightRecovery?: Date | null
  mawbmerge?: string | null // comma separated
  isDangerousGoods?: boolean // DG flag instead of servicetype
  ATD?: number | null // arrival to destination? kept for parity; ATP is intentionally removed
}

export interface NetjetsQuoteBreakdown {
  NF: number
  PP: number
  NCUS: number
  MP: number
  WT: number
  MD: number
  AH: number
  NFT: number
  DG: number
  TFM: number
  SSC: number
  FS: number
  subtotal: number
  total: number
}

function calculateNF(weight: number): number {
  if (weight >= 1 && weight <= 10) return 106
  if (weight >= 11 && weight <= 25) return 126
  if (weight >= 26 && weight <= 50) return 135
  if (weight >= 51 && weight <= 70) return 156
  if (weight >= 71 && weight <= 100) return 169
  // Always include NF - default to lowest tier if weight is 0 or invalid
  return 106
}

function isIn(list: string[] | undefined, v?: string | null): boolean {
  if (!v) return false
  return !!list?.includes(v.toUpperCase())
}

function normalizeVehicle(v?: VehicleType | null): 'CAR_SUV_MINVAN' | 'CARGO_VAN' {
  return v === 'CARGO_VAN' ? 'CARGO_VAN' : 'CAR_SUV_MINVAN'
}

function hoursBetween(a?: Date | null, b?: Date | null): number {
  if (!a || !b) return 0
  const diffMs = a.getTime() - b.getTime()
  return diffMs / 3600000
}

function isOutsideBusinessHours(date?: Date | null): boolean {
  if (!date) return false
  const hour = date.getHours()
  return hour < 8 || hour >= 18 // Outside 8 AM - 6 PM
}

export function computeNetjetsQuote(input: NetjetsQuoteInput): NetjetsQuoteBreakdown {
  const weight = Number(input.weightlbs || 0)
  const pieces = Number(input.pieces || 0)
  const shipperMilesOrig = Number(input.Originalshippermiles || 0)
  const consigneeMilesOrig = Number(input.Originalconsigneemiles || 0)
  const vehicle = normalizeVehicle(input.PickUpVehicleType || 'CAR_SUV_MINVAN')

  const NF = calculateNF(weight)

  // PP
  let PP = 0
  if (pieces > 1) {
    const akHiExtra = isIn(['AK', 'HI'], input.shipperstate) || isIn(['AK', 'HI'], input.consigneestate)
    PP = (akHiExtra ? 141 : 86) * (pieces - 1)
  }

  // NCUS
  const NCUS = (isIn(['AK', 'HI', 'PR'], input.shipperstate) || isIn(['AK', 'HI', 'PR'], input.consigneestate)) ? 60 : 0

  // MP (shipper miles pickup)
  const shipperMiles = (!shipperMilesOrig || Number.isNaN(shipperMilesOrig)) ? 0 : shipperMilesOrig
  let MP = 0
  if (shipperMiles > 20) {
    MP = (vehicle === 'CARGO_VAN') ? (shipperMiles - 20) * 2.50 : (shipperMiles - 20) * 1.82
  }
  if ((input.shippercity || '').toUpperCase() === 'CARLSTADT' && (input.flightorigenmerge || '').toUpperCase().includes('LGA')) {
    MP = 0
  }

  // WT (waiting time) - removed for quoting as it can't be known upfront
  const WT = 0

  // MD (consignee miles delivery)
  const consigneeMiles = (!consigneeMilesOrig || Number.isNaN(consigneeMilesOrig)) ? 0 : consigneeMilesOrig
  let MD = 0
  if (consigneeMiles > 20) {
    MD = (vehicle === 'CARGO_VAN') ? (consigneeMiles - 20) * 2.50 : (consigneeMiles - 20) * 1.82
  }

  // AH (After Hours) - $50 for each pickup/delivery outside 8 AM - 6 PM
  let AH = 0
  if (isOutsideBusinessHours(input.pickupdate)) AH += 50
  if (isOutsideBusinessHours(input.deliverydate)) AH += 50

  // NFT: 117 if more than one unique MAWB
  let NFT = 0
  if (input.mawbmerge) {
    const tokens = String(input.mawbmerge).split(',').map(s => s.trim()).filter(Boolean)
    const unique = new Set(tokens)
    if (unique.size > 1) NFT = 117
  }

  // DG surcharge
  const DG = input.isDangerousGoods ? 103 : 0

  // TFM: remove any use of ATP; only consider ATD
  let TFM = 0
  if (Number(input.ATD || 0) !== 0) {
    TFM = 1.82 * consigneeMiles
  }

  // CAS not provided in algorithm context; treat as 0
  const CAS = 0

  const baseSum = NF + MP + WT + MD + AH + PP + NFT + CAS + NCUS + DG + TFM
  const SSC = Math.round(baseSum * 0.06 * 100) / 100
  const FS = Math.round(baseSum * 0.10 * 100) / 100
  const subtotal = Math.round(baseSum * 100) / 100
  const total = Math.round((subtotal + SSC + FS) * 100) / 100

  return { NF, PP, NCUS, MP, WT, MD, AH, NFT, DG, TFM, SSC, FS, subtotal, total }
}

// Helper to build initial input from a lightweight job form object
export function buildNetjetsInputFromJobForm(jobForm: any): NetjetsQuoteInput {
  return {
    weightlbs: Number(jobForm?.weight ?? 0),
    pieces: Number(jobForm?.pieces ?? 0),
    shipperstate: jobForm?.shipper_state || jobForm?.shipper_state?.toUpperCase?.() || jobForm?.shipper_state,
    consigneestate: jobForm?.consignee_state || jobForm?.consignee_state?.toUpperCase?.() || jobForm?.consignee_state,
    Originalshippermiles: Number(jobForm?.shipper_miles ?? 0),
    PickUpVehicleType: jobForm?.vehicle_type || 'CAR_SUV_MINVAN',
    shippercity: jobForm?.shipper_city || jobForm?.shippercity,
    flightorigenmerge: jobForm?.origin_airport || '',
    FlightTenderered: jobForm?.flight_tendered ? new Date(jobForm.flight_tendered) : null,
    pickupdate: jobForm?.pickup_time ? new Date(jobForm.pickup_time) : null,
    Originalconsigneemiles: Number(jobForm?.consignee_miles ?? 0),
    deliverydate: jobForm?.delivery_time ? new Date(jobForm.delivery_time) : null,
    FlightRecovery: jobForm?.flight_recovery ? new Date(jobForm.flight_recovery) : null,
    mawbmerge: jobForm?.mawbmerge || jobForm?.mawbs || '',
    isDangerousGoods: Boolean(jobForm?.is_dangerous_goods || jobForm?.isDangerousGoods),
    ATD: Number(jobForm?.ATD ?? 0)
  }
}

// Save quote breakdown to quotes table
export async function saveQuoteToDatabase(supabase: any, jobnumber: string, breakdown: NetjetsQuoteBreakdown): Promise<{ success: boolean; error?: string }> {
  try {
    const quoteItems = [
      { jobnumber, chargecode: 'NF', charge: breakdown.NF },
      { jobnumber, chargecode: 'PP', charge: breakdown.PP },
      { jobnumber, chargecode: 'NCUS', charge: breakdown.NCUS },
      { jobnumber, chargecode: 'MP', charge: breakdown.MP },
      { jobnumber, chargecode: 'WT', charge: breakdown.WT },
      { jobnumber, chargecode: 'MD', charge: breakdown.MD },
      { jobnumber, chargecode: 'AH', charge: breakdown.AH },
      { jobnumber, chargecode: 'NFT', charge: breakdown.NFT },
      { jobnumber, chargecode: 'DG', charge: breakdown.DG },
      { jobnumber, chargecode: 'TFM', charge: breakdown.TFM },
      { jobnumber, chargecode: 'SSC', charge: breakdown.SSC },
      { jobnumber, chargecode: 'FS', charge: breakdown.FS },
      { jobnumber, chargecode: 'TOTAL', charge: breakdown.total }
    ].filter(item => item.charge > 0) // Only save non-zero charges

    const { error } = await supabase
      .from('quotes')
      .insert(quoteItems)

    if (error) {
      console.error('Error saving quote:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Error in saveQuoteToDatabase:', err)
    return { success: false, error: 'Failed to save quote' }
  }
}

/**
 * Create a basic quote for a new job when detailed flight data isn't available
 * This ensures every job has at least a basic quote that can be updated later
 */
export function createBasicQuote(jobData: any): NetjetsQuoteBreakdown {
  const weight = Number(jobData?.weight || 0)
  const pieces = Number(jobData?.pieces || 1)
  
  // Create basic quote input with minimal data
  const basicInput: NetjetsQuoteInput = {
    weightlbs: weight,
    pieces: pieces,
    shipperstate: jobData?.shipper_state || null,
    consigneestate: jobData?.consignee_state || null,
    Originalshippermiles: 0, // Default to 0 since we don't have route data
    PickUpVehicleType: 'CAR_SUV_MINVAN', // Default vehicle type
    shippercity: jobData?.shipper_city || null,
    flightorigenmerge: null,
    FlightTenderered: null,
    pickupdate: null,
    Originalconsigneemiles: 0, // Default to 0 since we don't have route data
    deliverydate: null,
    FlightRecovery: null,
    mawbmerge: null,
    isDangerousGoods: false, // Default to false
    ATD: 0
  }
  
  return computeNetjetsQuote(basicInput)
}

/**
 * Ensures every job has a quote - either the provided detailed quote or a basic one
 */
export async function ensureJobHasQuote(
  supabase: any, 
  jobnumber: string, 
  jobData: any, 
  existingQuote?: NetjetsQuoteBreakdown | null
): Promise<{ success: boolean; error?: string; quoteType: 'detailed' | 'basic' }> {
  try {
    let quoteToSave: NetjetsQuoteBreakdown
    let quoteType: 'detailed' | 'basic'
    
    if (existingQuote && existingQuote.total > 0) {
      // Use the detailed quote if available
      quoteToSave = existingQuote
      quoteType = 'detailed'
      console.log('💰 Using detailed quote for job:', jobnumber)
    } else {
      // Create a basic quote
      quoteToSave = createBasicQuote(jobData)
      quoteType = 'basic'
      console.log('💰 Creating basic quote for job:', jobnumber, 'Total:', quoteToSave.total)
    }
    
    const result = await saveQuoteToDatabase(supabase, jobnumber, quoteToSave)
    return { ...result, quoteType }
  } catch (error) {
    console.error('Error in ensureJobHasQuote:', error)
    return { success: false, error: 'Failed to ensure job has quote', quoteType: 'basic' }
  }
}


