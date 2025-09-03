# IATA Prefix Codes Reference

## What are IATA Prefix Codes?

IATA (International Air Transport Association) prefix codes are **3-digit numerical codes** assigned to airlines for accounting and ticketing purposes. These codes are used in:

- **Ticket numbering**: All airline tickets start with the airline's prefix code
- **Accounting systems**: For financial transactions between airlines
- **Cargo documentation**: AWB (Air Waybill) numbers
- **Interline billing**: When passengers travel on multiple airlines

## Format

- **Length**: Exactly 3 digits
- **Range**: 001-999
- **Usage**: Prefix for ticket numbers (e.g., 001-1234567890 for American Airlines)

## Key Airlines in Our Database

### Major North American Airlines
| Airline | IATA Code | Prefix | Example Ticket |
|---------|-----------|---------|----------------|
| American Airlines | AA | 001 | 001-1234567890 |
| United Airlines | UA | 016 | 016-1234567890 |
| Delta Air Lines | DL | 006 | 006-1234567890 |
| Southwest Airlines | WN | 526 | 526-1234567890 |
| Air Canada | AC | 014 | 014-1234567890 |

### Major European Airlines
| Airline | IATA Code | Prefix | Example Ticket |
|---------|-----------|---------|----------------|
| Lufthansa | LH | 220 | 220-1234567890 |
| Air France | AF | 057 | 057-1234567890 |
| KLM | KL | 074 | 074-1234567890 |
| British Airways | BA | 125 | 125-1234567890 |
| Turkish Airlines | TK | 235 | 235-1234567890 |

### Major Asian Airlines
| Airline | IATA Code | Prefix | Example Ticket |
|---------|-----------|---------|----------------|
| Singapore Airlines | SQ | 618 | 618-1234567890 |
| Cathay Pacific | CX | 160 | 160-1234567890 |
| Emirates | EK | 176 | 176-1234567890 |
| Japan Airlines | JL | 131 | 131-1234567890 |
| All Nippon Airways | NH | 205 | 205-1234567890 |

### Major Cargo Airlines
| Airline | IATA Code | Prefix | Example AWB |
|---------|-----------|---------|-------------|
| FedEx Express | FX | 023 | 023-12345678 |
| UPS Airlines | 5X | 406 | 406-12345678 |
| DHL Aviation | D0 | 423 | 423-12345678 |

## Important Notes

1. **Uniqueness**: Each prefix is unique to one airline globally
2. **Historical Changes**: Some airlines have changed prefixes due to mergers or acquisitions
3. **Regional Variations**: Some airlines may have different prefixes for different regions
4. **New Airlines**: New airlines receive new prefix codes from IATA
5. **Mergers**: When airlines merge, they may adopt one of the existing prefixes

## Database Implementation

The `iata_prefix` column has been added to the `airlines` table with:
- **Type**: VARCHAR(3)
- **Nullable**: Yes (for airlines without assigned codes)
- **Usage**: For generating AWB numbers, ticket references, and accounting

## Common Use Cases in Our System

1. **AWB Generation**: Create Air Waybill numbers using airline prefix + sequential number
2. **Ticket References**: Generate ticket-like reference numbers for bookings
3. **Accounting**: Match financial transactions to specific airlines
4. **Reporting**: Group transactions by airline using standardized codes
5. **Integration**: Interface with other airline systems using standard prefixes

## Data Sources

- **Official Source**: IATA Airline Coding Directory
- **Updates**: Codes are updated periodically by IATA
- **Verification**: Always verify codes with official IATA sources for critical applications

## Maintenance

- **Regular Updates**: Check for new airline codes quarterly
- **Merger Tracking**: Update codes when airlines merge or change
- **New Airlines**: Add codes for new airlines as they receive IATA assignments
- **Validation**: Ensure all active airlines have valid prefix codes

---

*Last Updated: 2024*
*Source: IATA Airline Coding Directory and industry standards*
