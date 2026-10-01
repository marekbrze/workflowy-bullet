import { useNavigate } from 'react-router-dom'
import { useConnection } from '../hooks/use-connection'
import { ConnectScreen } from './ConnectScreen'
import { ConnectionSettings } from './ConnectionSettings'

/** The stored connection is damaged; it was not deleted, but the user needs to connect again. */
export const SAVED_CONNECTION_UNREADABLE =
  'Your saved connection could not be read, so you need to connect again.'

export function ConnectionPage() {
  const navigate = useNavigate()
  const connection = useConnection()

  if (connection.status === 'disconnected') {
    return (
      <ConnectScreen
        onConnect={connection.submit}
        notice={connection.unreadable ? SAVED_CONNECTION_UNREADABLE : null}
      />
    )
  }
  return <ConnectionSettings connection={connection} onDisconnected={() => navigate('/')} />
}
