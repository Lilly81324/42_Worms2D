import { authClient } from "@/src/core/api/auth/auth.client";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type ApiResult<T> =
    | { ok: true; data: T; status: number }
    | { ok: false; error: string; status: number };

type UpdateMyProfileInput = {
    displayName?: string;
    bio?: string;
};

async function request<T>(url: string, options: RequestInit = {}, hasRetried = false): Promise<ApiResult<T>> {
    const token = sessionStorage.getItem("auth.accessToken");
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        console.log("[profile.client] request sent with Authorization header", {
            url,
            method: options.method,
            hasToken: Boolean(token),
            tokenLength: token.length,
            headers: {
                Authorization: `Bearer ${token.substring(0, 20)}...`,
                ContentType: headers.get("Content-Type"),
            },
        });
    } else {
        console.log("[profile.client] NO token in sessionStorage!", { url, method: options.method });
    }

    const response = await fetch(url, {
        ...options,
        headers,
        cache: "no-store",
    });

    // Align profile client behavior with auth client: recover once on expired access token.
    if (response.status === 401 && !hasRetried) {
        const refreshToken = sessionStorage.getItem("auth.refreshToken");
        if (refreshToken) {
            const refreshResult = await authClient.refresh({ refreshToken });

            if (refreshResult.ok) {
                sessionStorage.setItem("auth.accessToken", refreshResult.data.tokens.accessToken);
                sessionStorage.setItem("auth.refreshToken", refreshResult.data.tokens.refreshToken);
                if (refreshResult.data.tokens.expiresIn) {
                    sessionStorage.setItem("auth.expiresIn", String(refreshResult.data.tokens.expiresIn));
                }
                if (refreshResult.data.tokens.tokenType) {
                    sessionStorage.setItem("auth.tokenType", refreshResult.data.tokens.tokenType);
                }

                return request<T>(url, options, true);
            }
        }
    }

    if (response.status === 204) {
        return { ok: true, data: {} as T, status: response.status };
    }

    const contentType = response.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json")
        ? await response.json().catch(() => null)
        : await response.text().catch(() => null);

    if (response.ok) {
        return { ok: true, data: data as T, status: response.status };
    }

    const message =
        typeof data === "object" && data !== null && "message" in data
            ? String((data as { message?: unknown }).message ?? "Request failed")
            : "Request failed";

    return { ok: false, error: message, status: response.status };
}

export async function updateMyProfile(input: UpdateMyProfileInput): Promise<ApiResult<unknown>> {
    return request<unknown>(`${BASE_URL}/users/me/profile`, {
        method: "PATCH",
        body: JSON.stringify(input),
    });
}

export async function getMyProfile(): Promise<ApiResult<{ displayName?: string | null; bio?: string | null; avatarUrl?: string | null }>> {
    return request(`${BASE_URL}/users/me/profile`);
}

export async function uploadMyAvatar(file: Blob, fileName = "avatar.png"): Promise<ApiResult<unknown>> {
    const form = new FormData();
    form.append("file", file, fileName);

    return request<unknown>(`${BASE_URL}/users/me/avatar`, {
        method: "POST",
        body: form,
    });
}

// Submit profile metadata and avatar together in one request.
export async function saveMyProfile(input: UpdateMyProfileInput & { avatar?: Blob | null }): Promise<ApiResult<unknown>> {
    const form = new FormData();

    if (input.displayName) {
        form.set("displayName", input.displayName);
    }

    if (input.bio) {
        form.set("bio", input.bio);
    }

    if (input.avatar) {
        form.set("avatar", input.avatar, "avatar.png");
    }

	console.log("BASE_URL: ", BASE_URL);
    return request<unknown>(`${BASE_URL}/users/me/profile/with-avatar`, {
        method: "PATCH",
        body: form,
    });
}
