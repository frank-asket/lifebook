export type FaithProfile={journey?:string|null;language?:string|null;learningGoals?:string[];preferredFormats?:string[];personalizationConsent?:boolean;aiProcessingConsent?:boolean};
export type ProfileResponse={userId:string;role:string;profile:FaithProfile|null};
export type Devotional={id:string;title:string;body?:string|null;scriptureRef?:string|null;publishedAt?:string|null};
export type LearningPath={id:string;slug:string;title:string;description?:string|null};
const base=(process.env.NEXT_PUBLIC_API_URL||'').replace(/\/$/,'');
export async function api<T>(path:string,token?:string|null,options:RequestInit={}):Promise<T>{
 if(!base)throw new Error('NEXT_PUBLIC_API_URL is not configured');
 const res=await fetch(`${base}/api/v1${path}`,{...options,cache:'no-store',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers}});
 if(!res.ok){const body=await res.text().catch(()=>'');throw new Error(`API request failed (${res.status})${body?': '+body.slice(0,140):''}`)}
 return res.json() as Promise<T>;
}
export const JOURNEYS=[{value:'EXPLORING',label:'Exploring Christianity',description:'Curious about faith and looking for a place to begin.'},{value:'NEW_BELIEVER',label:'New Believer',description:'Beginning to discover life with Christ.'},{value:'GROWING_BELIEVER',label:'Growing Believer',description:'Building steady habits of scripture and prayer.'},{value:'STRUCTURED_DISCIPLESHIP',label:'Structured Discipleship',description:'Ready to follow a guided learning pathway.'},{value:'MINISTRY_PREPARATION',label:'Ministry Preparation',description:'Exploring biblical foundations for serving others.'},{value:'SERVING_IN_MINISTRY',label:'Serving in Ministry',description:'Seeking to grow while actively serving.'}];
export const GOALS=['Build a daily prayer habit','Understand the Bible','Grow in faith','Learn about Jesus','Explore discipleship','Prepare to serve','Find encouragement','Develop consistency'];
export const FORMATS=['Reading','Audio','Video','Guided reflection'];
