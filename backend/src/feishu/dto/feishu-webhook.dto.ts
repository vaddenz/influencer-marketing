export interface FeishuWebhookBody {
  uuid?: string
  token?: string
  ts?: string
  type?: string
  challenge?: string
  schema?: string
  header?: FeishuHeader
  event?: FeishuEvent
}

export interface FeishuHeader {
  event_id?: string
  event_type?: string
  token?: string
  create_time?: string
}

export interface FeishuEvent {
  type?: string
  message?: FeishuMessage
}

export interface FeishuMessage {
  chat_id?: string
  message_type?: string
  content?: string
}
