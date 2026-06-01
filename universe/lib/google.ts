import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'
import { OAuth2Client } from 'google-auth-library'

const CLIENT_SECRET_PATH = process.env.GOOGLE_CLIENT_SECRET_PATH ||
  path.join(process.env.HOME || '~', '.openclaw/workspace/raw/google-client-secret.json')
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH ||
  path.join(process.env.HOME || '~', '.openclaw/workspace/universe/.token')

const SCOPES = [
  'https://www.googleapis.com/auth/contacts.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
]

function loadClientSecret(): { client_id: string; client_secret: string; redirect_uris: string[] } {
  const raw = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH, 'utf-8'))
  return raw.installed || raw.web
}

export function createOAuth2Client(): OAuth2Client {
  const { client_id, client_secret } = loadClientSecret()
  return new google.auth.OAuth2(client_id, client_secret, 'http://localhost:3001/api/google/callback')
}

export function getAuthUrl(): string {
  const client = createOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })
}

export function isTokenStored(): boolean {
  return fs.existsSync(TOKEN_PATH)
}

export async function exchangeCode(code: string): Promise<void> {
  const client = createOAuth2Client()
  const { tokens } = await client.getToken(code)
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens), { mode: 0o600 })
}

export async function getAuthorizedClient(): Promise<OAuth2Client> {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('Google token not found. Please authorize first.')
  }
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'))
  const client = createOAuth2Client()
  client.setCredentials(tokens)

  // Refresh if needed
  client.on('tokens', (newTokens) => {
    const merged = { ...tokens, ...newTokens }
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(merged), { mode: 0o600 })
  })

  return client
}

export interface GoogleContact {
  resourceName: string
  etag: string
  displayName: string
  givenName: string
  familyName: string
  photoUrl: string | null
  emails: Array<{ value: string; type: string }>
  phones: Array<{ value: string; type: string }>
  company: string | null
  jobTitle: string | null
  addresses: Array<{ formattedValue: string; type: string }>
  birthday: string | null
}

export async function fetchAllContacts(): Promise<GoogleContact[]> {
  const auth = await getAuthorizedClient()
  const people = google.people({ version: 'v1', auth })

  const contacts: GoogleContact[] = []
  let pageToken: string | undefined

  do {
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 1000,
      pageToken,
      personFields: [
        'names', 'photos', 'emailAddresses', 'phoneNumbers',
        'organizations', 'addresses', 'birthdays', 'metadata',
      ].join(','),
    })

    const connections = response.data.connections || []
    for (const person of connections) {
      const name = person.names?.[0]
      const photo = person.photos?.find(p => !p.default)
      const org = person.organizations?.[0]
      const birthday = person.birthdays?.[0]?.date

      contacts.push({
        resourceName: person.resourceName || '',
        etag: person.etag || '',
        displayName: name?.displayName || name?.givenName || 'Unknown',
        givenName: name?.givenName || '',
        familyName: name?.familyName || '',
        photoUrl: photo?.url || null,
        emails: (person.emailAddresses || []).map(e => ({
          value: e.value || '',
          type: e.type || 'other',
        })),
        phones: (person.phoneNumbers || []).map(p => ({
          value: p.value || '',
          type: p.type || 'other',
        })),
        company: org?.name || null,
        jobTitle: org?.title || null,
        addresses: (person.addresses || []).map(a => ({
          formattedValue: a.formattedValue || '',
          type: a.type || 'other',
        })),
        birthday: birthday
          ? `${birthday.year || '????'}-${String(birthday.month || 1).padStart(2, '0')}-${String(birthday.day || 1).padStart(2, '0')}`
          : null,
      })
    }

    pageToken = response.data.nextPageToken || undefined
  } while (pageToken)

  return contacts
}
