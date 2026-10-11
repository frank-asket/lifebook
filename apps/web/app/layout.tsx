import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
export const metadata: Metadata = {title:{default:'LifeBook — Grow in the Word',template:'%s | LifeBook'},description:'Daily scripture, prayer, discipleship and teaching in one thoughtful space.'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <ClerkProvider><html lang="en"><body>{children}</body></html></ClerkProvider>}
