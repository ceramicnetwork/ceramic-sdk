import { CeramicClient } from '@ceramic-sdk/http-client'
import { DID } from 'dids'

import { StreamClient } from '../src/index.js'

describe('StreamClient', () => {
  describe('ceramic getter', () => {
    test('returns the CeramicClient instance set in constructor', () => {
      const ceramic = new CeramicClient({ url: 'http://localhost:5101' })
      const client = new StreamClient({ ceramic })
      expect(client.ceramic).toBe(ceramic)
    })

    test('returns a CeramicClient instance using the provided URL', () => {
      const client = new StreamClient({ ceramic: 'http://localhost:5101' })
      expect(client.ceramic).toBeInstanceOf(CeramicClient)
    })
  })

  describe('getDID() method', () => {
    test('throws if no DID is provided or set in the constructor', () => {
      const client = new StreamClient({ ceramic: 'http://localhost:5101' })
      expect(() => client.getDID()).toThrow('Missing DID')
    })

    test('returns the DID set in the constructor', () => {
      const did = new DID()
      const client = new StreamClient({ ceramic: 'http://localhost:5101', did })
      expect(client.getDID()).toBe(did)
    })

    test('returns the DID provided as argument', async () => {
      const did = new DID()
      const client = new StreamClient({
        ceramic: 'http://localhost:5101',
        did: new DID(),
      })
      expect(client.getDID(did)).toBe(did)
    })
  })
})
