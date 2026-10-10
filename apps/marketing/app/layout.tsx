import type { ReactNode } from 'react';
export default function RootLayout({children}:{children:ReactNode}) {return <html lang="en"><body style={{fontFamily:'system-ui',maxWidth:900,margin:'60px auto',padding:20}}>{children}</body></html>;}
