import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AccessTokenService } from '../auth/tokens/access-token.service';
import { SocialService } from './social.service';
import { SendMessageDto } from './social.dto';
import type { AuthPrincipal } from '../auth/auth-principal';

@WebSocketGateway({
  path: '/social/socket.io/',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly accessTokens: AccessTokenService,
    private readonly social: SocialService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const principal = await this.principalFromSocket(client);
      client.data.principal = principal;
      client.data.userId = principal.claims.sub;
      await client.join(`user:${principal.claims.sub}`);
      await this.social.markSocketOnline(principal.claims.sub, client.id);
      client.emit('presence.updated', {
        userId: principal.claims.sub,
        status: 'ONLINE',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unauthorized';
      client.emit('error', { code: 'unauthorized', message });
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (!userId) {
      return;
    }
    await this.social.markSocketDisconnected(userId, client.id);
    this.server.emit('presence.updated', { userId, status: 'OFFLINE' });
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('clan.join')
  async joinClan(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { clanId?: string },
  ) {
    const principal = this.socketPrincipal(client);
    if (!payload?.clanId) {
      return { ok: false, error: 'clanId is required' };
    }
    await this.social.getClanMembership(
      payload.clanId,
      principal.claims.sub,
      principal,
    );
    await client.join(`clan:${payload.clanId}`);
    return { ok: true };
  }

  @SubscribeMessage('thread.join')
  async joinThread(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { threadId?: string },
  ) {
    const principal = this.socketPrincipal(client);
    if (!payload?.threadId) {
      return { ok: false, error: 'threadId is required' };
    }
    await this.social.getThread(payload.threadId, principal);
    await client.join(`thread:${payload.threadId}`);
    return { ok: true };
  }

  @SubscribeMessage('clan.message')
  async clanMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { clanId?: string; content?: string; clientMessageId?: string },
  ) {
    const principal = this.socketPrincipal(client);
    if (!payload?.clanId || !payload.content) {
      return { ok: false, error: 'clanId and content are required' };
    }
    const message = await this.social.sendClanMessage(
      payload.clanId,
      {
        content: payload.content,
        clientMessageId: payload.clientMessageId,
      } satisfies SendMessageDto,
      principal,
    );
    this.server.to(`clan:${payload.clanId}`).emit('message.created', message);
    return { ok: true, message };
  }

  @SubscribeMessage('thread.message')
  async threadMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: { threadId?: string; content?: string; clientMessageId?: string },
  ) {
    const principal = this.socketPrincipal(client);
    if (!payload?.threadId || !payload.content) {
      return { ok: false, error: 'threadId and content are required' };
    }
    const message = await this.social.sendMessage(
      payload.threadId,
      {
        content: payload.content,
        clientMessageId: payload.clientMessageId,
      } satisfies SendMessageDto,
      principal,
    );
    this.server
      .to(`thread:${payload.threadId}`)
      .emit('message.created', message);
    return { ok: true, message };
  }

  @SubscribeMessage('typing.start')
  async typingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { threadId?: string },
  ) {
    const principal = this.socketPrincipal(client);
    if (!payload?.threadId) {
      return { ok: false, error: 'threadId is required' };
    }
    await this.social.getThread(payload.threadId, principal);
    client.to(`thread:${payload.threadId}`).emit('typing.updated', {
      threadId: payload.threadId,
      userId: principal.claims.sub,
      typing: true,
    });
    return { ok: true };
  }

  private socketPrincipal(client: Socket): AuthPrincipal {
    const principal = client.data?.principal as AuthPrincipal | undefined;
    if (!principal) {
      throw new Error('Unauthorized socket');
    }
    return principal;
  }

  private async principalFromSocket(client: Socket): Promise<AuthPrincipal> {
    const token = this.extractSocketToken(client);
    const claims = await this.accessTokens.verifyAccessToken(token);
    return {
      token,
      claims,
      roleSet: new Set(claims.roles.map((role) => role.toUpperCase())),
    };
  }

  private extractSocketToken(client: Socket): string {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, '');
    }

    const header = client.handshake.headers.authorization;
    if (
      typeof header === 'string' &&
      header.toLowerCase().startsWith('bearer ')
    ) {
      return header.slice('bearer '.length);
    }

    throw new Error('Missing bearer token');
  }
}
