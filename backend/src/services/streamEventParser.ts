import { PrismaClient, StreamStatus } from '@prisma/client';
import { StreamCreatedEvent, StreamClaimedEvent, StreamCancelledEvent } from '../types/stream';

export class StreamEventParser {
  constructor(private prisma: PrismaClient) {}

  async parseCreatedEvent(event: StreamCreatedEvent): Promise<void> {
    await this.prisma.stream.create({
      data: {
        streamId: event.streamId,
        creator: event.creator,
        recipient: event.recipient,
        amount: BigInt(event.amount),
        metadata: event.metadata,
        status: StreamStatus.CREATED,
        txHash: event.txHash,
        createdAt: event.timestamp,
      },
    });
  }

  async parseClaimedEvent(event: StreamClaimedEvent): Promise<void> {
    await this.prisma.stream.update({
      where: { streamId: event.streamId },
      data: {
        status: StreamStatus.CLAIMED,
        claimedAt: event.timestamp,
      },
    });
  }

  async parseCancelledEvent(event: StreamCancelledEvent): Promise<void> {
    await this.prisma.stream.update({
      where: { streamId: event.streamId },
      data: {
        status: StreamStatus.CANCELLED,
        cancelledAt: event.timestamp,
      },
    });
  }

  async parseEvent(event: StreamCreatedEvent | StreamClaimedEvent | StreamCancelledEvent): Promise<void> {
    switch (event.type) {
      case 'created':
        await this.parseCreatedEvent(event);
        break;
      case 'claimed':
        await this.parseClaimedEvent(event);
        break;
      case 'cancelled':
        await this.parseCancelledEvent(event);
        break;
    }
  }
}
