import { clerkMiddleware } from '@clerk/nextjs/server';

// Public marketing routes remain public; protected handlers call auth().
export default clerkMiddleware();
export const config = { matcher: ['/((?!_next|.*\\..*).*)', '/'] };
