import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export type ColumnType = 'text' | 'number' | 'date'

const DATE_PATTERNS = [
  /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/,
  /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
  /^\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}$/,
  /^[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4}$/,
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
]

function looksLikeDate(val: unknown): boolean {
  if (val instanceof Date) return true
  const s = String(val ?? '').trim()
  if (!s) return false
  return DATE_PATTERNS.some(p => p.test(s)) || (!isNaN(Date.parse(s)) && s.length >= 6)
}

function looksLikeNumber(val: unknown): boolean {
  const s = String(val ?? '').trim()
  if (!s) return false
  return !isNaN(Number(s)) && s !== ''
}

function detectColumnTypes(
  headers: string[],
  rows: Record<string, unknown>[],
  xlsxCellTypes: Record<string, string>,
): Record<string, ColumnType> {
  const sample = rows.slice(0, 50)
  const types: Record<string, ColumnType> = {}

  for (const h of headers) {
    const nameLower = h.toLowerCase()
    const nameHintsDate = /(date|dt|timestamp|time|deadline|due|start|end|created|modified|scheduled)/i.test(nameLower)
    const nameHintsNumber = /(qty|quantity|count|number|num|amount|price|cost|total|percent|%|rate|score|id$)/i.test(nameLower)

    const values = sample.map(r => r[h]).filter(v => v !== '' && v != null)
    if (values.length === 0) { types[h] = 'text'; continue }

    if (xlsxCellTypes[h] === 'd') { types[h] = 'date'; continue }

    const dateCount = values.filter(looksLikeDate).length
    const numCount  = values.filter(looksLikeNumber).length
    const dateRatio = dateCount / values.length
    const numRatio  = numCount  / values.length

    if (nameHintsDate && dateRatio >= 0.6)        types[h] = 'date'
    else if (dateRatio >= 0.85)                   types[h] = 'date'
    else if (nameHintsNumber && numRatio >= 0.8)  types[h] = 'number'
    else if (numRatio >= 0.95 && !nameHintsDate)  types[h] = 'number'
    else                                          types[h] = 'text'
  }
  return types
}

// Excel date serial → ISO yyyy-mm-dd string
// Excel epoch: Dec 30, 1899 (with Lotus 1-2-3 leap-year bug baked in)
const EXCEL_EPOCH_MS = new Date(1899, 11, 30).getTime()
function excelSerialToISO(serial: number): string {
  const ms = EXCEL_EPOCH_MS + serial * 86400000
  const d = new Date(ms)
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// Is this an Excel serial that plausibly represents a date? (year 1950 – 2100)
function isPlausibleExcelSerial(n: number): boolean {
  return Number.isInteger(n) && n >= 18264 && n <= 73050
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false })
    const ws = wb.Sheets[wb.SheetNames[0]]
    if (!ws) return NextResponse.json({ error: 'Empty workbook' }, { status: 400 })

    // Collect cell types before sheet_to_json strips them
    const xlsxCellTypes: Record<string, string> = {}
    const ref = ws['!ref']
    if (ref) {
      const range = XLSX.utils.decode_range(ref)
      for (let c = range.s.c; c <= range.e.c; c++) {
        const hCell = ws[XLSX.utils.encode_cell({ r: range.s.r, c })]
        const dCell = ws[XLSX.utils.encode_cell({ r: range.s.r + 1, c })]
        if (hCell?.v != null && dCell?.t) xlsxCellTypes[String(hCell.v)] = dCell.t
      }
    }

    const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[]
    if (rawRows.length === 0) return NextResponse.json({ error: 'Sheet has no data rows' }, { status: 400 })

    const headers = Object.keys(rawRows[0])

    // First pass: detect types on raw data
    const columnTypes = detectColumnTypes(headers, rawRows, xlsxCellTypes)

    // Second pass: convert Excel date serials to ISO strings for date columns
    // A column gets serial conversion when:
    //   - detected as date, OR
    //   - XLSX cell type is 'n' but column name hints at date AND values are plausible serials
    const dateColumns = new Set(
      headers.filter(h => {
        if (columnTypes[h] === 'date') return true
        const nameHints = /(date|dt|deadline|due|start|end|created|modified|scheduled)/i.test(h)
        const sample = rawRows.slice(0, 10).map(r => r[h]).filter(v => v !== '' && v != null)
        const serialRatio = sample.length > 0
          ? sample.filter(v => typeof v === 'number' && isPlausibleExcelSerial(v as number)).length / sample.length
          : 0
        return nameHints && serialRatio >= 0.5
      })
    )

    const rows = rawRows.map(row => {
      const out: Record<string, unknown> = { ...row }
      for (const h of dateColumns) {
        const v = row[h]
        if (typeof v === 'number' && isPlausibleExcelSerial(v)) {
          out[h] = excelSerialToISO(v)
        }
      }
      return out
    })

    // Re-detect types after conversion so date columns show correctly in preview
    const finalTypes = detectColumnTypes(headers, rows, xlsxCellTypes)

    return NextResponse.json({ headers, rows, columnTypes: finalTypes })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Parse failed: ${msg}` }, { status: 500 })
  }
}
