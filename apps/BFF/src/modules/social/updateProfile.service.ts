import { BadGatewayException, HttpException, Injectable, StreamableFile, UnauthorizedException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { BffConfigService } from '../config/bff-config.service';
import { AuthService } from '../auth/auth.service';
import { uploadedMemoryFileToForm, sanitizeMetadata, saveProfileWithAvatar, uploadAvatarFile } from './utils';

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
export class UpdateProfileService {
  constructor(
    private readonly config: BffConfigService,
    private readonly authService: AuthService,
  ) {}

  async updateMyProfile(input: unknown, context: RequestContext) {
    const userId = await this.currentUserId(context);

    return this.callSocialService({
      method: 'PATCH',
      path: `/internal/users/${encodeURIComponent(userId)}/profile`,
      data: input,
      context,
    });
  }

  async saveMyProfile(input: unknown, file: UploadedMemoryFile | undefined, context: RequestContext) {
    const userId = await this.currentUserId(context);
    return saveProfileWithAvatar(
      userId,
      input,
      file,
      (callOpts) =>
        this.callSocialService({
          ...callOpts,
          context,
        }),
      context,
    );
  }

  async uploadMyAvatar(file: UploadedMemoryFile, context: RequestContext) {
    if (!file?.buffer) {
      throw new HttpException(
        { code: 'avatar_file_required', message: 'Avatar file is required.' },
        400,
      );
    }

    const userId = await this.currentUserId(context);
    return uploadAvatarFile(
      userId,
      file,
      async (callOpts) =>
        this.callSocialService({
          ...callOpts,
          context,
        }),
      context,
    );
  }

  async deleteMyAvatar(context: RequestContext) {
    const userId = await this.currentUserId(context);
    return this.callSocialService({
      method: 'DELETE',
      path: `/internal/users/${encodeURIComponent(userId)}/avatar`,
      context,
    });
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

  private async currentUserId(context: RequestContext): Promise<string> {
    console.log("[BFF/updateProfile.service] currentUserId called", {
      authorization: context.authorization ? context.authorization.substring(0, 30) : "MISSING",
    });
    this.ensureAuthorization(context.authorization);
    const verified = await this.authService.verify(context as any);
    console.log("[BFF/updateProfile.service] verified user", { userId: verified.user.id });
    return verified.user.id;
  }

  private ensureAuthorization(authorization?: string): void {
    console.log("[BFF/updateProfile.service] ensureAuthorization check", {
      hasAuthorization: Boolean(authorization),
      authorizationStart: authorization ? authorization.substring(0, 30) : "MISSING",
      startsWithBearer: authorization?.toLowerCase().startsWith('bearer '),
    });
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
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data: unknown = axiosError.response?.data;
      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? String((data as { message?: unknown }).message)
          : axiosError.message;

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
