// @vitest-environment jsdom
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

interface BookingApiContract {
  servers: Array<{ url: string }>
  paths: {
    '/api/v1/booking-requests': {
      post: {
        requestBody: {
          required: boolean
          content: {
            'application/json': {
              schema: { $ref: string }
            }
          }
        }
        responses: Record<string, { description: string }>
      }
    }
  }
  components: {
    schemas: {
      BookingRequest: object
    }
  }
}

const contractFile = resolve(process.cwd(), 'contracts/booking-api.openapi.json')
const contract = JSON.parse(readFileSync(contractFile, 'utf8')) as BookingApiContract
const ajv = new Ajv({ allErrors: true, strict: true })
addFormats(ajv)
const validateBookingRequest = ajv.compile(contract.components.schemas.BookingRequest)

describe('booking API consumer contract', () => {
  beforeAll(async () => {
    const hamlFile = resolve(process.cwd(), 'src/haml/index.haml')
    const renderedPage = execFileSync('haml', ['render', hamlFile], {
      encoding: 'utf8',
    })
    document.body.innerHTML = new DOMParser()
      .parseFromString(renderedPage, 'text/html')
      .body.innerHTML

    await import('../../src/ts/booking')
  })

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 201 })))
  })

  it('sends the rendered booking form request according to the OpenAPI contract', async () => {
    const destination = document.querySelector<HTMLSelectElement>('#destination')
    const fullName = document.querySelector<HTMLInputElement>('#full-name')
    const phone = document.querySelector<HTMLInputElement>('#phone-number')
    const fromDate = document.querySelector<HTMLInputElement>('#from-date')
    const toDate = document.querySelector<HTMLInputElement>('#to-date')
    const travelers = document.querySelector<HTMLInputElement>('#travelers')
    const form = document.querySelector<HTMLFormElement>('.booking-form')

    if (!destination || !fullName || !phone || !fromDate || !toDate || !travelers || !form) {
      throw new Error('The rendered booking form is missing required fields.')
    }

    destination.value = 'ooty'
    fullName.value = 'Mira Rao'
    phone.value = '+91 98765 43210'
    fromDate.value = '2026-11-10'
    toDate.value = '2026-11-12'
    travelers.value = '2'
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledOnce()
    })

    const [requestUrl, requestInit] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(requestUrl).toBe(
      new URL('/api/v1/booking-requests', contract.servers[0].url).toString(),
    )
    expect(requestInit?.method).toBe('POST')
    expect(requestInit?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(contract.paths['/api/v1/booking-requests'].post.requestBody.required).toBe(true)
    expect(contract.paths['/api/v1/booking-requests'].post.responses).toHaveProperty('201')

    const payload: unknown = JSON.parse(String(requestInit?.body))
    expect(validateBookingRequest(payload), ajv.errorsText(validateBookingRequest.errors)).toBe(true)
  })

  it('rejects request payloads that violate the contract', () => {
    expect(
      validateBookingRequest({
        fullName: 'Mira Rao',
        phoneNumber: '+91 98765 43210',
        currentLocation: '',
        destination: 'ooty',
        fromDate: '2026-11-10',
        toDate: 'not-a-date',
        numberOfMembers: 0,
        specialRequests: '',
      }),
    ).toBe(false)
  })
})
