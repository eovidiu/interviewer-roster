/**
 * API Client for backend communication
 *
 * Features:
 * - JWT token management (in-memory, not localStorage for security)
 * - Typed request/response handling
 * - Error handling with proper status codes
 * - Automatic JSON parsing
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string,
    public body?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private token: string | null = null
  private baseURL: string

  constructor(baseURL: string = 'http://localhost:3000/api') {
    this.baseURL = baseURL
  }

  /**
   * Set JWT token for authentication
   * Stored in memory (NOT localStorage for security)
   */
  setToken(token: string | null): void {
    this.token = token
  }

  /**
   * Get current JWT token
   */
  getToken(): string | null {
    return this.token
  }

  /**
   * Clear JWT token (logout)
   */
  clearToken(): void {
    this.token = null
  }

  /**
   * Build headers for request
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return headers
  }

  /**
   * Handle response and errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    // Try to parse JSON response
    let body: unknown
    try {
      body = await response.json()
    } catch {
      // Response might not have JSON body
      body = null
    }

    // Handle errors
    if (!response.ok) {
      const bodyObj = body as Record<string, unknown> | null
      const errorMessage =
        (bodyObj?.message as string) || (bodyObj?.error as string) || response.statusText || 'Request failed'

      throw new ApiError(
        response.status,
        response.statusText,
        `${response.status}: ${errorMessage}`,
        body
      )
    }

    return body as T
  }

  /**
   * Make GET request
   */
  async get<T = unknown>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  /**
   * Make POST request
   */
  async post<T = unknown>(path: string, data: unknown): Promise<T> {
    console.log(`🌐 API POST ${path}:`, data);
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse<T>(response)
  }

  /**
   * Make PUT request
   */
  async put<T = unknown>(path: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse<T>(response)
  }

  /**
   * Make DELETE request
   */
  async delete<T = unknown>(path: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })

    return this.handleResponse<T>(response)
  }

  /**
   * Make PATCH request
   */
  async patch<T = unknown>(path: string, data: unknown): Promise<T> {
    const response = await fetch(`${this.baseURL}${path}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    })

    return this.handleResponse<T>(response)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
