-- =====================================================
-- POPULATE AIRLINES TABLE WITH TOP 50 WORLD AIRLINES
-- Based on fleet size, revenue, and global presence
-- =====================================================

-- Insert the top 50 airlines in the world
-- Using ON CONFLICT to avoid duplicates if run multiple times

INSERT INTO airlines (airline_name, airline_code, contact_email, phone) VALUES
-- Top US Airlines
('Delta Air Lines', 'DL', 'cargo@delta.com', '+1-800-221-1212'),
('United Airlines', 'UA', 'cargo@united.com', '+1-800-864-8331'),
('American Airlines', 'AA', 'cargo@aa.com', '+1-800-433-7300'),
('Southwest Airlines', 'WN', 'cargo@southwest.com', '+1-800-435-9792'),
('JetBlue Airways', 'B6', 'cargo@jetblue.com', '+1-800-538-2583'),
('Alaska Airlines', 'AS', 'cargo@alaskaair.com', '+1-800-252-7522'),
('Spirit Airlines', 'NK', 'cargo@spirit.com', '+1-801-401-2222'),
('Frontier Airlines', 'F9', 'cargo@flyfrontier.com', '+1-801-401-9000'),

-- European Airlines
('Lufthansa', 'LH', 'cargo@lufthansa.com', '+49-69-696-0'),
('Air France', 'AF', 'cargo@airfrance.fr', '+33-1-41-56-78-00'),
('KLM Royal Dutch Airlines', 'KL', 'cargo@klm.com', '+31-20-474-7747'),
('British Airways', 'BA', 'cargo@britishairways.com', '+44-844-493-0787'),
('Turkish Airlines', 'TK', 'cargo@turkishairlines.com', '+90-212-463-6363'),
('Ryanair', 'FR', 'cargo@ryanair.com', '+353-1-249-7791'),
('easyJet', 'U2', 'cargo@easyjet.com', '+44-330-365-5000'),
('Iberia', 'IB', 'cargo@iberia.com', '+34-901-111-500'),
('Alitalia', 'AZ', 'cargo@alitalia.com', '+39-06-65649'),
('Swiss International Air Lines', 'LX', 'cargo@swiss.com', '+41-848-700-700'),
('Austrian Airlines', 'OS', 'cargo@austrian.com', '+43-5-1766-1000'),
('Scandinavian Airlines', 'SK', 'cargo@sas.se', '+46-770-727-727'),
('TAP Air Portugal', 'TP', 'cargo@tap.pt', '+351-707-205-700'),
('Virgin Atlantic', 'VS', 'cargo@virgin-atlantic.com', '+44-344-209-7777'),

-- Asian Airlines
('China Southern Airlines', 'CZ', 'cargo@csair.com', '+86-95539'),
('China Eastern Airlines', 'MU', 'cargo@ceair.com', '+86-95530'),
('Air China', 'CA', 'cargo@airchina.com', '+86-95583'),
('Singapore Airlines', 'SQ', 'cargo@singaporeair.com', '+65-6223-8888'),
('Cathay Pacific', 'CX', 'cargo@cathaypacific.com', '+852-2747-3333'),
('Japan Airlines', 'JL', 'cargo@jal.com', '+81-3-5460-3121'),
('All Nippon Airways', 'NH', 'cargo@ana.co.jp', '+81-3-6735-1111'),
('Korean Air', 'KE', 'cargo@koreanair.com', '+82-2-2656-7000'),
('Asiana Airlines', 'OZ', 'cargo@flyasiana.com', '+82-2-2669-8000'),
('Thai Airways', 'TG', 'cargo@thaiairways.com', '+66-2-356-1111'),
('Malaysia Airlines', 'MH', 'cargo@malaysiaairlines.com', '+60-3-7843-3000'),
('Garuda Indonesia', 'GA', 'cargo@garuda-indonesia.com', '+62-21-2351-9999'),
('Philippine Airlines', 'PR', 'cargo@pal.com.ph', '+63-2-8855-8888'),
('Vietnam Airlines', 'VN', 'cargo@vietnamairlines.com', '+84-24-3832-0320'),
('IndiGo', '6E', 'cargo@goindigo.in', '+91-124-617-8888'),
('Air India', 'AI', 'cargo@airindia.in', '+91-11-2462-2220'),
('China Airlines', 'CI', 'cargo@china-airlines.com', '+886-2-412-9000'),
('EVA Air', 'BR', 'cargo@evaair.com', '+886-2-2501-1999'),

-- Middle Eastern Airlines
('Emirates', 'EK', 'cargo@emirates.com', '+971-4-214-4444'),
('Qatar Airways', 'QR', 'cargo@qatarairways.com', '+974-4023-0000'),
('Etihad Airways', 'EY', 'cargo@etihad.com', '+971-2-599-0000'),
('Saudi Arabian Airlines', 'SV', 'cargo@saudiairlines.com', '+966-920-005-777'),
('Kuwait Airways', 'KU', 'cargo@kuwaitairways.com', '+965-171'),
('Royal Jordanian', 'RJ', 'cargo@rj.com', '+962-6-510-0000'),

-- African Airlines
('Ethiopian Airlines', 'ET', 'cargo@ethiopianairlines.com', '+251-11-661-1474'),
('South African Airways', 'SA', 'cargo@flysaa.com', '+27-11-978-1111'),
('Kenya Airways', 'KQ', 'cargo@kenya-airways.com', '+254-20-327-4747'),
('EgyptAir', 'MS', 'cargo@egyptair.com', '+20-2-2267-4700'),

-- Latin American Airlines
('LATAM Airlines Group', 'LA', 'cargo@latam.com', '+56-2-2565-2525'),
('Azul Brazilian Airlines', 'AD', 'cargo@voeazul.com.br', '+55-11-4831-2200'),
('Gol Airlines', 'G3', 'cargo@voegol.com.br', '+55-11-2128-4000'),
('Copa Airlines', 'CM', 'cargo@copa.com', '+507-217-2672'),
('Avianca', 'AV', 'cargo@avianca.com', '+57-1-401-3434'),

-- Canadian Airlines
('Air Canada', 'AC', 'cargo@aircanada.ca', '+1-888-247-2262'),
('WestJet', 'WS', 'cargo@westjet.com', '+1-888-937-8538'),

-- Australian/Oceania Airlines
('Qantas', 'QF', 'cargo@qantas.com.au', '+61-13-13-13'),
('Virgin Australia', 'VA', 'cargo@virginaustralia.com', '+61-13-67-89'),
('Jetstar Airways', 'JQ', 'cargo@jetstar.com', '+61-3-9645-5999'),
('Air New Zealand', 'NZ', 'cargo@airnewzealand.co.nz', '+64-9-357-3000')

-- Handle conflicts by updating existing records
ON CONFLICT (airline_code) DO UPDATE SET
    airline_name = EXCLUDED.airline_name,
    contact_email = EXCLUDED.contact_email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Check the inserted data
SELECT 
    airline_name, 
    airline_code, 
    contact_email,
    created_at
FROM airlines 
ORDER BY airline_name;

-- Count total airlines
SELECT COUNT(*) as total_airlines FROM airlines;

-- =====================================================
-- ADDITIONAL CARGO/FREIGHT AIRLINES
-- =====================================================

-- These are major cargo-focused airlines that might be useful
-- Uncomment if you want to include dedicated cargo airlines

/*
INSERT INTO airlines (airline_name, airline_code, contact_email, phone) VALUES
('FedEx Express', 'FX', 'customer@fedex.com', '+1-800-463-3339'),
('UPS Airlines', '5X', 'customer@ups.com', '+1-800-742-5877'),
('DHL Aviation', 'D0', 'customer@dhl.com', '+49-228-182-0'),
('Atlas Air', 'GT', 'customer@atlasair.com', '+1-914-701-8000'),
('Kalitta Air', 'K4', 'ops@kalittaair.com', '+1-734-484-8888'),
('Polar Air Cargo', 'PO', 'customer@polaraircargo.com', '+1-914-701-8182'),
('Southern Air', '9S', 'customer@southernair.com', '+1-203-413-2000'),
('Cargolux', 'CV', 'customer@cargolux.com', '+352-4211-3691'),
('Nippon Cargo Airlines', 'KZ', 'customer@nca.aero', '+81-3-5756-8800'),
('Cathay Pacific Cargo', 'CX', 'cargo@cathaypacific.com', '+852-2747-3333')
ON CONFLICT (airline_code) DO UPDATE SET
    airline_name = EXCLUDED.airline_name,
    contact_email = EXCLUDED.contact_email,
    phone = EXCLUDED.phone,
    updated_at = NOW();
*/

