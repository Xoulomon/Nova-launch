import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient, StreamStatus } from '@prisma/client';
import { StreamEventParser } from '../services/streamEventParser';
import { streamEventFixtures } from './fixtures/streamEvents';

const prisma = new PrismaClient();
const parser = new StreamEventParser(prisma);

describe('StreamEventParser', () => {
  beforeEach(async () => {
    await prisma.stream.deleteMany();
  });

  afterEach(async () => {
    await prisma.stream.deleteMany();
  });

  describe('parseCreatedEvent', () => {
    it('should parse and store stream created event with metadata', async () => {
      await parser.parseCreatedEvent(streamEventFixtures.created);

      const stream = await prisma.stream.findUnique({
        where: { streamId: streamEventFixtures.created.streamId },
      });

      expect(stream).toBeDefined();
      expect(stream?.streamId).toBe(streamEventFixtures.created.streamId);
      expect(stream?.creator).toBe(streamEventFixtures.created.creator);
      expect(stream?.recipient).toBe(streamEventFixtures.created.recipient);
      expect(stream?.amount).toBe(BigInt(streamEventFixtures.created.amount));
      expect(stream?.metadata).toBe(streamEventFixtures.created.metadata);
      expect(stream?.status).toBe(StreamStatus.CREATED);
      expect(stream?.txHash).toBe(streamEventFixtures.created.txHash);
    });

    it('should parse and store stream created event without metadata', async () => {
      await parser.parseCreatedEvent(streamEventFixtures.createdWithoutMetadata);

      const stream = await prisma.stream.findUnique({
        where: { streamId: streamEventFixtures.createdWithoutMetadata.streamId },
      });

      expect(stream).toBeDefined();
      expect(stream?.metadata).toBeNull();
      expect(stream?.status).toBe(StreamStatus.CREATED);
    });
  });

  describe('parseClaimedEvent', () => {
    it('should update stream status to CLAIMED', async () => {
      await parser.parseCreatedEvent(streamEventFixtures.created);
      await parser.parseClaimedEvent(streamEventFixtures.claimed);

      const stream = await prisma.stream.findUnique({
        where: { streamId: streamEventFixtures.claimed.streamId },
      });

      expect(stream?.status).toBe(StreamStatus.CLAIMED);
      expect(stream?.claimedAt).toEqual(streamEventFixtures.claimed.timestamp);
    });
  });

  describe('parseCancelledEvent', () => {
    it('should update stream status to CANCELLED', async () => {
      await parser.parseCreatedEvent(streamEventFixtures.createdWithoutMetadata);
      await parser.parseCancelledEvent(streamEventFixtures.cancelled);

      const stream = await prisma.stream.findUnique({
        where: { streamId: streamEventFixtures.cancelled.streamId },
      });

      expect(stream?.status).toBe(StreamStatus.CANCELLED);
      expect(stream?.cancelledAt).toEqual(streamEventFixtures.cancelled.timestamp);
    });
  });

  describe('parseEvent - full lifecycle', () => {
    it('should handle complete stream lifecycle: created -> claimed', async () => {
      await parser.parseEvent(streamEventFixtures.created);
      await parser.parseEvent(streamEventFixtures.claimed);

      const stream = await prisma.stream.findUnique({
        where: { streamId: streamEventFixtures.created.streamId },
      });

      expect(stream?.status).toBe(StreamStatus.CLAIMED);
      expect(stream?.createdAt).toEqual(streamEventFixtures.created.timestamp);
      expect(stream?.claimedAt).toEqual(streamEventFixtures.claimed.timestamp);
      expect(stream?.cancelledAt).toBeNull();
    });

    it('should handle complete stream lifecycle: created -> cancelled', async () => {
      await parser.parseEvent(streamEventFixtures.createdWithoutMetadata);
      await parser.parseEvent(streamEventFixtures.cancelled);

      const stream = await prisma.stream.findUnique({
        where: { streamId: streamEventFixtures.createdWithoutMetadata.streamId },
      });

      expect(stream?.status).toBe(StreamStatus.CANCELLED);
      expect(stream?.createdAt).toEqual(streamEventFixtures.createdWithoutMetadata.timestamp);
      expect(stream?.cancelledAt).toEqual(streamEventFixtures.cancelled.timestamp);
      expect(stream?.claimedAt).toBeNull();
    });
  });

  describe('event-to-database mapping validation', () => {
    it('should correctly map all created event fields to database', async () => {
      const event = streamEventFixtures.created;
      await parser.parseCreatedEvent(event);

      const stream = await prisma.stream.findUnique({
        where: { streamId: event.streamId },
      });

      expect(stream).toMatchObject({
        streamId: event.streamId,
        creator: event.creator,
        recipient: event.recipient,
        amount: BigInt(event.amount),
        metadata: event.metadata,
        status: StreamStatus.CREATED,
        txHash: event.txHash,
        createdAt: event.timestamp,
        claimedAt: null,
        cancelledAt: null,
      });
    });

    it('should correctly map claimed event state transition', async () => {
      await parser.parseCreatedEvent(streamEventFixtures.created);
      await parser.parseClaimedEvent(streamEventFixtures.claimed);

      const stream = await prisma.stream.findUnique({
        where: { streamId: streamEventFixtures.claimed.streamId },
      });

      expect(stream?.status).toBe(StreamStatus.CLAIMED);
      expect(stream?.claimedAt).toEqual(streamEventFixtures.claimed.timestamp);
      expect(stream?.cancelledAt).toBeNull();
    });

    it('should correctly map cancelled event state transition', async () => {
      await parser.parseCreatedEvent(streamEventFixtures.createdWithoutMetadata);
      await parser.parseCancelledEvent(streamEventFixtures.cancelled);

      const stream = await prisma.stream.findUnique({
        where: { streamId: streamEventFixtures.cancelled.streamId },
      });

      expect(stream?.status).toBe(StreamStatus.CANCELLED);
      expect(stream?.cancelledAt).toEqual(streamEventFixtures.cancelled.timestamp);
      expect(stream?.claimedAt).toBeNull();
    });
  });
});
