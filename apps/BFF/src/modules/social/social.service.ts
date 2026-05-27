import {
  BadGatewayException,
  HttpException,
  Injectable,
  StreamableFile,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { BffConfigService } from '../config/bff-config.service';
import { AuthService } from '../auth/auth.service';

type RequestContext = {
  requestId?: string;
  authorization?: string;
};

type UploadedMemoryFile = {
  buffer?: Buffer;
  originalname?: string;
  mimetype?: string;
  size?: number;
};

@Injectable()
export class SocialService {
  constructor(
    private readonly config: BffConfigService,
    private readonly authService: AuthService,
  ) {}

  async currentUserId(context: RequestContext): Promise<string> {
    this.ensureAuthorization(context.authorization);
    const verified = await this.authService.verify(context);
    return verified.user.id;
  }

  getMyProfile(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/users/${encodeURIComponent(userId)}/profile`,
        context,
      }),
    );
  }

  updateMyProfile(input: unknown, context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'PATCH',
        path: `/internal/users/${encodeURIComponent(userId)}/profile`,
        data: input,
        context,
      }),
    );
  }

  // Forward metadata and avatar as multipart form data to the social service.
  saveMyProfile(input: unknown, file: UploadedMemoryFile | undefined, context: RequestContext) {
    return this.withMe(context, (userId) =>
      (() => {
        const form = new FormData();
        if (typeof input === 'object' && input !== null) {
          for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
            if (value === undefined || value === null || value === '') {
              continue;
            }
            form.set(key, String(value));
          }
        }

        if (file?.buffer) {
          const arrayBuffer = file.buffer.buffer.slice(
            file.buffer.byteOffset,
            file.buffer.byteOffset + file.buffer.byteLength,
          ) as ArrayBuffer;
          form.set(
            'avatar',
            new Blob([arrayBuffer], {
              type: file.mimetype ?? 'application/octet-stream',
            }),
            file.originalname ?? 'avatar.png',
          );
        }

        return this.callSocialService({
          method: 'PATCH',
          path: `/internal/users/${encodeURIComponent(userId)}/profile/with-avatar`,
          data: form,
          context,
        });
      })(),
    );
  }

  getUserProfile(userId: string, context: RequestContext) {
    return this.callSocialService({
      method: 'GET',
      path: `/internal/users/${encodeURIComponent(userId)}/profile`,
      context,
    });
  }

  searchUsers(query: Record<string, unknown>, context: RequestContext) {
    return this.callSocialService({
      method: 'GET',
      path: '/internal/users/search',
      params: query,
      context,
    });
  }

  getMyPrivacy(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/users/${encodeURIComponent(userId)}/privacy`,
        context,
      }),
    );
  }

  updateMyPrivacy(input: unknown, context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'PATCH',
        path: `/internal/users/${encodeURIComponent(userId)}/privacy`,
        data: input,
        context,
      }),
    );
  }

  uploadMyAvatar(file: UploadedMemoryFile, context: RequestContext) {
    return this.withMe(context, async (userId) => {
      if (!file?.buffer) {
        throw new HttpException(
          { code: 'avatar_file_required', message: 'Avatar file is required.' },
          400,
        );
      }

      const form = new FormData();
      const arrayBuffer = file.buffer.buffer.slice(
        file.buffer.byteOffset,
        file.buffer.byteOffset + file.buffer.byteLength,
      ) as ArrayBuffer;
      form.append(
        'file',
        new Blob([arrayBuffer], {
          type: file.mimetype ?? 'application/octet-stream',
        }),
        file.originalname ?? 'avatar',
      );

      return this.callSocialService({
        method: 'POST',
        path: `/internal/users/${encodeURIComponent(userId)}/avatar`,
        data: form,
        context,
        extraHeaders: {},
      });
    });
  }

  deleteMyAvatar(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'DELETE',
        path: `/internal/users/${encodeURIComponent(userId)}/avatar`,
        context,
      }),
    );
  }

  async getAvatar(fileName: string, context: RequestContext) {
    const response = await this.callSocialRaw({
      method: 'GET',
      path: `/internal/uploads/avatars/${encodeURIComponent(fileName)}`,
      context,
      responseType: 'stream',
    });

    return {
      streamable: new StreamableFile(response.data),
      contentType: response.headers['content-type'] as string | undefined,
      contentLength: response.headers['content-length'] as string | undefined,
    };
  }

  listFriends(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/friends/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  listIncomingFriendRequests(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/friend-requests/incoming/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  listOutgoingFriendRequests(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/friend-requests/outgoing/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  removeFriend(otherUserId: string, context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'DELETE',
        path: `/internal/friends/${encodeURIComponent(userId)}/${encodeURIComponent(otherUserId)}`,
        context,
      }),
    );
  }

  listBlocks(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/blocks/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  removeBlock(blockedUserId: string, context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'DELETE',
        path: `/internal/blocks/${encodeURIComponent(userId)}/${encodeURIComponent(blockedUserId)}`,
        context,
      }),
    );
  }

  listMyClans(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/clans/by-user/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  listMyClanInvites(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/clan-invites/by-user/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  listChats(context: RequestContext) {
    return this.withMe(context, (userId) =>
      this.callSocialService({
        method: 'GET',
        path: `/internal/chats/by-user/${encodeURIComponent(userId)}`,
        context,
      }),
    );
  }

  proxy(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    context: RequestContext,
    data?: unknown,
    params?: Record<string, unknown>,
  ) {
    return this.callSocialService({ method, path, context, data, params });
  }

  private async withMe<T>(
    context: RequestContext,
    fn: (userId: string) => Promise<T>,
  ): Promise<T> {
    const userId = await this.currentUserId(context);
    return fn(userId);
  }

  private ensureAuthorization(authorization?: string): void {
    if (!authorization?.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException({
        code: 'missing_bearer_token',
        message: 'Authorization header with Bearer token is required.',
      });
    }
  }

  private async callSocialService<T>(input: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    context: RequestContext;
    data?: unknown;
    params?: Record<string, unknown>;
    extraHeaders?: Record<string, string>;
  }): Promise<T> {
    const response = await this.callSocialRaw<T>(input);
    return response.data;
  }

  private async callSocialRaw<T = any>(input: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    context: RequestContext;
    data?: unknown;
    params?: Record<string, unknown>;
    responseType?: 'json' | 'stream';
    extraHeaders?: Record<string, string>;
  }) {
    const headers: Record<string, string> = {
      'x-service-name': 'bff',
      ...(input.extraHeaders ?? {}),
    };

    if (input.context.requestId) {
      headers['x-request-id'] = input.context.requestId;
    }

    if (input.context.authorization) {
      headers.authorization = input.context.authorization;
    }

    try {
      return await axios.request<T>({
        method: input.method,
        url: `${this.config.social.serviceUrl}${input.path}`,
        headers,
        data: input.data,
        params: input.params,
        responseType: input.responseType,
      });
    } catch (error) {
      this.throwNormalizedError(error);
    }
  }

  private throwNormalizedError(error: unknown): never {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const data: unknown = error.response?.data;
      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message?: unknown }).message)
          : error.message;

      throw new HttpException(
        {
          code: `social_service_${status ?? 'error'}`,
          message,
          details: data,
        },
        status ?? 502,
      );
    }

    throw new BadGatewayException({
      code: 'social_service_unreachable',
      message: 'Unable to reach social service.',
      details: error,
    });
  }
}
