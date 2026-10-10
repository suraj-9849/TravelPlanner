import type { Guide, TripPlanResponse } from '../lib/types'
import { formatDate, prettyValue } from './format'

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const INK = '0.145 0.137 0.122'
const MUTED = '0.435 0.427 0.4'
const PAPER = '0.969 0.965 0.949'
const LINE = '0.835 0.827 0.78'
const LIME = '0.835 0.937 0.384'
const OLIVE = '0.482 0.502 0.388'

type Page = { commands: string[]; y: number; first: boolean }

function wrap(value: string, width: number) {
  const words = value.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if (!word) continue
    if (line && line.length + word.length + 1 > width) {
      lines.push(line)
      line = word
    } else {
      line = line ? line + ' ' + word : word
    }
  }
  if (line) lines.push(line)
  return lines
}

function pdfSafe(value: string) {
  return value.replace(/[^\x20-\x7E]/g, '').replace(/[\\()]/g, '\\$&')
}

function text(
  page: Page,
  value: string,
  x: number,
  y: number,
  font: string,
  size: number,
  color = INK,
) {
  page.commands.push(
    `${color} rg BT /${font} ${size} Tf ${x} ${y} Td (${pdfSafe(value)}) Tj ET`,
  )
}

function rect(
  page: Page,
  x: number,
  y: number,
  width: number,
  height: number,
  color: string,
  radius = 0,
) {
  if (radius) {
    const r = Math.min(radius, width / 2, height / 2)
    const k = 0.5522848
    page.commands.push(
      `${color} rg ${x + r} ${y} m ${x + width - r} ${y} l ${x + width - r + r * k} ${y} ${x + width} ${y + r - r * k} ${x + width} ${y + r} c ${x + width} ${y + height - r} l ${x + width} ${y + height - r + r * k} ${x + width - r + r * k} ${y + height} ${x + width - r} ${y + height} c ${x + r} ${y + height} l ${x + r - r * k} ${y + height} ${x} ${y + height - r + r * k} ${x} ${y + height - r} c ${x} ${y + r} l ${x} ${y + r - r * k} ${x + r - r * k} ${y} ${x + r} ${y} c f`,
    )
  } else {
    page.commands.push(`${color} rg ${x} ${y} ${width} ${height} re f`)
  }
}

function line(
  page: Page,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color = LINE,
) {
  page.commands.push(`${color} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S`)
}

function circle(
  page: Page,
  x: number,
  y: number,
  radius: number,
  color: string,
) {
  const k = 0.5522848
  page.commands.push(
    `${color} rg ${x + radius} ${y} m ${x + radius} ${y + radius * k} ${x + radius * k} ${y + radius} ${x} ${y + radius} c ${x - radius * k} ${y + radius} ${x - radius} ${y + radius * k} ${x - radius} ${y} c ${x - radius} ${y - radius * k} ${x - radius * k} ${y - radius} ${x} ${y - radius} c ${x + radius * k} ${y - radius} ${x + radius} ${y - radius * k} ${x + radius} ${y} c f`,
  )
}

function newPage(first: boolean, destination: string) {
  const page: Page = { commands: [], y: first ? 674 : 748, first }
  rect(page, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, PAPER)
  if (first) {
    circle(page, 48, 794, 6, LIME)
    text(page, 'w', 44, 790, 'F2', 11, INK)
    text(page, 'wayfarer', 64, 790, 'F4', 12, INK)
    text(page, 'TRAVEL NOTES / 2026', 434, 790, 'F4', 7, OLIVE)
    line(page, 42, 774, 553, 774, INK)
    text(page, 'TRIP ITINERARY', 42, 720, 'F4', 8, OLIVE)
    text(page, destination, 42, 681, 'F3', 35, INK)
  } else {
    circle(page, 48, 814, 5, LIME)
    text(page, 'w', 45, 811, 'F2', 9, INK)
    text(page, 'wayfarer', 64, 810, 'F4', 11, INK)
    text(page, destination, 450, 810, 'F3', 10, INK)
    line(page, 42, 794, 553, 794, INK)
  }
  return page
}

function sectionLabel(page: Page, value: string) {
  text(page, value.toUpperCase(), 42, page.y, 'F4', 8, OLIVE)
  page.y -= 16
}

function values(value: unknown) {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object') return Object.values(value)
  return value ? [value] : []
}

function entryText(value: unknown) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const item = value as Record<string, unknown>
    if (item.name) {
      const detail = item.type || item.cuisine
      return detail ? `${item.name} - ${detail}` : String(item.name)
    }
  }
  return prettyValue(value)
}

function addFooter(page: Page, index: number, total: number) {
  line(page, 42, 34, 553, 34)
  text(page, 'wayfarer - plan with curiosity', 42, 20, 'F1', 7, MUTED)
  text(
    page,
    `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
    500,
    20,
    'F4',
    7,
    MUTED,
  )
}

function buildPages(response: TripPlanResponse) {
  const { plan, request } = response
  const destination = plan.destination || request.location
  const pages: Page[] = [newPage(true, destination)]
  const current = () => pages[pages.length - 1]
  const ensure = (height: number) => {
    if (current().y - height < 55) pages.push(newPage(false, destination))
    return current()
  }

  const page = current()
  text(
    page,
    `${formatDate(request.start_date)}  /  ${request.days} days`,
    42,
    642,
    'F1',
    10,
    MUTED,
  )
  text(page, request.location.toUpperCase(), 455, 642, 'F4', 8, OLIVE)
  line(page, 42, 620, 553, 620, INK)
  page.y = 594

  sectionLabel(page, 'Weather at a glance')
  circle(page, 49, page.y - 2, 4, LIME)
  text(page, prettyValue(plan.weather), 64, page.y, 'F1', 9, INK)
  page.y -= 30
  line(page, 42, page.y, 553, page.y)
  page.y -= 25

  sectionLabel(page, 'The shortlist')
  const columns = [
    { title: 'PLACES TO SEE', items: values(plan.attractions) },
    { title: 'FOOD STOPS', items: values(plan.food_stops) },
  ]
  line(page, 297, page.y + 2, 297, page.y - 116, LINE)
  columns.forEach((column, columnIndex) => {
    const x = columnIndex === 0 ? 42 : 322
    text(page, column.title, x, page.y, 'F4', 7, OLIVE)
    let itemY = page.y - 22
    column.items.slice(0, 6).forEach((item, index) => {
      text(page, String(index + 1).padStart(2, '0'), x, itemY, 'F4', 7, OLIVE)
      const itemLines = wrap(entryText(item), 31).slice(0, 2)
      itemLines.forEach((itemLine, lineIndex) =>
        text(page, itemLine, x + 25, itemY - lineIndex * 12, 'F1', 8, INK),
      )
      itemY -= Math.max(22, itemLines.length * 12 + 8)
    })
  })
  const shortlistHeight =
    Math.max(...columns.map((column) => column.items.slice(0, 6).length), 1) *
      24 +
    20
  page.y -= shortlistHeight + 25

  sectionLabel(current(), 'Your days')
  const dailyPlan = Array.isArray(plan.daily_plan)
    ? plan.daily_plan
    : [plan.daily_plan]
  dailyPlan.forEach((day, index) => {
    const title = String(day?.title || day?.day || `Day ${index + 1}`)
    const description =
      day && typeof day === 'object'
        ? day.activities || day.stops || day.plan || day
        : day
    const dayLines = wrap(prettyValue(description), 78).slice(0, 4)
    const height = Math.max(48, 25 + dayLines.length * 13)
    const target = ensure(height + 8)
    if (target.y !== page.y) sectionLabel(target, 'Your days')
    circle(target, 50, target.y - 18, 9, LIME)
    text(
      target,
      String(index + 1).padStart(2, '0'),
      44,
      target.y - 21,
      'F4',
      7,
      INK,
    )
    text(target, title, 75, target.y - 15, 'F3', 12, INK)
    dayLines.forEach((item, lineIndex) =>
      text(target, item, 75, target.y - 33 - lineIndex * 13, 'F1', 8, MUTED),
    )
    target.y -= height
    line(target, 42, target.y + 3, 553, target.y + 3)
    target.y -= 13
  })

  if (plan.warnings?.length || plan.guides?.length) {
    const notes = plan.warnings?.flatMap((warning) => wrap(warning, 44)) || []
    const guides = plan.guides?.slice(0, 4) || []
    const bottomHeight =
      Math.max(notes.length * 13, Math.ceil(guides.length / 2) * 32, 36) + 30
    const target = ensure(bottomHeight)
    sectionLabel(target, 'Good to know')
    if (guides.length)
      text(target, 'LOCAL GUIDES', 322, target.y + 16, 'F4', 8, OLIVE)
    notes.forEach((note, index) =>
      text(target, `- ${note}`, 42, target.y - index * 13, 'F1', 8, INK),
    )
    guides.forEach((guide: Guide, index) => {
      const x = 322 + (index % 2) * 116
      const y = target.y - Math.floor(index / 2) * 32
      circle(target, x + 3, y - 3, 3, LIME)
      text(target, guide.name || 'Local guide', x + 12, y, 'F3', 8, INK)
      text(
        target,
        guide.specialties || 'Local guide',
        x + 12,
        y - 13,
        'F1',
        7,
        MUTED,
      )
    })
    target.y -= bottomHeight
  }

  pages.forEach((item, index) => addFooter(item, index, pages.length))
  return pages.map((item) => item.commands.join('\n'))
}

function buildPdf(response: TripPlanResponse) {
  const pages = buildPages(response)
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [' +
      pages.map((_, index) => `${7 + index * 2} 0 R`).join(' ') +
      '] /Count ' +
      pages.length +
      ' >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ]
  pages.forEach((content) => {
    const pageObject = objects.length + 1
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R /F4 6 0 R >> >> /Contents ${pageObject + 1} 0 R >>`,
    )
    objects.push(
      `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    )
  })

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xrefOffset = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

export function downloadTripPlanPdf(response: TripPlanResponse) {
  const destination = response.plan.destination || response.request.location
  const slug =
    destination
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'trip'
  const url = URL.createObjectURL(buildPdf(response))
  const link = document.createElement('a')
  link.href = url
  link.download = `${slug}-itinerary.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
