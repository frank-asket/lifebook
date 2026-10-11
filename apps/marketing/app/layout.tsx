import type {Metadata} from 'next';
import './globals.css';
import {SiteHeader} from '../components/site-header';
import {SiteFooter} from '../components/site-footer';
export const metadata:Metadata={title:{default:'LifeBook — Grow in the Word, every day',template:'%s | LifeBook'},description:'Make room for Scripture, prayer, and spiritual growth. Discover daily Bible meditation, a private prayer space, and meaningful Christian teaching with LifeBook.',openGraph:{title:'LifeBook — A little closer, every day',description:'A thoughtful home for Scripture, prayer, and spiritual growth.',type:'website'},robots:{index:true,follow:true}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><SiteHeader/>{children}<SiteFooter/></body></html>}
