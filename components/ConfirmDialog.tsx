import { Dialog, Portal, Text, Button } from 'react-native-paper'
import { Colors } from '@/lib/colors'

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
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: Colors.card }}>
        <Dialog.Title style={{ color: Colors.foreground }}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ color: Colors.mutedForeground }}>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={loading} textColor={Colors.mutedForeground}>Abbrechen</Button>
          <Button textColor={Colors.destructive} onPress={onConfirm} loading={loading} disabled={loading}>Löschen</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
