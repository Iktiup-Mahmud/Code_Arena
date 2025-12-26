// Extend Clerk's types to include our custom metadata
export {};

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: "USER" | "ADMIN";
    };
  }
}

