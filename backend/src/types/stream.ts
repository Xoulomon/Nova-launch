export interface StreamEvent {
  streamId: number;
  creator: string;
  recipient: string;
  amount: string;
  hasMetadata: boolean;
  metadata?: string;
  txHash: string;
  timestamp: Date;
}

export interface StreamCreatedEvent extends StreamEvent {
  type: 'created';
}

export interface StreamClaimedEvent {
  type: 'claimed';
  streamId: number;
  recipient: string;
  amount: string;
  txHash: string;
  timestamp: Date;
}

export interface StreamCancelledEvent {
  type: 'cancelled';
  streamId: number;
  creator: string;
  refundAmount: string;
  txHash: string;
  timestamp: Date;
}

export type StreamEventUnion = StreamCreatedEvent | StreamClaimedEvent | StreamCancelledEvent;

export enum StreamStatus {
  CREATED = 'CREATED',
  CLAIMED = 'CLAIMED',
  CANCELLED = 'CANCELLED',
}
