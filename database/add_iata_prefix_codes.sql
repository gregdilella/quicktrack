-- =====================================================
-- ADD IATA PREFIX CODES TO AIRLINES TABLE
-- IATA 3-digit accounting codes for airline identification
-- =====================================================

-- Add the iata_prefix column to the airlines table
ALTER TABLE airlines ADD COLUMN IF NOT EXISTS iata_prefix VARCHAR(3);

-- Update airlines table with IATA prefix codes
-- These are the official IATA 3-digit accounting codes used for ticketing and accounting

UPDATE airlines SET iata_prefix = CASE
    -- North American Airlines
    WHEN airline_code = 'AA' THEN '001'  -- American Airlines
    WHEN airline_code = 'UA' THEN '016'  -- United Airlines (Note: 229 is also used)
    WHEN airline_code = 'DL' THEN '006'  -- Delta Air Lines
    WHEN airline_code = 'WN' THEN '526'  -- Southwest Airlines
    WHEN airline_code = 'B6' THEN '279'  -- JetBlue Airways
    WHEN airline_code = 'AS' THEN '027'  -- Alaska Airlines
    WHEN airline_code = 'NK' THEN '487'  -- Spirit Airlines
    WHEN airline_code = 'F9' THEN '422'  -- Frontier Airlines
    WHEN airline_code = 'AC' THEN '014'  -- Air Canada
    WHEN airline_code = 'WS' THEN '838'  -- WestJet
    
    -- European Airlines
    WHEN airline_code = 'LH' THEN '220'  -- Lufthansa
    WHEN airline_code = 'AF' THEN '057'  -- Air France
    WHEN airline_code = 'KL' THEN '074'  -- KLM Royal Dutch Airlines
    WHEN airline_code = 'BA' THEN '125'  -- British Airways
    WHEN airline_code = 'TK' THEN '235'  -- Turkish Airlines
    WHEN airline_code = 'FR' THEN '053'  -- Ryanair
    WHEN airline_code = 'U2' THEN '888'  -- easyJet
    WHEN airline_code = 'IB' THEN '075'  -- Iberia
    WHEN airline_code = 'AZ' THEN '055'  -- Alitalia
    WHEN airline_code = 'LX' THEN '724'  -- Swiss International Air Lines
    WHEN airline_code = 'OS' THEN '257'  -- Austrian Airlines
    WHEN airline_code = 'SK' THEN '117'  -- Scandinavian Airlines
    WHEN airline_code = 'TP' THEN '047'  -- TAP Air Portugal
    WHEN airline_code = 'VS' THEN '932'  -- Virgin Atlantic
    
    -- Asian Airlines
    WHEN airline_code = 'CZ' THEN '784'  -- China Southern Airlines
    WHEN airline_code = 'CA' THEN '999'  -- Air China
    WHEN airline_code = 'MU' THEN '781'  -- China Eastern Airlines
    WHEN airline_code = 'NH' THEN '205'  -- All Nippon Airways
    WHEN airline_code = 'JL' THEN '131'  -- Japan Airlines
    WHEN airline_code = 'SQ' THEN '618'  -- Singapore Airlines
    WHEN airline_code = 'CX' THEN '160'  -- Cathay Pacific
    WHEN airline_code = 'KE' THEN '180'  -- Korean Air
    WHEN airline_code = 'OZ' THEN '988'  -- Asiana Airlines
    WHEN airline_code = 'TG' THEN '217'  -- Thai Airways
    WHEN airline_code = 'VN' THEN '738'  -- Vietnam Airlines
    WHEN airline_code = 'MH' THEN '232'  -- Malaysia Airlines
    WHEN airline_code = 'GA' THEN '126'  -- Garuda Indonesia
    WHEN airline_code = 'PR' THEN '079'  -- Philippine Airlines
    WHEN airline_code = 'CI' THEN '297'  -- China Airlines (Taiwan)
    WHEN airline_code = 'BR' THEN '695'  -- EVA Air
    WHEN airline_code = 'HX' THEN '851'  -- Hong Kong Airlines
    WHEN airline_code = 'AI' THEN '098'  -- Air India
    WHEN airline_code = '6E' THEN '489'  -- IndiGo
    
    -- Middle Eastern Airlines
    WHEN airline_code = 'EK' THEN '176'  -- Emirates
    WHEN airline_code = 'QR' THEN '157'  -- Qatar Airways
    WHEN airline_code = 'EY' THEN '607'  -- Etihad Airways
    WHEN airline_code = 'MS' THEN '077'  -- EgyptAir
    WHEN airline_code = 'RJ' THEN '512'  -- Royal Jordanian
    WHEN airline_code = 'SV' THEN '065'  -- Saudi Arabian Airlines
    WHEN airline_code = 'GF' THEN '072'  -- Gulf Air
    WHEN airline_code = 'WY' THEN '910'  -- Oman Air
    WHEN airline_code = 'IY' THEN '635'  -- Yemenia
    
    -- African Airlines
    WHEN airline_code = 'SA' THEN '083'  -- South African Airways
    WHEN airline_code = 'ET' THEN '071'  -- Ethiopian Airlines
    WHEN airline_code = 'KQ' THEN '706'  -- Kenya Airways
    WHEN airline_code = 'AT' THEN '091'  -- Royal Air Maroc
    WHEN airline_code = 'UU' THEN '826'  -- Air Austral
    WHEN airline_code = 'MK' THEN '635'  -- Air Mauritius
    WHEN airline_code = 'AH' THEN '124'  -- Air Algerie
    WHEN airline_code = 'TU' THEN '199'  -- Tunisair
    
    -- Latin American Airlines
    WHEN airline_code = 'LA' THEN '045'  -- LATAM Airlines Group
    WHEN airline_code = 'AD' THEN '121'  -- Azul Brazilian Airlines
    WHEN airline_code = 'G3' THEN '127'  -- Gol Airlines
    WHEN airline_code = 'CM' THEN '230'  -- Copa Airlines
    WHEN airline_code = 'AV' THEN '134'  -- Avianca
    WHEN airline_code = 'AR' THEN '044'  -- Aerolineas Argentinas
    WHEN airline_code = 'AM' THEN '139'  -- Aeromexico
    WHEN airline_code = 'JJ' THEN '956'  -- TAM Airlines (now part of LATAM)
    
    -- Oceania Airlines
    WHEN airline_code = 'QF' THEN '081'  -- Qantas Airways
    WHEN airline_code = 'VA' THEN '795'  -- Virgin Australia
    WHEN airline_code = 'JQ' THEN '507'  -- Jetstar Airways
    WHEN airline_code = 'NZ' THEN '086'  -- Air New Zealand
    
    -- Cargo Airlines
    WHEN airline_code = 'FX' THEN '023'  -- FedEx Express
    WHEN airline_code = '5X' THEN '406'  -- UPS Airlines
    WHEN airline_code = 'D0' THEN '423'  -- DHL Aviation
    WHEN airline_code = 'GT' THEN '369'  -- Atlas Air
    WHEN airline_code = 'K4' THEN '808'  -- Kalitta Air
    WHEN airline_code = 'CK' THEN '423'  -- China Cargo Airlines
    WHEN airline_code = '9S' THEN '172'  -- Southern Air (now part of Atlas Air)
    
    -- Low-Cost Carriers
    WHEN airline_code = 'VX' THEN '984'  -- Virgin America (now part of Alaska)
    WHEN airline_code = 'SY' THEN '635'  -- Sun Country Airlines
    WHEN airline_code = 'G4' THEN '401'  -- Allegiant Air
    WHEN airline_code = 'HA' THEN '173'  -- Hawaiian Airlines
    
    -- Regional Airlines (common ones)
    WHEN airline_code = 'YX' THEN '460'  -- Republic Airways
    WHEN airline_code = 'OH' THEN '683'  -- PSA Airlines
    WHEN airline_code = 'MQ' THEN '650'  -- Envoy Air (American Eagle)
    WHEN airline_code = 'DH' THEN '683'  -- Independence Air
    WHEN airline_code = 'EV' THEN '825'  -- ExpressJet
    WHEN airline_code = 'YV' THEN '460'  -- Mesa Airlines
    
    -- Additional International Airlines
    WHEN airline_code = 'LO' THEN '080'  -- LOT Polish Airlines
    WHEN airline_code = 'OK' THEN '064'  -- Czech Airlines
    WHEN airline_code = 'RO' THEN '281'  -- TAROM Romanian Air Transport
    WHEN airline_code = 'BT' THEN '657'  -- airBaltic
    WHEN airline_code = 'AY' THEN '105'  -- Finnair
    WHEN airline_code = 'DY' THEN '196'  -- Norwegian Air Shuttle
    WHEN airline_code = 'WF' THEN '050'  -- Wideroe
    WHEN airline_code = 'FI' THEN '195'  -- Icelandair
    WHEN airline_code = 'GL' THEN '631'  -- Air Greenland
    
    -- Russian and CIS Airlines
    WHEN airline_code = 'SU' THEN '555'  -- Aeroflot
    WHEN airline_code = 'S7' THEN '421'  -- S7 Airlines
    WHEN airline_code = 'UT' THEN '888'  -- UTair Aviation
    WHEN airline_code = 'KC' THEN '465'  -- Air Astana
    WHEN airline_code = 'HY' THEN '298'  -- Uzbekistan Airways
    WHEN airline_code = 'B2' THEN '673'  -- Belavia
    
    ELSE NULL  -- For any airlines not in this list
END
WHERE iata_prefix IS NULL;

-- Verify the updates
SELECT 
    airline_name,
    airline_code,
    iata_prefix,
    CASE 
        WHEN iata_prefix IS NULL THEN 'Missing IATA Prefix'
        ELSE 'Updated'
    END as status
FROM airlines
ORDER BY 
    CASE WHEN iata_prefix IS NULL THEN 1 ELSE 0 END,
    airline_name;

-- Count statistics
SELECT 
    COUNT(*) as total_airlines,
    COUNT(iata_prefix) as airlines_with_prefix,
    COUNT(*) - COUNT(iata_prefix) as airlines_missing_prefix
FROM airlines;

-- Show any airlines that still need IATA prefix codes
SELECT 
    airline_name,
    airline_code,
    'Missing IATA Prefix Code' as note
FROM airlines 
WHERE iata_prefix IS NULL
ORDER BY airline_name;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. IATA prefix codes are 3-digit accounting codes used for ticketing
-- 2. Some airlines may have multiple codes or changed codes over time
-- 3. New airlines or recent mergers may not have established codes yet
-- 4. For missing codes, check the official IATA Airline Coding Directory
-- 5. Some regional airlines may share codes with their parent companies
-- =====================================================
