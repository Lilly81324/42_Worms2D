const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

type ApiResult<T> =
    | { ok: true; data: T; status: number }
    | { ok: false; error: string; status: number };

type UpdateMyProfileInput = {
    displayName?: string;
    bio?: string;
};

async function request<T>(url: string, options: RequestInit = {}): Promise<ApiResult<T>> {
    const token = sessionStorage.getItem("auth.accessToken");
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

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

    return request<unknown>(`${BASE_URL}/users/me/profile/with-avatar`, {
        method: "PATCH",
        body: form,
    });
}
