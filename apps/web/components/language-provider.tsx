'use client';
import {createContext,useContext,useEffect,useState} from 'react';
export type Language = 'en'|'fr';
const LanguageContext=createContext<{language:Language;setLanguage:(value:Language)=>void}>({language:'en',setLanguage:()=>{}});
export function LanguageProvider({children}:{children:React.ReactNode}){
 const [language,setLanguage]=useState<Language>('en');
 useEffect(()=>{const saved=window.localStorage.getItem('lifebook-language');const detected=navigator.language.toLowerCase().startsWith('fr')?'fr':'en';setLanguage(saved==='fr'||saved==='en'?saved:detected)},[]);
 useEffect(()=>{document.documentElement.lang=language;document.documentElement.dataset.language=language},[language]);
 const change=(value:Language)=>{setLanguage(value);window.localStorage.setItem('lifebook-language',value)};
 return <LanguageContext.Provider value={{language,setLanguage:change}}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){return useContext(LanguageContext)}
export function L({en,fr}:{en:string;fr:string}){const {language}=useLanguage();return <>{language==='fr'?fr:en}</>}
