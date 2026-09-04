declare module '@clerk/react' {
  import type { ComponentType, ReactNode } from 'react';
  export const ClerkProvider: ComponentType<any>;
  export const SignIn: ComponentType<any>;
  export const SignUp: ComponentType<any>;
  export function useClerk(): any;
  export function useUser(): any;
}
declare module '@clerk/react/internal' {
  export function publishableKeyFromHost(hostname: string, key?: string): string;
}
declare module '@clerk/themes' {
  export const shadcn: any;
}