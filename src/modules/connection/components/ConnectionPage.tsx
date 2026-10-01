import { useNavigate } from 'react-router-dom'
import { useConnection } from '../hooks/use-connection'
import { ConnectScreen } from './ConnectScreen'
import { ConnectionSettings } from './ConnectionSettings'

export function ConnectionPage() {
  const navigate = useNavigate()
  const connection = useConnection()

  if (connection.status === 'disconnected') {
    return <ConnectScreen onConnect={connection.connect} />
  }
  return <ConnectionSettings connection={connection} onDisconnected={() => navigate('/')} />
}
