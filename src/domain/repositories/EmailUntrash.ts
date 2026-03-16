export interface EmailUntrash {
  untrash(ids: readonly string[], accessToken: string): Promise<void>;
}
