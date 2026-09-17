import{r as o,x as me,q as he,T as pe,d as ge,U as xe,a as je,j as e,z as be,A as fe}from"./index-Dm13A88K.js";import{g as ye,b as ve,p as we,e as Te}from"./AdminChrome-XA90qBGS.js";const C=be(void 0,"/api/materi-api.php"),Se=`${fe}/uploads/materi`,P=6;function U(t){const l=String(t||"").trim();if(!l)return"";try{const i=new URL(l,window.location.origin),u=i.searchParams.get("file");if(u)return String(u).split(/[\\/]/).pop()||"";const s=decodeURIComponent(i.pathname||"");if(/\/uploads\/materi\//i.test(s)||/\/storage\/materi\//i.test(s))return s.split("/").pop()||""}catch{}return/^[^/\\]+\.(jpe?g|png|webp|gif|svg)$/i.test(l)?l:/(?:uploads|storage)\/materi\//i.test(l)&&l.split(/[\\/]/).pop()||""}function Ne(t,l=""){const i=String(t||"").trim();if(/^(data:image\/|blob:)/i.test(i))return i;const u=U(i)||U(l);return u?`${Se}/`+encodeURIComponent(u):/^https?:\/\//i.test(i)?i:""}function Ae(t){const l=U(t);return l?`${C}?action=image&scope=card&file=`+encodeURIComponent(l):""}function B(t,l){const i=t.currentTarget;if(i.dataset.fallbackApplied==="1"){i.style.display="none";return}const u=Ae(l);if(!u){i.style.display="none";return}i.dataset.fallbackApplied="1",i.src=u}function ke({searchTerm:t,onSearchChange:l}){return e.jsxs("header",{className:"admin-dashboard-topbar",children:[e.jsxs("label",{className:"admin-dashboard-search",children:[e.jsx("span",{"aria-hidden":"true"}),e.jsx("input",{type:"search",placeholder:"Cari tutorial / materi","aria-label":"Cari tutorial atau materi",value:t,onChange:i=>l(i.target.value)})]}),e.jsxs("div",{className:"admin-dashboard-account",children:[e.jsx(Te,{}),e.jsx("span",{className:"admin-dashboard-avatar","aria-hidden":"true"}),e.jsxs("span",{children:[e.jsx("strong",{children:"Admin"}),e.jsx("small",{children:"Super Admin"})]})]})]})}function w({children:t}){const l=String(t||"-"),i=l.toLowerCase().replace(/\s+/g,"-").replace(/\//g,"-");return e.jsx("span",{className:`admin-users-badge admin-users-badge--${i} admin-tutorial-badge admin-tutorial-badge--${i}`,children:l})}function Me(t){const l=String(t||"draft").toLowerCase();return l==="published"?"Published":l==="pending_review"?"Pending Review":l==="archived"?"Archived":"Draft"}function Pe(t,l=0){const i=String(t||"").trim().toLowerCase();return i.includes("premium")||i.includes("berbayar")||i==="paid"||Number(l||0)>0?"Premium":i.includes("login")||i.includes("akun")||i==="member"?"Perlu Login":"Gratis"}function ee(t){const l=Math.max(0,Number(t)||0);return new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(l)}function X({accessType:t,price:l=0}){const i=t==="Premium",u=t==="Perlu Login";return e.jsxs("span",{className:`admin-tutorial-access-badge${i?" is-premium":u?" is-login":" is-free"}`,children:[e.jsx("strong",{children:i?"Premium":u?"Login":"Gratis"}),i&&Number(l||0)>0?e.jsx("small",{children:ee(l)}):null]})}function ae(t=""){return String(t||"").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&#039;/g,"'").replace(/\s+/g," ").trim()}function Y(t){const l=(t==null?void 0:t.body_text)??(t==null?void 0:t.content)??(t==null?void 0:t.code_content)??"",i=ae(l);return i?i.length>180?`${i.slice(0,180)}…`:i:""}function _(t,l=!1){if(!t)return"-";const i=new Date(t);return Number.isNaN(i.getTime())?t:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",year:"numeric",...l?{hour:"2-digit",minute:"2-digit"}:{}}).format(i)}function Ie(t){var s,g,T,S;const l=Me(t.status),i=String(t.card_image_name||t.cardImageName||"").trim(),u=Ne(t.card_image_url||t.cardImageUrl||"",i);return{...t,id:t.id,title:t.title||"Tanpa Judul",slug:t.slug||"",description:t.short_description||"-",fullDescription:t.full_description||"-",category:t.category||"-",level:t.difficulty_level||"-",estimatedTime:t.estimated_time||"-",cardImageName:i,cardImageUrl:u,status:l,author:t.author||"Admin",price:Math.max(0,Number(t.price??t.material_price??((s=t.page_settings)==null?void 0:s.price)??0)||0),accessType:Pe(t.access_type??t.accessType??((g=t.page_settings)==null?void 0:g.access_type)??"",t.price??t.material_price??((T=t.page_settings)==null?void 0:T.price)??0),viewer:Number(t.viewer||0),completed:Number(t.completed||0),totalSlides:Number(t.total_slides||((S=t.slides)==null?void 0:S.length)||0),createdAtRaw:t.created_at||null,updatedAtRaw:t.updated_at||t.created_at||null,createdAt:_(t.created_at),publishedAt:l==="Published"?_(t.published_at||t.created_at):"-",updatedAt:_(t.updated_at||t.created_at),updatedAtWithTime:_(t.updated_at||t.created_at,!0)}}function Ce(){var Q,Z;const[t,l]=o.useState(ye),[i,u]=o.useState([]),[s,g]=o.useState(null),[T,S]=o.useState(!0),[I,z]=o.useState(""),[R,F]=o.useState(null),[N,D]=o.useState(""),[A,G]=o.useState(""),[k,J]=o.useState(""),[M,O]=o.useState(""),[p,b]=o.useState(1),[x,f]=o.useState(null),[H,te]=o.useState({top:0,left:0}),L=o.useRef(new Map),ie=()=>{l(a=>{const n=!a;return we(n),n})},E=async()=>{S(!0),z("");try{const a=await fetch(C,{method:"GET",headers:{Accept:"application/json"}}),n=await a.text();let r;try{r=n?JSON.parse(n):{}}catch{throw new Error(`Response API bukan JSON yang valid. Isi response: ${n.slice(0,250)}`)}if(!a.ok||r.success===!1)throw new Error(r.message||`API mengembalikan HTTP ${a.status}.`);const c=(Array.isArray(r.data)?r.data:[]).map(Ie);u(c),g(m=>m&&c.find(h=>String(h.id)===String(m.id))||null),console.group("DEBUG ADMIN TUTORIAL SQLITE"),console.log("Method:","GET"),console.log("Endpoint:",C),console.log("Response:",r),console.log("Data tabel:",c),console.groupEnd()}catch(a){console.error("Gagal mengambil data materi:",a),u([]),g(null),z(a.message||"Data materi tidak dapat diambil dari API deploy.")}finally{S(!1)}},W=a=>{f(null),g(a)},re=a=>{f(null),a!=null&&a.id&&(window.location.href=`/admin/tutorial/tambah?id=${encodeURIComponent(a.id)}`)},se=async a=>{if(f(null),!(!(a!=null&&a.id)||R!==null||!window.confirm(`Hapus materi "${a.title}"? Data materi dan file gambar terkait akan dihapus.`))){F(a.id);try{const r=await fetch(`${C}?id=${encodeURIComponent(a.id)}`,{method:"DELETE",headers:{Accept:"application/json"}}),d=await r.text();let c={};try{c=d?JSON.parse(d):{}}catch{throw new Error(`Response hapus bukan JSON yang valid. HTTP ${r.status}.`)}if(!r.ok||c.success===!1)throw new Error(c.message||`Gagal menghapus materi. HTTP ${r.status}.`);g(m=>(m==null?void 0:m.id)===a.id?null:m),await E()}catch(r){console.error("Gagal menghapus materi:",r),window.alert(r.message||"Materi gagal dihapus dari server.")}finally{F(null)}}};o.useEffect(()=>{E()},[]),o.useEffect(()=>{if(x===null)return;function a(r){var d,c,m,h;!((c=(d=r.target).closest)!=null&&c.call(d,".admin-users-action-menu"))&&!((h=(m=r.target).closest)!=null&&h.call(m,".admin-users-action-popover"))&&f(null)}function n(r){r.key==="Escape"&&f(null)}return document.addEventListener("mousedown",a),document.addEventListener("keydown",n),()=>{document.removeEventListener("mousedown",a),document.removeEventListener("keydown",n)}},[x]),o.useEffect(()=>{if(x===null)return;function a(){const n=L.current.get(x);if(!n)return;const r=n.getBoundingClientRect(),d=190,c=8,m=Math.max(12,Math.min(window.innerWidth-d-12,r.right-d)),h=Math.max(12,Math.min(window.innerHeight-12,r.bottom+c));te({top:h,left:m})}return a(),window.addEventListener("resize",a),window.addEventListener("scroll",a,!0),()=>{window.removeEventListener("resize",a),window.removeEventListener("scroll",a,!0)}},[x]);const ne=o.useMemo(()=>{const a=i.length,n=i.filter(h=>h.status==="Published").length,r=i.filter(h=>h.status==="Draft").length,d=i.filter(h=>h.status==="Pending Review").length,c=a?(n/a*100).toFixed(1):"0.0",m=a?(r/a*100).toFixed(1):"0.0";return[{label:"Total Tutorial",value:String(a),note:"Data dari API",icon:me,tone:"blue"},{label:"Tutorial Published",value:String(n),note:`${c}% dari total`,icon:he,tone:"green"},{label:"Draft Belum Publish",value:String(r),note:`${m}% dari total`,icon:pe,tone:"orange"},{label:"Total Viewer / Pembaca",value:"0",note:"Field viewer belum tersedia",icon:ge,tone:"blue"},{label:"Materi Paling Populer",value:"Belum tersedia",note:"Butuh data viewer",icon:xe,tone:"purple"},{label:"Materi Perlu Revisi",value:String(d),note:"Status Pending Review",icon:je,tone:"red"}]},[i]),le=o.useMemo(()=>[...new Set(i.map(a=>a.category).filter(Boolean))],[i]),de=o.useMemo(()=>[...new Set(i.map(a=>a.level).filter(Boolean))],[i]),j=o.useMemo(()=>{const a=N.trim().toLowerCase();return i.filter(n=>{const r=!a||n.title.toLowerCase().includes(a)||n.description.toLowerCase().includes(a)||n.slug.toLowerCase().includes(a),d=!A||n.status===A,c=!k||n.category===k,m=!M||n.level===M;return r&&d&&c&&m})},[i,N,A,k,M]),K=o.useMemo(()=>[...i].sort((a,n)=>{const r=new Date(a.createdAtRaw||0).getTime();return new Date(n.createdAtRaw||0).getTime()-r}).slice(0,5),[i]),V=o.useMemo(()=>i.filter(a=>a.status==="Draft").slice(0,5),[i]),q=o.useMemo(()=>{const a=i.filter(d=>!d.card_image_name).length,n=i.filter(d=>!d.category||d.category==="-").length,r=i.filter(d=>String(d.full_description||"").trim().length<300).length;return[["Thumbnail kosong",a],["Link rusak",0],["Belum punya kategori",n],["Konten terlalu pendek (< 300 kata)",r],["Belum ada quiz / praktik",0]]},[i]);o.useMemo(()=>[...i].sort((a,n)=>{const r=new Date(a.updatedAtRaw||0).getTime();return new Date(n.updatedAtRaw||0).getTime()-r}).slice(0,5).map(a=>[`Tutorial "${a.title}" ${a.status==="Published"?"dipublish / diupdate":"disimpan"}`,a.updatedAtWithTime,a.status==="Published"?"green":a.status==="Pending Review"?"purple":"orange"]),[i]),o.useEffect(()=>{b(1)},[N,A,k,M]);const y=Math.max(1,Math.ceil(j.length/P));o.useEffect(()=>{b(a=>Math.min(a,y))},[y]);const $=o.useMemo(()=>{const a=(p-1)*P;return j.slice(a,a+P)},[j,p]),v=o.useMemo(()=>i.find(a=>String(a.id)===String(x))||null,[i,x]),oe=j.length?(p-1)*P+1:0,ce=Math.min(p*P,j.length),ue=()=>{D(""),G(""),J(""),O(""),b(1)};return e.jsxs("main",{className:`admin-dashboard-page admin-tutorial-page${t?" admin-dashboard-page--collapsed":""}`,children:[e.jsx(ve,{isCollapsed:t,onToggleCollapse:ie}),e.jsxs("section",{className:"admin-dashboard-main","aria-label":"Tutorial dan materi admin",children:[e.jsx(ke,{searchTerm:N,onSearchChange:D}),e.jsxs("div",{className:"admin-users-layout admin-tutorial-layout",children:[e.jsxs("section",{className:"admin-users-content admin-tutorial-content",children:[e.jsx("div",{className:"admin-users-heading",children:e.jsxs("div",{children:[e.jsx("h1",{children:"Tutorial / Materi"}),e.jsxs("p",{children:["Dashboard ",e.jsx("span",{children:"/"})," Tutorial / Materi"]})]})}),I&&e.jsx("div",{className:"admin-form-message is-error",role:"alert",style:{marginBottom:16},children:I}),e.jsx("section",{className:"admin-users-summary","aria-label":"Ringkasan tutorial",children:ne.map(a=>e.jsxs("article",{className:"admin-users-stat",children:[e.jsx("span",{className:`admin-tutorial-stat-tone is-${a.tone}`,children:e.jsx("img",{src:a.icon,alt:""})}),e.jsxs("div",{children:[e.jsx("p",{children:a.label}),e.jsx("strong",{children:a.value}),e.jsx("small",{children:a.note})]})]},a.label))}),e.jsxs("section",{className:"admin-users-filter","aria-label":"Filter tutorial",children:[e.jsxs("div",{className:"admin-users-filter-row",children:[e.jsx("label",{className:"admin-users-search",children:e.jsx("input",{type:"search",placeholder:"Cari judul tutorial...",value:N,onChange:a=>D(a.target.value)})}),e.jsx("button",{type:"button",onClick:ue,children:"Reset Filter"}),e.jsx("button",{type:"button",onClick:E,children:T?"Memuat...":"Muat Ulang"}),e.jsx("a",{className:"admin-users-primary",href:"/admin/tutorial/tambah",children:"+ Tambah Materi"})]}),e.jsxs("div",{className:"admin-users-select-grid",children:[e.jsxs("label",{children:[e.jsx("span",{children:"Status"}),e.jsxs("select",{value:A,onChange:a=>G(a.target.value),children:[e.jsx("option",{value:"",children:"Semua Status"}),e.jsx("option",{value:"Published",children:"Published"}),e.jsx("option",{value:"Draft",children:"Draft"}),e.jsx("option",{value:"Pending Review",children:"Pending Review"}),e.jsx("option",{value:"Archived",children:"Archived"})]})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Kategori"}),e.jsxs("select",{value:k,onChange:a=>J(a.target.value),children:[e.jsx("option",{value:"",children:"Semua Kategori"}),le.map(a=>e.jsx("option",{value:a,children:a},a))]})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Level"}),e.jsxs("select",{value:M,onChange:a=>O(a.target.value),children:[e.jsx("option",{value:"",children:"Semua Level"}),de.map(a=>e.jsx("option",{value:a,children:a},a))]})]}),e.jsxs("label",{children:[e.jsx("span",{children:"Author / Admin"}),e.jsx("select",{value:"",disabled:!0,children:e.jsx("option",{value:"",children:"Admin"})})]})]})]}),e.jsxs("section",{className:"admin-users-table-card",children:[e.jsxs("div",{className:"admin-users-table-header",children:[e.jsxs("div",{children:[e.jsx("h2",{children:"Daftar Tutorial / Materi"}),e.jsxs("p",{children:[j.length," materi ditemukan"]})]}),e.jsxs("span",{children:[$.length," ditampilkan"]})]}),e.jsx("div",{className:"admin-tutorial-table-scroll",children:e.jsxs("table",{className:"admin-users-table admin-tutorial-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Judul Tutorial"}),e.jsx("th",{children:"Kategori"}),e.jsx("th",{children:"Level"}),e.jsx("th",{children:"Akses"}),e.jsx("th",{children:"Status"}),e.jsx("th",{children:"Author"}),e.jsx("th",{children:"Viewer"}),e.jsx("th",{children:"Selesai"}),e.jsx("th",{children:"Tgl Dibuat"}),e.jsx("th",{children:"Tgl Publish"}),e.jsx("th",{children:"Update Terakhir"}),e.jsx("th",{children:"Aksi"})]})}),e.jsx("tbody",{children:T?e.jsx("tr",{children:e.jsx("td",{colSpan:"12",style:{textAlign:"center",padding:28},children:"Memuat data materi dari API deploy..."})}):I?e.jsx("tr",{children:e.jsxs("td",{colSpan:"12",style:{textAlign:"center",padding:28},children:["Gagal mengambil data SQLite. ",I]})}):$.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:"12",style:{textAlign:"center",padding:28},children:"Belum ada data materi yang cocok dengan filter."})}):$.map((a,n)=>{const r=String(a.id??a.slug??a.title);return e.jsxs("tr",{className:(s==null?void 0:s.id)===a.id?"is-selected":"",children:[e.jsx("td",{children:e.jsxs("button",{type:"button",className:"admin-users-name-button",onClick:()=>W(a),children:[a.cardImageUrl?e.jsx("img",{className:`admin-tutorial-thumb is-${n%4}`,src:a.cardImageUrl,alt:`Thumbnail ${a.title}`,loading:"lazy",onError:d=>B(d,a.cardImageName)}):e.jsx("span",{className:`admin-tutorial-thumb is-${n%4}`,"aria-hidden":"true"}),e.jsxs("span",{children:[e.jsx("b",{children:a.title}),e.jsx("small",{children:a.description})]})]})}),e.jsx("td",{children:e.jsx(w,{children:a.category})}),e.jsx("td",{children:e.jsx(w,{children:a.level})}),e.jsx("td",{children:e.jsx(X,{accessType:a.accessType,price:a.price})}),e.jsx("td",{children:e.jsx(w,{children:a.status})}),e.jsx("td",{children:a.author}),e.jsx("td",{children:a.viewer}),e.jsx("td",{children:a.completed}),e.jsx("td",{children:a.createdAt}),e.jsx("td",{children:a.publishedAt}),e.jsx("td",{children:a.updatedAt}),e.jsx("td",{children:e.jsx("div",{className:"admin-users-actions admin-users-action-menu",children:e.jsx("button",{type:"button",className:"admin-users-action-trigger",ref:d=>{d?L.current.set(r,d):L.current.delete(r)},"aria-label":`Buka aksi untuk ${a.title}`,"aria-expanded":String(x)===r,onClick:()=>f(d=>String(d)===r?null:r),children:"..."})})})]},a.id||a.slug||a.title)})})]})}),e.jsxs("div",{className:"admin-users-pagination",children:[e.jsx("button",{type:"button",onClick:()=>b(a=>Math.max(1,a-1)),disabled:p<=1,children:"Previous"}),e.jsx("div",{children:Array.from({length:y},(a,n)=>n+1).slice(Math.max(0,p-3),Math.max(0,p-3)+5).map(a=>e.jsx("button",{type:"button",className:a===p?"is-active":"",onClick:()=>b(a),children:a},a))}),e.jsxs("span",{children:["Page ",p," of ",y,e.jsxs("small",{children:["Menampilkan ",oe," - ",ce," dari"," ",j.length," materi"]})]}),e.jsx("button",{type:"button",onClick:()=>b(a=>Math.min(y,a+1)),disabled:p>=y,children:"Next"})]})]}),e.jsxs("section",{className:"admin-users-bottom admin-tutorial-bottom-program",children:[e.jsxs("article",{className:"admin-users-panel",children:[e.jsx("h2",{children:"Materi Terbaru"}),K.length===0?e.jsx("p",{children:"Belum ada materi."}):K.map((a,n)=>e.jsxs("p",{children:[a.cardImageUrl?e.jsx("img",{className:"admin-tutorial-mini-thumb",src:a.cardImageUrl,alt:"",onError:r=>B(r,a.cardImageName)}):e.jsx("span",{className:`admin-tutorial-mini-thumb admin-tutorial-thumb is-${n%4}`,"aria-hidden":"true"}),e.jsx("b",{children:a.title}),e.jsx("span",{children:a.category}),e.jsx("span",{children:a.createdAt}),e.jsx(w,{children:a.status})]},a.id||a.slug))]}),e.jsxs("article",{className:"admin-users-panel",children:[e.jsx("h2",{children:"Draft Perlu Dilanjutkan"}),V.length===0?e.jsx("p",{children:"Tidak ada draft."}):V.map(a=>e.jsxs("p",{children:[e.jsx("span",{className:"admin-tutorial-draft-dot","aria-hidden":"true"}),e.jsx("b",{children:a.title}),e.jsx("span",{children:a.author}),e.jsx("span",{children:a.updatedAt}),e.jsx(w,{children:a.status})]},a.id||a.slug))]}),e.jsxs("article",{className:"admin-users-panel admin-tutorial-summary-panel",children:[e.jsx("h2",{children:"Ringkasan Materi"}),e.jsxs("p",{children:[e.jsx("span",{children:"Published"}),e.jsx("strong",{children:i.filter(a=>a.status==="Published").length})]}),e.jsxs("p",{children:[e.jsx("span",{children:"Draft"}),e.jsx("strong",{children:i.filter(a=>a.status==="Draft").length})]}),e.jsxs("p",{children:[e.jsx("span",{children:"Pending Review"}),e.jsx("strong",{children:i.filter(a=>a.status==="Pending Review").length})]}),e.jsxs("p",{children:[e.jsx("span",{children:((Q=q[0])==null?void 0:Q[0])||"Thumbnail kosong"}),e.jsx("strong",{children:((Z=q[0])==null?void 0:Z[1])||0})]}),e.jsx("a",{href:"/admin/tutorial/tambah",className:"admin-users-primary",children:"Buat Materi Baru"}),e.jsx("button",{type:"button",onClick:E,children:"Refresh Data SQLite"})]})]})]}),v?e.jsxs("div",{className:"admin-users-action-popover",role:"menu",style:{top:`${H.top}px`,left:`${H.left}px`},children:[e.jsx("button",{type:"button",role:"menuitem",onClick:()=>W(v),children:"Detail"}),e.jsx("button",{type:"button",role:"menuitem",onClick:()=>re(v),children:"Edit Materi"}),e.jsx("button",{type:"button",role:"menuitem",className:"admin-users-action-danger",disabled:R===v.id,onClick:()=>se(v),children:R===v.id?"Menghapus...":"Hapus Materi"})]}):null,e.jsx("style",{children:`
            .admin-tutorial-access-badge {
              display: inline-flex;
              flex-direction: column;
              align-items: flex-start;
              justify-content: center;
              min-width: 72px;
              min-height: 30px;
              gap: 2px;
              padding: 5px 9px;
              border: 1px solid transparent;
              border-radius: 8px;
              line-height: 1.1;
              white-space: nowrap;
            }

            .admin-tutorial-access-badge strong {
              font-size: 11px;
              font-weight: 800;
            }

            .admin-tutorial-access-badge small {
              font-size: 9px;
              font-weight: 700;
            }

            .admin-tutorial-access-badge.is-free {
              border-color: #bbf7d0;
              background: #ecfdf3;
              color: #15803d;
            }

            .admin-tutorial-access-badge.is-premium {
              border-color: #fed7aa;
              background: #fff7ed;
              color: #ea580c;
            }

            .admin-tutorial-access-badge.is-login {
              border-color: #bfdbfe;
              background: #eff6ff;
              color: #1d4ed8;
            }

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
          `}),s&&e.jsx("div",{className:"admin-tutorial-modal-backdrop",role:"presentation",onMouseDown:a=>{a.target===a.currentTarget&&g(null)},children:e.jsxs("section",{className:"admin-tutorial-modal",role:"dialog","aria-modal":"true","aria-labelledby":"admin-tutorial-detail-title",children:[e.jsxs("div",{className:"admin-tutorial-detail-head",children:[e.jsx("h2",{id:"admin-tutorial-detail-title",children:"Detail Materi"}),e.jsx("button",{type:"button","aria-label":"Tutup detail",onClick:()=>g(null),children:"×"})]}),e.jsxs("div",{className:"admin-tutorial-modal-body",children:[e.jsxs("div",{className:"admin-tutorial-detail-profile",children:[s.cardImageUrl?e.jsx("img",{className:"admin-tutorial-detail-image",src:s.cardImageUrl,alt:`Thumbnail ${s.title}`,onError:a=>B(a,s.cardImageName)}):e.jsx("span",{className:"admin-tutorial-detail-image","aria-hidden":"true"}),e.jsxs("div",{children:[e.jsx("h3",{children:s.title}),e.jsx(w,{children:s.status})]})]}),e.jsxs("dl",{className:"admin-tutorial-detail-list",children:[e.jsx("dt",{children:"Kategori"}),e.jsx("dd",{children:s.category}),e.jsx("dt",{children:"Level"}),e.jsx("dd",{children:s.level}),e.jsx("dt",{children:"Akses Materi"}),e.jsx("dd",{children:e.jsx(X,{accessType:s.accessType,price:s.price})}),e.jsx("dt",{children:"Harga"}),e.jsx("dd",{children:s.accessType==="Premium"?ee(s.price):"Gratis"}),e.jsx("dt",{children:"Author"}),e.jsx("dd",{children:s.author}),e.jsx("dt",{children:"Slug"}),e.jsx("dd",{children:s.slug||"-"}),e.jsx("dt",{children:"Total Bab"}),e.jsx("dd",{children:Array.isArray(s.chapters)?s.chapters.length:0}),e.jsx("dt",{children:"Total Materi"}),e.jsx("dd",{children:s.totalSlides})]}),e.jsxs("section",{className:"admin-tutorial-modal-section",children:[e.jsx("h3",{children:"Deskripsi Singkat"}),e.jsx("p",{children:s.description||"-"})]}),e.jsxs("section",{className:"admin-tutorial-modal-section",children:[e.jsx("h3",{children:"Deskripsi Lengkap"}),e.jsx("p",{children:ae(s.fullDescription)||"-"})]}),e.jsxs("section",{className:"admin-tutorial-modal-section",children:[e.jsx("h3",{children:"Bab & Materi"}),Array.isArray(s.chapters)&&s.chapters.length>0?e.jsx("div",{className:"admin-tutorial-chapter-list",children:s.chapters.map((a,n)=>{const r=Array.isArray(s.slides)?s.slides.filter(d=>String(d.chapter_id??"")===String(a.id??"")):[];return e.jsxs("article",{className:"admin-tutorial-chapter-card",children:[e.jsxs("header",{children:[e.jsx("strong",{children:a.title||`Bab ${n+1}`}),e.jsxs("small",{children:[r.length," materi"]})]}),r.length>0?e.jsx("div",{className:"admin-tutorial-material-list",children:r.map((d,c)=>e.jsxs("div",{className:"admin-tutorial-material-item",children:[e.jsx("strong",{children:d.title||`Materi ${c+1}`}),e.jsx("small",{children:Y(d)||`Jenis: ${d.content_type||"materi"}`})]},d.id??`detail-slide-${n}-${c}`))}):e.jsx("small",{children:"Belum ada materi pada bab ini."})]},a.id??`detail-chapter-${n}`)})}):Array.isArray(s.slides)&&s.slides.length>0?e.jsx("div",{className:"admin-tutorial-material-list",children:s.slides.map((a,n)=>e.jsxs("div",{className:"admin-tutorial-material-item",children:[e.jsx("strong",{children:a.title||`Materi ${n+1}`}),e.jsx("small",{children:Y(a)||`Jenis: ${a.content_type||"materi"}`})]},a.id??`detail-slide-${n}`))}):e.jsx("p",{children:"Belum ada bab atau materi."})]}),e.jsxs("section",{className:"admin-tutorial-detail-stats",children:[e.jsxs("article",{children:[e.jsx("span",{children:"Viewer"}),e.jsx("strong",{children:s.viewer})]}),e.jsxs("article",{children:[e.jsx("span",{children:"User Selesai"}),e.jsx("strong",{children:s.completed})]}),e.jsxs("article",{children:[e.jsx("span",{children:"Estimasi Waktu"}),e.jsx("strong",{children:s.estimatedTime})]}),e.jsxs("article",{children:[e.jsx("span",{children:"Tanggal Publish"}),e.jsx("strong",{children:s.publishedAt})]})]}),e.jsxs("section",{className:"admin-tutorial-history",children:[e.jsx("h3",{children:"Riwayat Update Terakhir"}),e.jsxs("p",{children:[s.updatedAtWithTime," oleh"," ",s.author]})]})]})]})})]})]})]})}export{Ce as AdminTutorial};
