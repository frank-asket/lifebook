'use client';
import {createContext,useContext,useEffect,useState} from 'react';
export type Language = 'en'|'fr';
const LanguageContext=createContext<{language:Language;setLanguage:(value:Language)=>void}>({language:'en',setLanguage:()=>{}});
export function LanguageProvider({children}:{children:React.ReactNode}){
 const [language,setLanguage]=useState<Language>('en');
 useEffect(()=>{let saved: string | null = null;try {saved=window.localStorage.getItem('lifebook-language')} catch { /* Device storage can be unavailable. */ }const detected=navigator.language.toLowerCase().startsWith('fr')?'fr':'en';setLanguage(saved==='fr'||saved==='en'?saved:detected)},[]);
 useEffect(()=>{document.documentElement.lang=language;document.documentElement.dataset.language=language},[language]);
 const change=(value:Language)=>{setLanguage(value);try {window.localStorage.setItem('lifebook-language',value)} catch { /* Language still changes for this session. */ }};
 return <LanguageContext.Provider value={{language,setLanguage:change}}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){return useContext(LanguageContext)}
export function L({en,fr}:{en:string;fr:string}){const {language}=useLanguage();return <>{language==='fr'?fr:en}</>}
