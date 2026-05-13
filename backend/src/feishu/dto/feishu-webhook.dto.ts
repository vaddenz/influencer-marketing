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

export interface FeishuSender {
  sender_id?: {
    union_id?: string
    user_id?: string
    open_id?: string
  }
  sender_type?: string
  tenant_key?: string
}

export interface FeishuMessage {
  chat_id?: string
  message_type?: string
  content?: string
  sender?: FeishuSender
}
