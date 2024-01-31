require("regenerator-runtime/runtime");var e=require("axios");function t(e){return e&&e.__esModule?e.default:e}const a=(e,t,a=7)=>{s();let o=`<div class='alert alert--${e}'>${t}</div>`;document.querySelector("body").insertAdjacentHTML("afterbegin",o),setTimeout(s,1e3*a)},s=()=>{let e=document.querySelector(".alert");e&&e.parentElement.removeChild(e)},o=async(s,o)=>{try{let r=await t(e)({method:"POST",url:"/api/v1/users/login",data:{email:s,password:o}});"success"===r.data.status&&(a("success","logged in successfully"),setTimeout(()=>{location.assign("/")},1500))}catch(e){a("error",e.response.data.message)}},r=async(s,o,r,n)=>{try{let d=await t(e)({method:"POST",url:"/api/v1/users/signup",data:{name:s,email:o,password:r,passwordConfirm:n}});"success"===d.data.status&&(a("success","Account created successfully!"),window.setTimeout(()=>{location.assign("/")},1500))}catch(e){a("error",e.response.data.message)}},n=async()=>{try{let a=await t(e)({method:"GET",url:"/api/v1/users/logout"});"success"===a.data.status&&location.assign("/login")}catch(e){a("error","Error logging out! try again")}},d=async(s,o)=>{try{let r=await t(e)({method:"PATCH",url:"password"===o?"/api/v1/users/updateMyPassword":"/api/v1/users/updateMe",data:s});"success"===r.data.status&&a("success",`${o.toUpperCase()} updated successfully!`)}catch(e){a("error",e.response.data.message)}},u=Stripe("pk_test_51LsRpBJddqQBmSsEy6d7Xnx2x96O79KQf5BA7agqOfoVZY0ReCpqkTLuof8WSQGo7WHw73BEKNlZFsxPf1LGBIXc00RNouRXCe"),c=async s=>{try{let a=await t(e)(`/api/v1/bookings/checkout-session/${s}`);await u.redirectToCheckout({sessionId:a.data.session.id})}catch(e){console.log(e),a("error",e)}},l=document.querySelector("#map"),m=document.querySelector(".form--login"),i=document.querySelector(".form--signup"),p=document.querySelector(".nav__el--logout"),g=document.querySelector(".form-user-data"),y=document.querySelector(".form-user-password"),w=document.getElementById("book-tour");l&&(e=>{mapboxgl.accessToken="pk.eyJ1IjoidG9sYW5pc2lyaXVzIiwiYSI6ImNscm1ucjYzZjA0N3MyanFsc25mOWJybjIifQ.pORofzlGVpCPqEzIVg3l2w";let t=new mapboxgl.Map({container:"map",style:"mapbox://styles/tolanisirius/cl8zdhlw1005s14ldvwgj3bra/draft",scrollZoom:!1}),a=new mapboxgl.LngLatBounds;e.forEach(e=>{let s=document.createElement("div");s.className="marker",new mapboxgl.Marker({element:s,anchor:"bottom"}).setLngLat(e.coordinates).addTo(t),new mapboxgl.Popup({offset:30}).setLngLat(e.coordinates).setHTML(`<p>Day ${e.day}: ${e.description}</p>`).addTo(t),a.extend(e.coordinates)}),t.fitBounds(a,{padding:{top:200,bottom:150,left:100,right:100}})})(JSON.parse(l.dataset.locations)),m&&m.addEventListener("submit",e=>{e.preventDefault(),o(document.getElementById("email").value,document.getElementById("password").value)}),i&&i.addEventListener("submit",e=>{e.preventDefault();let t=document.getElementById("name").value;r(t,document.getElementById("email").value,document.getElementById("password").value,document.getElementById("password-confirm").value)}),p&&p.addEventListener("click",n),g&&g.addEventListener("submit",e=>{e.preventDefault();let t=new FormData;t.append("name",document.getElementById("name").value),t.append("email",document.getElementById("email").value),t.append("photo",document.getElementById("photo").files[0]),d(t,"data")}),y&&y.addEventListener("submit",async e=>{e.preventDefault(),document.querySelector(".btn--save-password").textContent="Updating...";let t=document.getElementById("password-current").value,a=document.getElementById("password").value,s=document.getElementById("password-confirm").value;await d({passwordCurrent:t,password:a,passwordConfirm:s},"password"),document.querySelector(".btn--save-password").textContent="save password",document.getElementById("password-current").value="",document.getElementById("password").value="",document.getElementById("password-confirm").value=""}),w&&w.addEventListener("click",e=>{e.target.textContent="Processing ...";let{tourId:t}=e.target.dataset;c(t)});const v=document.querySelector("body").dataset.alert;v&&a("success",v,20);
//# sourceMappingURL=index.js.map
