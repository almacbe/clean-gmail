export interface EmailDeleter {
  trash(ids: readonly string[], accessToken: string): Promise<void>;
}
