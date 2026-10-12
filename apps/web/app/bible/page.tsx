'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, ArrowRight, Search, Library } from 'lucide-react';
import { Shell } from '../../components/shell';
import { api } from '../../lib/api';
type Method = 'THEMATIC' | 'CHARACTER' | 'BOOK' | 'SYSTEMATIC';
type Series = { id:string; title:string; description:string; method:Method; difficulty:string; _count:{lessons:number} };
const categories: {method:Method;title:string;description:string}[] = [
 {method:'THEMATIC',title:'Explore Topics',description:'Faith, prayer, forgiveness and Christian living.'},
 {method:'CHARACTER',title:'Biblical Characters',description:'Study the lives of people in Scripture.'},
 {method:'BOOK',title:'Books of the Bible',description:'Understand each book in its literary context.'},
 {method:'SYSTEMATIC',title:'Christian Doctrine',description:'Explore foundational Christian beliefs.'},
];
export default function BibleStudyPage(){
 const [method,setMethod]=useState<Method|null>(null); const [search,setSearch]=useState(''); const [items,setItems]=useState<Series[]>([]); const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;setLoading(true);api<Series[]>('/bible-studies').then(v=>{if(live)setItems(v)}).catch(e=>{if(live)setError(e instanceof Error?e.message:'Unable to load studies')}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[]);
 const filtered=items.filter(s=>(!method||s.method===method)&&`${s.title} ${s.description}`.toLowerCase().includes(search.toLowerCase()));
 return <Shell title="Bible Study"><span className="eyebrow">EXPLORE · UNDERSTAND · APPLY</span><h1 className="page-heading">Explore the Bible</h1><p className="subheading">Discover Scripture through guided, context-aware studies.</p>
 <div className="study-categories">{categories.map(c=><button key={c.method} type="button" className={`card study-category ${method===c.method?'study-selected':''}`} onClick={()=>setMethod(method===c.method?null:c.method)} aria-pressed={method===c.method}><BookOpen size={25}/><h3>{c.title}</h3><p className="muted">{c.description}</p></button>)}</div>
 <div className="study-section-heading"><h2>Study library</h2><div className="searchbar"><Search size={17}/><input aria-label="Search Bible studies" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search studies"/></div></div>
 {loading&&<p className="muted" role="status">Loading studies…</p>}{error&&<p className="alert" role="alert">{error}</p>}
 {!loading&&!error&&filtered.length===0&&<div className="card study-empty"><Library size={27}/><h3>No published studies here yet</h3><p className="muted">Our editorial team is preparing Scripture-centered lessons. Choose another category or return soon.</p>{method&&<button className="btn btn-soft" onClick={()=>setMethod(null)}>View all categories</button>}</div>}
 <div className="study-list">{filtered.map(s=><Link href={`/bible/${s.id}`} className="card study-item" key={s.id}><span className="eyebrow">{categories.find(c=>c.method===s.method)?.title} · {s._count.lessons} lessons</span><h3>{s.title}</h3><p className="muted">{s.description}</p><span className="text-link">Explore study <ArrowRight size={15}/></span></Link>)}</div></Shell>
}
