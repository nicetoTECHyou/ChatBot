declare namespace TmiTypes {
  export interface ChatUserstate {
    username?: string;
    'display-name'?: string;
    'user-id'?: string;
    mod?: boolean;
    subscriber?: boolean;
    badges?: Record<string, string>;
    'reply-parent-msg-id'?: string;
    [key: string]: any;
  }
  export interface EmoteOffsets {
    [emoteId: string]: Array<[string, string]>;
  }
}

declare module 'tmi.js' {
  export interface Client {
    on(event: string, callback: (...args: any[]) => void): this;
    connect(): Promise<Array<[string, number]>>;
    say(channel: string, message: string): void;
    disconnect(): void;
    readyState: number;
  }
  export interface ClientOptions {
    identity: {
      username: string;
      password: string;
    };
    channels: string[];
    connection: {
      reconnect: boolean;
      secure: boolean;
    };
  }
  function Client(options: ClientOptions): Client;
  export { Client };
  export type ChatUserstate = TmiTypes.ChatUserstate;
  export type EmoteOffsets = TmiTypes.EmoteOffsets;
}
