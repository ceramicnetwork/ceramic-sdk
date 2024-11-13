import { tableFromIPC } from 'apache-arrow'
import {
  type ClientOptions,
  type FlightSqlClient,
  createFlightSqlClient,
} from '..'

const OPTIONS: ClientOptions = {
  headers: new Array(),
  username: undefined,
  password: undefined,
  token: undefined,
  tls: false,
  host: '127.0.0.1',
  port: 5102,
}

async function getClient(): Promise<FlightSqlClient> {
  return createFlightSqlClient(OPTIONS)
}

describe('fligh sql', () => {
  test('makes query', async () => {
    const client = await getClient()
    const buffer = await client.query('SELECT * FROM conclusion_feed')
    const data = tableFromIPC(buffer)
    console.log(JSON.stringify(data))
  })

  test('catalogs', async () => {
    const client = await getClient()
    const buffer = await client.getCatalogs()
    const data = tableFromIPC(buffer)
    console.log(JSON.stringify(data))
  })

  test('schemas', async () => {
    const client = await getClient()
    const buffer = await client.getDbSchemas({})
    const data = tableFromIPC(buffer)
    console.log(JSON.stringify(data))
  })

  test('tables', async () => {
    const client = await getClient()
    const withSchema = await client.getTables({ includeSchema: true })
    const noSchema = await client.getTables({ includeSchema: false })
    console.log(JSON.stringify(tableFromIPC(withSchema)))
    console.log(JSON.stringify(tableFromIPC(noSchema)))
    expect(withSchema).not.toBe(noSchema)
  })

  test('prepared stmt', async () => {
    const client = await createFlightSqlClient(OPTIONS)
    const data = await client.preparedStatement(
      'SELECT * from conclusion_feed where stream_type = $1',
      new Array(['$1', '3']),
    )
    console.log(data)
  })
})
