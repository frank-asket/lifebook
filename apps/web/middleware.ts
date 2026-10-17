import {clerkMiddleware,createRouteMatcher} from '@clerk/nextjs/server';
const protectedRoutes=createRouteMatcher(['/dashboard(.*)','/onboarding(.*)','/meditation(.*)','/prayer(.*)','/livingword(.*)','/bible(.*)','/discipleship(.*)','/settings(.*)','/care(.*)','/safeguarding(.*)']);
export default clerkMiddleware(async(auth,req)=>{if(protectedRoutes(req))await auth.protect()});
export const config={matcher:['/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ico|woff2?|ttf|map)).*)','/(api|trpc)(.*)']};
