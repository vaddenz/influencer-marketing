export interface FeishuWebhookBody {
  uuid?: string
  token?: string
  ts?: string
  type?: string
  challenge?: string
  event?: FeishuEvent
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
