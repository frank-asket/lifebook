import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
export default function Home() {return <main style={{padding:32,fontFamily:'sans-serif'}}><h1>LifeBook</h1>
<SignedOut><p>Welcome to your spiritual learning journey.</p><SignInButton /></SignedOut>
<SignedIn><UserButton /><p>Your account is connected.</p><Link href="/onboarding">Set up your learning profile</Link></SignedIn>
</main>}
