type Props = {
  text: string
  senderName: string
  isMine: boolean
  date: Date
}

export function MessageBubble({ text, senderName, isMine, date }: Props) {
  return (
    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
      <span className="text-xs text-muted-foreground mb-1">{senderName}</span>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-primary text-white' : 'bg-secondary text-foreground'}`}>
        {text}
      </div>
      <span className="text-xs text-muted-foreground mt-1">
        {date.toLocaleDateString('de-DE', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}
