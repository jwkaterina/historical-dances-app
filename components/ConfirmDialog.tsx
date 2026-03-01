import { StyleSheet } from 'react-native'
import { Dialog, Portal, Text, Button } from 'react-native-paper'

interface Props {
  visible: boolean
  title: string
  message: string
  onConfirm: () => void
  onDismiss: () => void
  loading?: boolean
}

export default function ConfirmDialog({ visible, title, message, onConfirm, onDismiss, loading }: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading}>Abbrechen</Button>
          <Button
            textColor="red"
            onPress={onConfirm}
            loading={loading}
            disabled={loading}
          >
            Löschen
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}

const styles = StyleSheet.create({})
