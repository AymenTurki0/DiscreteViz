export const inputType = localStorage.getItem("inputType") || "step";

// Recurrent equation coefficients from G(z)
export let a, b;

const tfData = JSON.parse(localStorage.getItem("tf"));
if(!tfData){
    alert("Aucune fonction de transfert trouvée. Retour à la page d'entrée.");
    window.location.href = "input.html";
}

function parsePolynomial(polyStr){
    const cleanStr = polyStr.replace(/\s+/g,'');
    const terms = cleanStr.split(/(?=[+-])/);
    let maxDegree = 0;
    for(const term of terms){
        if(term.includes('z^')) maxDegree = Math.max(maxDegree, parseInt(term.split('z^')[1]));
        else if(term.includes('z')) maxDegree = Math.max(maxDegree,1);
    }
    const coeffs = Array(maxDegree+1).fill(0);
    for(const term of terms){
        if(term==='') continue;
        let coeff, degree;
        if(term.includes('z^')){
            const parts = term.split('z^');
            coeff = parts[0]===''||parts[0]==='+' ? 1 : parts[0]==='-'?-1:parseFloat(parts[0]);
            degree = parseInt(parts[1]);
        } else if(term.includes('z')){
            const parts = term.split('z');
            coeff = parts[0]===''||parts[0]==='+' ? 1 : parts[0]==='-'?-1:parseFloat(parts[0]);
            degree = 1;
        } else {
            coeff = parseFloat(term);
            degree = 0;
        }
        coeffs[maxDegree-degree] = coeff;
    }
    return coeffs;
}

a = parsePolynomial(tfData.denominator);
b = parsePolynomial(tfData.numerator);

// --- Functions ---
export function generateInput(n,type){
    const u=[];
    for(let k=0;k<n;k++){
        switch(type){
            case "step": u.push(1); break;
            case "ramp": u.push(k); break;
            case "impulse": u.push(k===0?1:0); break;
            case "sinus": u.push(Math.sin(2*Math.PI*k/n)); break;
            default: u.push(1); break;
        }
    }
    return u;
}

export function simulateSystem(u,a,b){
    const y=[];
    for(let k=0;k<u.length;k++){
        let yk=0;
        for(let i=1;i<a.length;i++) yk -= (y[k-i]||0)*a[i];
        for(let i=0;i<b.length;i++) yk += (u[k-i]||0)*b[i];
        y.push(yk);
    }
    return y;
}

export function formatNum(x){
    if(Math.abs(x)<1e-10) return '0';
    return Number.isInteger(x)?x.toString():x.toFixed(4).replace(/\.?0+$/,'');
}

export function plotCharts(y, yModel, u){
    const labels = y.map((_,i)=>i);
    const ctx1 = document.getElementById("chartOutput").getContext("2d");
    const ctx2 = document.getElementById("chartModel").getContext("2d");

    if(window.chartOut) window.chartOut.destroy();
    if(window.chartModel) window.chartModel.destroy();

    window.chartOut = new Chart(ctx1, {
        type:'line',
        data:{
            labels,
            datasets:[
                {label:"Entrée u[k]", data:u, borderColor:"#facc15", borderWidth:2, fill:false, borderDash:[5,5]},
                {label:"Sortie réelle y[k]", data:y, borderColor:"#38bdf8", borderWidth:2, fill:false}
            ]
        },
        options:{responsive:true, plugins:{legend:{display:true}}}
    });

    window.chartModel = new Chart(ctx2, {
        type:'line',
        data:{
            labels,
            datasets:[
                {label:"Sortie modélisée",data:yModel,borderColor:"#f472b6",borderWidth:2,fill:false},
                {label:"Sortie réelle",data:y,borderColor:"#38bdf8",borderWidth:1,fill:false, borderDash:[5,5]}
            ]
        },
        options:{responsive:true, plugins:{legend:{display:true}}}
    });

    let eq = `$$y[k] = `;
    for(let i=1;i<a.length;i++){
        if(a[i]!==0) eq += `${a[i]>0?'-':'+'} ${formatNum(Math.abs(a[i]))} y[k-${i}] `;
    }
    for(let i=0;i<b.length;i++){
        if(b[i]!==0) eq += `${b[i]>0?'+':'-'} ${formatNum(Math.abs(b[i]))} u[k-${i}] `;
    }
    eq += `$$`;
    document.getElementById("armaEq").innerHTML = eq;
}
