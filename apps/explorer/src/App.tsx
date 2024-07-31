import '@mantine/core/styles.css'
import { Container, MantineProvider, createTheme } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as JotaiProvider } from 'jotai'
import type { ReactNode } from 'react'

import { EventsFeed } from './components/EventsFeed.tsx'
import Header from './components/Header.tsx'
import ServerConnectedContainer from './components/ServerConnectedContainer.tsx'

const queryClient = new QueryClient()

const theme = createTheme({
  primaryColor: 'orange',
})

function Providers({ children }: { children: ReactNode }) {
  return (
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </QueryClientProvider>
    </JotaiProvider>
  )
}

export default function App() {
  return (
    <Providers>
      <Header />
      <Container size="md">
        <ServerConnectedContainer>
          <EventsFeed />
        </ServerConnectedContainer>
      </Container>
    </Providers>
  )
}
