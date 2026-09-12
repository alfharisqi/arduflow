import{r as o,x as ce,q as ue,T as he,d as me,U as pe,a as xe,j as e,z as ge,A as je}from"./index-Cq-yfF2z.js";import{g as be,b as fe,p as ye,e as ve}from"./AdminChrome-BEsl1YtH.js";const I=ge(void 0,"/api/materi-api.php"),we=`${je}/uploads/materi`,k=6;function L(t){const d=String(t||"").trim();if(!d)return"";try{const i=new URL(d,window.location.origin),h=i.searchParams.get("file");if(h)return String(h).split(/[\\/]/).pop()||"";const s=decodeURIComponent(i.pathname||"");if(/\/uploads\/materi\//i.test(s)||/\/storage\/materi\//i.test(s))return s.split("/").pop()||""}catch{}return/^[^/\\]+\.(jpe?g|png|webp|gif|svg)$/i.test(d)?d:/(?:uploads|storage)\/materi\//i.test(d)&&d.split(/[\\/]/).pop()||""}function Se(t,d=""){const i=String(t||"").trim();if(/^(data:image\/|blob:)/i.test(i))return i;const h=L(i)||L(d);return h?`${we}/`+encodeURIComponent(h):/^https?:\/\//i.test(i)?i:""}function Te(t){const d=L(t);return d?`${I}?action=image&scope=card&file=`+encodeURIComponent(d):""}function _(t,d){const i=t.currentTarget;if(i.dataset.fallbackApplied==="1"){i.style.display="none";return}const h=Te(d);if(!h){i.style.display="none";return}i.dataset.fallbackApplied="1",i.src=h}function Ae({searchTerm:t,onSearchChange:d}){return e.jsxs("header",{className:"admin-dashboard-topbar",children:[e.jsxs("label",{className:"admin-dashboard-search",children:[e.jsx("span",{"aria-hidden":"true"}),e.jsx("input",{type:"search",placeholder:"Cari tutorial / materi","aria-label":"Cari tutorial atau materi",value:t,onChange:i=>d(i.target.value)})]}),e.jsxs("div",{className:"admin-dashboard-account",children:[e.jsx(ve,{}),e.jsx("span",{className:"admin-dashboard-avatar","aria-hidden":"true"}),e.jsxs("span",{children:[e.jsx("strong",{children:"Admin"}),e.jsx("small",{children:"Super Admin"})]})]})]})}function w({children:t}){const d=String(t||"-"),i=d.toLowerCase().replace(/\s+/g,"-").replace(/\//g,"-");return e.jsx("span",{className:`admin-users-badge admin-users-badge--${i} admin-tutorial-badge admin-tutorial-badge--${i}`,children:d})}function Ne(t){const d=String(t||"draft").toLowerCase();return d==="published"?"Published":d==="pending_review"?"Pending Review":d==="archived"?"Archived":"Draft"}function Y(t=""){return String(t||"").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/\s+/g," ").trim()}function X(t){const d=(t==null?void 0:t.body_text)??(t==null?void 0:t.content)??(t==null?void 0:t.code_content)??"",i=Y(d);return i?i.length>180?`${i.slice(0,180)}…`:i:""}function P(t,d=!1){if(!t)return"-";const i=new Date(t);return Number.isNaN(i.getTime())?t:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",year:"numeric",...d?{hour:"2-digit",minute:"2-digit"}:{}}).format(i)}function ke(t){var s;const d=Ne(t.status),i=String(t.card_image_name||t.cardImageName||"").trim(),h=Se(t.card_image_url||t.cardImageUrl||"",i);return{...t,id:t.id,title:t.title||"Tanpa Judul",slug:t.slug||"",description:t.short_description||"-",fullDescription:t.full_description||"-",category:t.category||"-",level:t.difficulty_level||"-",estimatedTime:t.estimated_time||"-",cardImageName:i,cardImageUrl:h,status:d,author:t.author||"Admin",viewer:Number(t.viewer||0),completed:Number(t.completed||0),totalSlides:Number(t.total_slides||((s=t.slides)==null?void 0:s.length)||0),createdAtRaw:t.created_at||null,updatedAtRaw:t.updated_at||t.created_at||null,createdAt:P(t.created_at),publishedAt:d==="Published"?P(t.published_at||t.created_at):"-",updatedAt:P(t.updated_at||t.created_at),updatedAtWithTime:P(t.updated_at||t.created_at,!0)}}function Pe(){var Q,Z;const[t,d]=o.useState(be),[i,h]=o.useState([]),[s,j]=o.useState(null),[B,U]=o.useState(!0),[M,z]=o.useState(""),[C,F]=o.useState(null),[S,R]=o.useState(""),[T,G]=o.useState(""),[A,J]=o.useState(""),[N,O]=o.useState(""),[p,b]=o.useState(1),[x,f]=o.useState(null),[W,ee]=o.useState({top:0,left:0}),D=o.useRef(new Map),ae=()=>{d(a=>{const n=!a;return ye(n),n})},E=async()=>{U(!0),z("");try{const a=await fetch(I,{method:"GET",headers:{Accept:"application/json"}}),n=await a.text();let r;try{r=n?JSON.parse(n):{}}catch{throw new Error(`Response API bukan JSON yang valid. Isi response: ${n.slice(0,250)}`)}if(!a.ok||r.success===!1)throw new Error(r.message||`API mengembalikan HTTP ${a.status}.`);const c=(Array.isArray(r.data)?r.data:[]).map(ke);h(c),j(u=>u&&c.find(m=>String(m.id)===String(u.id))||null),console.group("DEBUG ADMIN TUTORIAL SQLITE"),console.log("Method:","GET"),console.log("Endpoint:",I),console.log("Response:",r),console.log("Data tabel:",c),console.groupEnd()}catch(a){console.error("Gagal mengambil data materi:",a),h([]),j(null),z(a.message||"Data materi tidak dapat diambil dari API deploy.")}finally{U(!1)}},H=a=>{f(null),j(a)},te=a=>{f(null),a!=null&&a.id&&(window.location.href=`/admin/tutorial/tambah?id=${encodeURIComponent(a.id)}`)},ie=async a=>{if(f(null),!(!(a!=null&&a.id)||C!==null||!window.confirm(`Hapus materi "${a.title}"? Data materi dan file gambar terkait akan dihapus.`))){F(a.id);try{const r=await fetch(`${I}?id=${encodeURIComponent(a.id)}`,{method:"DELETE",headers:{Accept:"application/json"}}),l=await r.text();let c={};try{c=l?JSON.parse(l):{}}catch{throw new Error(`Response hapus bukan JSON yang valid. HTTP ${r.status}.`)}if(!r.ok||c.success===!1)throw new Error(c.message||`Gagal menghapus materi. HTTP ${r.status}.`);j(u=>(u==null?void 0:u.id)===a.id?null:u),await E()}catch(r){console.error("Gagal menghapus materi:",r),window.alert(r.message||"Materi gagal dihapus dari server.")}finally{F(null)}}};o.useEffect(()=>{E()},[]),o.useEffect(()=>{if(x===null)return;function a(r){var l,c,u,m;!((c=(l=r.target).closest)!=null&&c.call(l,".admin-users-action-menu"))&&!((m=(u=r.target).closest)!=null&&m.call(u,".admin-users-action-popover"))&&f(null)}function n(r){r.key==="Escape"&&f(null)}return document.addEventListener("mousedown",a),document.addEventListener("keydown",n),()=>{document.removeEventListener("mousedown",a),document.removeEventListener("keydown",n)}},[x]),o.useEffect(()=>{if(x===null)return;function a(){const n=D.current.get(x);if(!n)return;const r=n.getBoundingClientRect(),l=190,c=8,u=Math.max(12,Math.min(window.innerWidth-l-12,r.right-l)),m=Math.max(12,Math.min(window.innerHeight-12,r.bottom+c));ee({top:m,left:u})}return a(),window.addEventListener("resize",a),window.addEventListener("scroll",a,!0),()=>{window.removeEventListener("resize",a),window.removeEventListener("scroll",a,!0)}},[x]);const re=o.useMemo(()=>{const a=i.length,n=i.filter(m=>m.status==="Published").length,r=i.filter(m=>m.status==="Draft").length,l=i.filter(m=>m.status==="Pending Review").length,c=a?(n/a*100).toFixed(1):"0.0",u=a?(r/a*100).toFixed(1):"0.0";return[{label:"Total Tutorial",value:String(a),note:"Data dari API",icon:ce,tone:"blue"},{label:"Tutorial Published",value:String(n),note:`${c}% dari total`,icon:ue,tone:"green"},{label:"Draft Belum Publish",value:String(r),note:`${u}% dari total`,icon:he,tone:"orange"},{label:"Total Viewer / Pembaca",value:"0",note:"Field viewer belum tersedia",icon:me,tone:"blue"},{label:"Materi Paling Populer",value:"Belum tersedia",note:"Butuh data viewer",icon:pe,tone:"purple"},{label:"Materi Perlu Revisi",value:String(l),note:"Status Pending Review",icon:xe,tone:"red"}]},[i]),ne=o.useMemo(()=>[...new Set(i.map(a=>a.category).filter(Boolean))],[i]),se=o.useMemo(()=>[...new Set(i.map(a=>a.level).filter(Boolean))],[i]),g=o.useMemo(()=>{const a=S.trim().toLowerCase();return i.filter(n=>{const r=!a||n.title.toLowerCase().includes(a)||n.description.toLowerCase().includes(a)||n.slug.toLowerCase().includes(a),l=!T||n.status===T,c=!A||n.category===A,u=!N||n.level===N;return r&&l&&c&&u})},[i,S,T,A,N]),K=o.useMemo(()=>[...i].sort((a,n)=>{const r=new Date(a.createdAtRaw||0).getTime();return new Date(n.createdAtRaw||0).getTime()-r}).slice(0,5),[i]),V=o.useMemo(()=>i.filter(a=>a.status==="Draft").slice(0,5),[i]),q=o.useMemo(()=>{const a=i.filter(l=>!l.card_image_name).length,n=i.filter(l=>!l.category||l.category==="-").length,r=i.filter(l=>String(l.full_description||"").trim().length<300).length;return[["Thumbnail kosong",a],["Link rusak",0],["Belum punya kategori",n],["Konten terlalu pendek (< 300 kata)",r],["Belum ada quiz / praktik",0]]},[i]);o.useMemo(()=>[...i].sort((a,n)=>{const r=new Date(a.updatedAtRaw||0).getTime();return new Date(n.updatedAtRaw||0).getTime()-r}).slice(0,5).map(a=>[`Tutorial "${a.title}" ${a.status==="Published"?"dipublish / diupdate":"disimpan"}`,a.updatedAtWithTime,a.status==="Published"?"green":a.status==="Pending Review"?"purple":"orange"]),[i]),o.useEffect(()=>{b(1)},[S,T,A,N]);const y=Math.max(1,Math.ceil(g.length/k));o.useEffect(()=>{b(a=>Math.min(a,y))},[y]);const $=o.useMemo(()=>{const a=(p-1)*k;return g.slice(a,a+k)},[g,p]),v=o.useMemo(()=>i.find(a=>String(a.id)===String(x))||null,[i,x]),le=g.length?(p-1)*k+1:0,de=Math.min(p*k,g.length),oe=()=>{R(""),G(""),J(""),O(""),b(1)};return e.jsxs("main",{className:`admin-dashboard-page admin-tutorial-page${t?" admin-dashboard-page--collapsed":""}`,children:[e.jsx(fe,{isCollapsed:t,onToggleCollapse:ae}),e.jsxs("section",{className:"admin-dashboard-main","aria-label":"Tutorial dan materi admin",children:[e.jsx(Ae,{searchTerm:S,onSearchChange:R}),e.jsxs("div",{className:"admin-users-layout admin-tutorial-layout",children:[e.jsxs("section",{className:"admin-users-content admin-tutorial-content",children:[e.jsx("div",{className:"admin-users-heading",children:e.jsxs("div",{children:[e.jsx("h1",{children:"Tutorial / Materi"}),e.jsxs("p",{children:["Dashboard ",e.jsx("span",{children:"/"})," Tutorial / Materi"]})]})}),M&&e.jsx("div",{className:"admin-form-message is-error",role:"alert",style:{marginBottom:16},children:M}),e.jsx("section",{className:"admin-users-summary","aria-label":"Ringkasan tutorial",children:re.map(a=>e.jsxs("article",{className:"admin-users-stat",children:[e.jsx("span",{className:`admin-tutorial-stat-tone is-${a.tone}`,children:e.jsx("img",{src:a.icon,alt:""})}),e.jsxs("div",{children:[e.jsx("p",{children:a.label}),e.jsx("strong",{children:a.value}),e.jsx("small",{children:a.note})]})]},a.label))}),e.jsxs("section",{className:"admin-users-filter","aria-label":"Filter tutorial",children:[e.jsxs("div",{className:"admin-users-filter-row",children:[e.jsx("label",{className:"admin-users-search",children:e.jsx("input",{type:"search",placeholder:"Cari judul tutorial...",value:S,onChange:a=>R(a.target.value)})}),e.jsx("button",{type:"button",onClick:oe,children:"Reset Filter"}),e.jsx("button",{type:"button",onClick:E,children:B?"Memuat...":"Muat Ulang"}),e.jsx("a",{className:"admin-users-primary",href:"/admin/tutorial/tambah",children:"+ Tambah Materi"})]}),e.jsxs("div",{className:"admin-users-select-grid",children:[e.jsxs("label",{children:[e.jsx("span",{children:"Status"}),e.jsxs("select",{value:T,onChange:a=>G(a.target.value),children:[e.jsx("option",{value:"",children:"Semua Status"}),e.jsx("option",{value:"Published",children:"Published"}),e.jsx("option",{value:"Draft",children:"Draft"}),e.jsx("option",{value:"Pending Review",children:"Pending Review"}),e.jsx("option",{value:"Archived",children:"Archived"})]})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Kategori"}),e.jsxs("select",{value:A,onChange:a=>J(a.target.value),children:[e.jsx("option",{value:"",children:"Semua Kategori"}),ne.map(a=>e.jsx("option",{value:a,children:a},a))]})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Level"}),e.jsxs("select",{value:N,onChange:a=>O(a.target.value),children:[e.jsx("option",{value:"",children:"Semua Level"}),se.map(a=>e.jsx("option",{value:a,children:a},a))]})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Author / Admin"}),e.jsx("select",{value:"",disabled:!0,children:e.jsx("option",{value:"",children:"Admin"})})]})]})]}),e.jsxs("section",{className:"admin-users-table-card",children:[e.jsxs("div",{className:"admin-users-table-header",children:[e.jsxs("div",{children:[e.jsx("h2",{children:"Daftar Tutorial / Materi"}),e.jsxs("p",{children:[g.length," materi ditemukan"]})]}),e.jsxs("span",{children:[$.length," ditampilkan"]})]}),e.jsx("div",{className:"admin-tutorial-table-scroll",children:e.jsxs("table",{className:"admin-users-table admin-tutorial-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Judul Tutorial"}),e.jsx("th",{children:"Kategori"}),e.jsx("th",{children:"Level"}),e.jsx("th",{children:"Status"}),e.jsx("th",{children:"Author"}),e.jsx("th",{children:"Viewer"}),e.jsx("th",{children:"Selesai"}),e.jsx("th",{children:"Tgl Dibuat"}),e.jsx("th",{children:"Tgl Publish"}),e.jsx("th",{children:"Update Terakhir"}),e.jsx("th",{children:"Aksi"})]})}),e.jsx("tbody",{children:B?e.jsx("tr",{children:e.jsx("td",{colSpan:"11",style:{textAlign:"center",padding:28},children:"Memuat data materi dari API deploy..."})}):M?e.jsx("tr",{children:e.jsxs("td",{colSpan:"11",style:{textAlign:"center",padding:28},children:["Gagal mengambil data SQLite. ",M]})}):$.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:"11",style:{textAlign:"center",padding:28},children:"Belum ada data materi yang cocok dengan filter."})}):$.map((a,n)=>{const r=String(a.id??a.slug??a.title);return e.jsxs("tr",{className:(s==null?void 0:s.id)===a.id?"is-selected":"",children:[e.jsx("td",{children:e.jsxs("button",{type:"button",className:"admin-users-name-button",onClick:()=>H(a),children:[a.cardImageUrl?e.jsx("img",{className:`admin-tutorial-thumb is-${n%4}`,src:a.cardImageUrl,alt:`Thumbnail ${a.title}`,loading:"lazy",onError:l=>_(l,a.cardImageName)}):e.jsx("span",{className:`admin-tutorial-thumb is-${n%4}`,"aria-hidden":"true"}),e.jsxs("span",{children:[e.jsx("b",{children:a.title}),e.jsx("small",{children:a.description})]})]})}),e.jsx("td",{children:e.jsx(w,{children:a.category})}),e.jsx("td",{children:e.jsx(w,{children:a.level})}),e.jsx("td",{children:e.jsx(w,{children:a.status})}),e.jsx("td",{children:a.author}),e.jsx("td",{children:a.viewer}),e.jsx("td",{children:a.completed}),e.jsx("td",{children:a.createdAt}),e.jsx("td",{children:a.publishedAt}),e.jsx("td",{children:a.updatedAt}),e.jsx("td",{children:e.jsx("div",{className:"admin-users-actions admin-users-action-menu",children:e.jsx("button",{type:"button",className:"admin-users-action-trigger",ref:l=>{l?D.current.set(r,l):D.current.delete(r)},"aria-label":`Buka aksi untuk ${a.title}`,"aria-expanded":String(x)===r,onClick:()=>f(l=>String(l)===r?null:r),children:"..."})})})]},a.id||a.slug||a.title)})})]})}),e.jsxs("div",{className:"admin-users-pagination",children:[e.jsx("button",{type:"button",onClick:()=>b(a=>Math.max(1,a-1)),disabled:p<=1,children:"Previous"}),e.jsx("div",{children:Array.from({length:y},(a,n)=>n+1).slice(Math.max(0,p-3),Math.max(0,p-3)+5).map(a=>e.jsx("button",{type:"button",className:a===p?"is-active":"",onClick:()=>b(a),children:a},a))}),e.jsxs("span",{children:["Page ",p," of ",y,e.jsxs("small",{children:["Menampilkan ",le," - ",de," dari"," ",g.length," materi"]})]}),e.jsx("button",{type:"button",onClick:()=>b(a=>Math.min(y,a+1)),disabled:p>=y,children:"Next"})]})]}),e.jsxs("section",{className:"admin-users-bottom admin-tutorial-bottom-program",children:[e.jsxs("article",{className:"admin-users-panel",children:[e.jsx("h2",{children:"Materi Terbaru"}),K.length===0?e.jsx("p",{children:"Belum ada materi."}):K.map((a,n)=>e.jsxs("p",{children:[a.cardImageUrl?e.jsx("img",{className:"admin-tutorial-mini-thumb",src:a.cardImageUrl,alt:"",onError:r=>_(r,a.cardImageName)}):e.jsx("span",{className:`admin-tutorial-mini-thumb admin-tutorial-thumb is-${n%4}`,"aria-hidden":"true"}),e.jsx("b",{children:a.title}),e.jsx("span",{children:a.category}),e.jsx("span",{children:a.createdAt}),e.jsx(w,{children:a.status})]},a.id||a.slug))]}),e.jsxs("article",{className:"admin-users-panel",children:[e.jsx("h2",{children:"Draft Perlu Dilanjutkan"}),V.length===0?e.jsx("p",{children:"Tidak ada draft."}):V.map(a=>e.jsxs("p",{children:[e.jsx("span",{className:"admin-tutorial-draft-dot","aria-hidden":"true"}),e.jsx("b",{children:a.title}),e.jsx("span",{children:a.author}),e.jsx("span",{children:a.updatedAt}),e.jsx(w,{children:a.status})]},a.id||a.slug))]}),e.jsxs("article",{className:"admin-users-panel admin-tutorial-summary-panel",children:[e.jsx("h2",{children:"Ringkasan Materi"}),e.jsxs("p",{children:[e.jsx("span",{children:"Published"}),e.jsx("strong",{children:i.filter(a=>a.status==="Published").length})]}),e.jsxs("p",{children:[e.jsx("span",{children:"Draft"}),e.jsx("strong",{children:i.filter(a=>a.status==="Draft").length})]}),e.jsxs("p",{children:[e.jsx("span",{children:"Pending Review"}),e.jsx("strong",{children:i.filter(a=>a.status==="Pending Review").length})]}),e.jsxs("p",{children:[e.jsx("span",{children:((Q=q[0])==null?void 0:Q[0])||"Thumbnail kosong"}),e.jsx("strong",{children:((Z=q[0])==null?void 0:Z[1])||0})]}),e.jsx("a",{href:"/admin/tutorial/tambah",className:"admin-users-primary",children:"Buat Materi Baru"}),e.jsx("button",{type:"button",onClick:E,children:"Refresh Data SQLite"})]})]})]}),v?e.jsxs("div",{className:"admin-users-action-popover",role:"menu",style:{top:`${W.top}px`,left:`${W.left}px`},children:[e.jsx("button",{type:"button",role:"menuitem",onClick:()=>H(v),children:"Detail"}),e.jsx("button",{type:"button",role:"menuitem",onClick:()=>te(v),children:"Edit Materi"}),e.jsx("button",{type:"button",role:"menuitem",className:"admin-users-action-danger",disabled:C===v.id,onClick:()=>ie(v),children:C===v.id?"Menghapus...":"Hapus Materi"})]}):null,e.jsx("style",{children:`
            .admin-tutorial-modal-backdrop {
              position: fixed;
              inset: 0;
              z-index: 10000;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              background: rgba(15, 23, 42, 0.22);
              backdrop-filter: blur(1px);
            }

            .admin-tutorial-modal {
              width: min(760px, calc(100vw - 32px));
              max-height: calc(100vh - 48px);
              overflow: hidden;
              border: 1px solid #e2e8f0;
              border-radius: 18px;
              background: #fff;
              box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
            }

            .admin-tutorial-modal .admin-tutorial-detail-head {
              position: sticky;
              top: 0;
              z-index: 2;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 18px 22px;
              border-bottom: 1px solid #e5e7eb;
              background: #fff;
            }

            .admin-tutorial-modal .admin-tutorial-detail-head h2 {
              margin: 0;
              font-size: 18px;
            }

            .admin-tutorial-modal .admin-tutorial-detail-head button {
              width: 36px;
              height: 36px;
              border: 0;
              border-radius: 10px;
              background: #f1f5f9;
              font-size: 24px;
              line-height: 1;
              cursor: pointer;
            }

            .admin-tutorial-modal-body {
              max-height: calc(100vh - 132px);
              overflow-y: auto;
              padding: 22px;
            }

            .admin-tutorial-modal .admin-tutorial-detail-profile {
              display: flex;
              align-items: center;
              gap: 16px;
              padding-bottom: 20px;
              border-bottom: 1px solid #eef2f7;
            }

            .admin-tutorial-modal .admin-tutorial-detail-image {
              width: 108px;
              height: 80px;
              min-width: 108px;
              object-fit: cover;
              border-radius: 12px;
              background: #eef2f7;
            }

            .admin-tutorial-modal .admin-tutorial-detail-profile h3 {
              margin: 0 0 10px;
              font-size: 21px;
            }

            .admin-tutorial-detail-list {
              display: grid;
              grid-template-columns: 150px minmax(0, 1fr);
              gap: 12px 18px;
              margin: 22px 0;
            }

            .admin-tutorial-detail-list dt {
              font-weight: 700;
              color: #475569;
            }

            .admin-tutorial-detail-list dd {
              margin: 0;
              color: #1e293b;
              overflow-wrap: anywhere;
            }

            .admin-tutorial-modal-section {
              margin-top: 20px;
              padding-top: 18px;
              border-top: 1px solid #e2e8f0;
            }

            .admin-tutorial-modal-section > h3 {
              margin: 0 0 10px;
              font-size: 15px;
              color: #0f172a;
            }

            .admin-tutorial-modal-section > p {
              margin: 0;
              color: #475569;
              line-height: 1.65;
              white-space: pre-wrap;
            }

            .admin-tutorial-chapter-list {
              display: grid;
              gap: 12px;
            }

            .admin-tutorial-chapter-card {
              padding: 14px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              background: #f8fafc;
            }

            .admin-tutorial-chapter-card > header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              margin-bottom: 10px;
            }

            .admin-tutorial-chapter-card > header strong {
              color: #0f172a;
            }

            .admin-tutorial-chapter-card > header small {
              color: #64748b;
            }

            .admin-tutorial-material-list {
              display: grid;
              gap: 8px;
            }

            .admin-tutorial-material-item {
              padding: 11px 12px;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              background: #fff;
            }

            .admin-tutorial-material-item strong {
              display: block;
              margin-bottom: 4px;
              color: #1e293b;
              font-size: 14px;
            }

            .admin-tutorial-material-item small {
              display: block;
              color: #64748b;
              line-height: 1.5;
            }

            .admin-tutorial-modal .admin-tutorial-detail-stats {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
              margin-top: 20px;
            }

            .admin-tutorial-modal .admin-tutorial-detail-stats article {
              padding: 16px;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              background: #fff;
            }

            .admin-tutorial-modal .admin-tutorial-detail-stats article span,
            .admin-tutorial-modal .admin-tutorial-detail-stats article strong {
              display: block;
            }

            .admin-tutorial-modal .admin-tutorial-detail-stats article span {
              margin-bottom: 8px;
              color: #64748b;
              font-size: 13px;
            }

            .admin-tutorial-modal .admin-tutorial-history {
              margin-top: 18px;
              padding-top: 18px;
              border-top: 1px solid #e2e8f0;
            }

            .admin-tutorial-modal .admin-tutorial-history h3 {
              margin: 0 0 8px;
              font-size: 15px;
            }

            .admin-tutorial-modal .admin-tutorial-history p {
              margin: 0;
              color: #64748b;
            }

            @media (max-width: 640px) {
              .admin-tutorial-modal-backdrop {
                padding: 12px;
              }

              .admin-tutorial-modal {
                width: 100%;
                max-height: calc(100vh - 24px);
                border-radius: 14px;
              }

              .admin-tutorial-modal-body {
                padding: 16px;
              }

              .admin-tutorial-detail-list {
                grid-template-columns: 1fr;
                gap: 5px;
              }

              .admin-tutorial-detail-list dd {
                margin-bottom: 10px;
              }

              .admin-tutorial-modal .admin-tutorial-detail-stats {
                grid-template-columns: 1fr;
              }
            }
          `}),s&&e.jsx("div",{className:"admin-tutorial-modal-backdrop",role:"presentation",onMouseDown:a=>{a.target===a.currentTarget&&j(null)},children:e.jsxs("section",{className:"admin-tutorial-modal",role:"dialog","aria-modal":"true","aria-labelledby":"admin-tutorial-detail-title",children:[e.jsxs("div",{className:"admin-tutorial-detail-head",children:[e.jsx("h2",{id:"admin-tutorial-detail-title",children:"Detail Materi"}),e.jsx("button",{type:"button","aria-label":"Tutup detail",onClick:()=>j(null),children:"×"})]}),e.jsxs("div",{className:"admin-tutorial-modal-body",children:[e.jsxs("div",{className:"admin-tutorial-detail-profile",children:[s.cardImageUrl?e.jsx("img",{className:"admin-tutorial-detail-image",src:s.cardImageUrl,alt:`Thumbnail ${s.title}`,onError:a=>_(a,s.cardImageName)}):e.jsx("span",{className:"admin-tutorial-detail-image","aria-hidden":"true"}),e.jsxs("div",{children:[e.jsx("h3",{children:s.title}),e.jsx(w,{children:s.status})]})]}),e.jsxs("dl",{className:"admin-tutorial-detail-list",children:[e.jsx("dt",{children:"Kategori"}),e.jsx("dd",{children:s.category}),e.jsx("dt",{children:"Level"}),e.jsx("dd",{children:s.level}),e.jsx("dt",{children:"Author"}),e.jsx("dd",{children:s.author}),e.jsx("dt",{children:"Slug"}),e.jsx("dd",{children:s.slug||"-"}),e.jsx("dt",{children:"Total Bab"}),e.jsx("dd",{children:Array.isArray(s.chapters)?s.chapters.length:0}),e.jsx("dt",{children:"Total Materi"}),e.jsx("dd",{children:s.totalSlides})]}),e.jsxs("section",{className:"admin-tutorial-modal-section",children:[e.jsx("h3",{children:"Deskripsi Singkat"}),e.jsx("p",{children:s.description||"-"})]}),e.jsxs("section",{className:"admin-tutorial-modal-section",children:[e.jsx("h3",{children:"Deskripsi Lengkap"}),e.jsx("p",{children:Y(s.fullDescription)||"-"})]}),e.jsxs("section",{className:"admin-tutorial-modal-section",children:[e.jsx("h3",{children:"Bab & Materi"}),Array.isArray(s.chapters)&&s.chapters.length>0?e.jsx("div",{className:"admin-tutorial-chapter-list",children:s.chapters.map((a,n)=>{const r=Array.isArray(s.slides)?s.slides.filter(l=>String(l.chapter_id??"")===String(a.id??"")):[];return e.jsxs("article",{className:"admin-tutorial-chapter-card",children:[e.jsxs("header",{children:[e.jsx("strong",{children:a.title||`Bab ${n+1}`}),e.jsxs("small",{children:[r.length," materi"]})]}),r.length>0?e.jsx("div",{className:"admin-tutorial-material-list",children:r.map((l,c)=>e.jsxs("div",{className:"admin-tutorial-material-item",children:[e.jsx("strong",{children:l.title||`Materi ${c+1}`}),e.jsx("small",{children:X(l)||`Jenis: ${l.content_type||"materi"}`})]},l.id??`detail-slide-${n}-${c}`))}):e.jsx("small",{children:"Belum ada materi pada bab ini."})]},a.id??`detail-chapter-${n}`)})}):Array.isArray(s.slides)&&s.slides.length>0?e.jsx("div",{className:"admin-tutorial-material-list",children:s.slides.map((a,n)=>e.jsxs("div",{className:"admin-tutorial-material-item",children:[e.jsx("strong",{children:a.title||`Materi ${n+1}`}),e.jsx("small",{children:X(a)||`Jenis: ${a.content_type||"materi"}`})]},a.id??`detail-slide-${n}`))}):e.jsx("p",{children:"Belum ada bab atau materi."})]}),e.jsxs("section",{className:"admin-tutorial-detail-stats",children:[e.jsxs("article",{children:[e.jsx("span",{children:"Viewer"}),e.jsx("strong",{children:s.viewer})]}),e.jsxs("article",{children:[e.jsx("span",{children:"User Selesai"}),e.jsx("strong",{children:s.completed})]}),e.jsxs("article",{children:[e.jsx("span",{children:"Estimasi Waktu"}),e.jsx("strong",{children:s.estimatedTime})]}),e.jsxs("article",{children:[e.jsx("span",{children:"Tanggal Publish"}),e.jsx("strong",{children:s.publishedAt})]})]}),e.jsxs("section",{className:"admin-tutorial-history",children:[e.jsx("h3",{children:"Riwayat Update Terakhir"}),e.jsxs("p",{children:[s.updatedAtWithTime," oleh"," ",s.author]})]})]})]})})]})]})]})}export{Pe as AdminTutorial};
